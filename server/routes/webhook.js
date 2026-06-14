const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const logger = require('../utils/logger');

// Price ID → plan mapping (mirrors billing.js)
const PLAN_MAP = {
  [process.env.STRIPE_PRO_MONTHLY_PRICE_ID]:  { plan: 'pro',        interval: 'monthly' },
  [process.env.STRIPE_PRO_YEARLY_PRICE_ID]:   { plan: 'pro',        interval: 'yearly'  },
  [process.env.STRIPE_ENT_MONTHLY_PRICE_ID]:  { plan: 'enterprise', interval: 'monthly' },
  [process.env.STRIPE_ENT_YEARLY_PRICE_ID]:   { plan: 'enterprise', interval: 'yearly'  },
};

/**
 * @route POST /api/stripe/webhook
 * @desc Handle incoming Stripe webhook events
 * @access Public — Stripe signature verified internally
 *
 * CRITICAL: This route uses express.raw() NOT express.json()
 * Must be mounted in server.js BEFORE the express.json() middleware
 */
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    logger.warn('Webhook received without stripe-signature header');
    return res.status(400).send('Missing stripe-signature header');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logger.info('Webhook event received:', { type: event.type, id: event.id });

  try {
    switch (event.type) {

      /**
       * Fired when a user completes checkout and subscription is created
       */
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;

        if (!userId) {
          logger.warn('checkout.session.completed missing userId in metadata', { sessionId: session.id });
          break;
        }

        if (!session.subscription) {
          logger.warn('checkout.session.completed has no subscription', { sessionId: session.id });
          break;
        }

        // Fetch full subscription to get price ID and period end
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        const priceId = sub.items.data[0]?.price?.id;

        const planInfo = PLAN_MAP[priceId] || { plan: 'free', interval: null };
        const periodEnd = sub.current_period_end || sub.items?.data?.[0]?.current_period_end;

        await User.findByIdAndUpdate(userId, {
          'stripe.customerId': session.customer,
          'stripe.subscriptionId': session.subscription,
          'stripe.plan': planInfo.plan,
          'stripe.planInterval': planInfo.interval,
          'stripe.currentPeriodEnd': periodEnd ? new Date(periodEnd * 1000) : null,
          'stripe.cancelAtPeriodEnd': false
        });

        logger.info('Subscription activated', {
          userId,
          plan: planInfo.plan,
          interval: planInfo.interval
        });
        break;
      }

      /**
       * Fired when a subscription is upgraded, downgraded, or renewed
       */
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const user = await User.findOne({ 'stripe.subscriptionId': sub.id });

        if (!user) {
          logger.warn('subscription.updated — no user found for subscriptionId', { subId: sub.id });
          break;
        }

        const priceId = sub.items.data[0]?.price?.id;
        const planInfo = PLAN_MAP[priceId] || { plan: 'free', interval: null };
        const periodEnd = sub.current_period_end || sub.items?.data?.[0]?.current_period_end;

        await User.findByIdAndUpdate(user._id, {
          'stripe.plan': planInfo.plan,
          'stripe.planInterval': planInfo.interval,
          'stripe.currentPeriodEnd': periodEnd ? new Date(periodEnd * 1000) : null,
          'stripe.cancelAtPeriodEnd': sub.cancel_at_period_end
        });

        logger.info('Subscription updated', {
          userId: user._id,
          plan: planInfo.plan,
          cancelAtPeriodEnd: sub.cancel_at_period_end
        });
        break;
      }

      /**
       * Fired when subscription is cancelled (immediately or at period end)
       */
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const user = await User.findOne({ 'stripe.subscriptionId': sub.id });

        if (!user) {
          logger.warn('subscription.deleted — no user found for subscriptionId', { subId: sub.id });
          break;
        }

        await User.findByIdAndUpdate(user._id, {
          'stripe.plan': 'free',
          'stripe.planInterval': null,
          'stripe.subscriptionId': null,
          'stripe.currentPeriodEnd': null,
          'stripe.cancelAtPeriodEnd': false
        });

        logger.info('Subscription cancelled — downgraded to free', { userId: user._id });
        break;
      }

      /**
       * Fired when a payment fails (e.g. card declined on renewal)
       */
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const user = await User.findOne({ 'stripe.customerId': invoice.customer });

        if (user) {
          logger.warn('Payment failed', {
            userId: user._id,
            invoiceId: invoice.id,
            attemptCount: invoice.attempt_count,
            nextAttempt: invoice.next_payment_attempt
              ? new Date(invoice.next_payment_attempt * 1000)
              : null
          });
          // TODO Phase 5: send payment failure email notification
        }
        break;
      }

      /**
       * Fired when a payment succeeds (subscription renewal)
       */
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.billing_reason === 'subscription_cycle') {
          const user = await User.findOne({ 'stripe.customerId': invoice.customer });
          if (user) {
            logger.info('Subscription renewed successfully', { userId: user._id });
          }
        }
        break;
      }

      default:
        logger.debug('Unhandled webhook event type:', event.type);
    }

    res.json({ received: true });

  } catch (error) {
    logger.error('Webhook handler error:', {
      eventType: event.type,
      eventId: event.id,
      message: error.message,
      stack: error.stack
    });
    // Return 500 so Stripe retries the event
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;