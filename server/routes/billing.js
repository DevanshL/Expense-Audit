const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const PLAN_MAP = {
  [process.env.STRIPE_PRO_MONTHLY_PRICE_ID]:  { plan: 'pro',        interval: 'monthly' },
  [process.env.STRIPE_PRO_YEARLY_PRICE_ID]:   { plan: 'pro',        interval: 'yearly'  },
  [process.env.STRIPE_ENT_MONTHLY_PRICE_ID]:  { plan: 'enterprise', interval: 'monthly' },
  [process.env.STRIPE_ENT_YEARLY_PRICE_ID]:   { plan: 'enterprise', interval: 'yearly'  },
};

/**
 * @route POST /api/billing/create-checkout
 * @desc Create Stripe checkout session for plan upgrade
 * @access Private
 */
router.post('/create-checkout', authenticateToken, async (req, res) => {
  try {
    const { priceId } = req.body;

    if (!priceId) {
      return res.status(400).json({ success: false, message: 'priceId is required' });
    }

    if (!PLAN_MAP[priceId]) {
      return res.status(400).json({ success: false, message: 'Invalid price ID' });
    }

    const sessionParams = {
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?upgraded=1`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?cancelled=1`,
      metadata: { userId: req.user._id.toString() },
      subscription_data: {
        metadata: { userId: req.user._id.toString() }
      }
    };

    // Reuse existing Stripe customer if available, else prefill email
    if (req.user.stripe?.customerId) {
      sessionParams.customer = req.user.stripe.customerId;
    } else {
      sessionParams.customer_email = req.user.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    logger.info('Checkout session created', {
      userId: req.user._id,
      priceId,
      plan: PLAN_MAP[priceId].plan
    });

    res.json({ success: true, url: session.url });

  } catch (error) {
    logger.error('Create checkout error:', { message: error.message, userId: req.user?._id });
    res.status(500).json({ success: false, message: 'Failed to create checkout session' });
  }
});

/**
 * @route POST /api/billing/create-portal
 * @desc Open Stripe customer portal (manage/cancel subscription)
 * @access Private
 */
router.post('/create-portal', authenticateToken, async (req, res) => {
  try {
    if (!req.user.stripe?.customerId) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found. Please upgrade first.'
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: req.user.stripe.customerId,
      return_url: `${process.env.FRONTEND_URL}/settings`
    });

    logger.info('Billing portal session created', { userId: req.user._id });
    res.json({ success: true, url: session.url });

  } catch (error) {
    logger.error('Create portal error:', { message: error.message, userId: req.user?._id });
    res.status(500).json({ success: false, message: 'Failed to open billing portal' });
  }
});

/**
 * @route GET /api/billing/status
 * @desc Get current user's billing plan and subscription status
 * @access Private
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('stripe');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        plan: user.stripe?.plan || 'free',
        interval: user.stripe?.planInterval || null,
        currentPeriodEnd: user.stripe?.currentPeriodEnd || null,
        cancelAtPeriodEnd: user.stripe?.cancelAtPeriodEnd || false,
        hasActiveSubscription: !!(user.stripe?.subscriptionId)
      }
    });

  } catch (error) {
    logger.error('Billing status error:', { message: error.message, userId: req.user?._id });
    res.status(500).json({ success: false, message: 'Failed to get billing status' });
  }
});

/**
 * @route GET /api/billing/prices
 * @desc Return available plan price IDs for frontend checkout buttons
 * @access Public
 */
router.get('/prices', (req, res) => {
  res.json({
    success: true,
    data: {
      free: {
        priceId: process.env.STRIPE_FREE_PRICE_ID,
        amount: 0,
        interval: 'monthly'
      },
      pro: {
        monthly: {
          priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
          amount: 1900,
          interval: 'monthly'
        },
        yearly: {
          priceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
          amount: 19000,
          interval: 'yearly'
        }
      },
      enterprise: {
        monthly: {
          priceId: process.env.STRIPE_ENT_MONTHLY_PRICE_ID,
          amount: 4900,
          interval: 'monthly'
        },
        yearly: {
          priceId: process.env.STRIPE_ENT_YEARLY_PRICE_ID,
          amount: 49000,
          interval: 'yearly'
        }
      }
    }
  });
});

module.exports = router;