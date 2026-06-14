import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import type { UserPlan } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

interface PriceData {
  priceId: string;
  amount: number;
  interval: string;
}

interface PricesResponse {
  free: PriceData;
  pro: { monthly: PriceData; yearly: PriceData };
  enterprise: { monthly: PriceData; yearly: PriceData };
}

const PLAN_LABELS: Record<UserPlan, string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise'
};

const PLAN_DESCRIPTIONS: Record<UserPlan, string> = {
  free: 'For individuals exploring forensic auditing',
  pro: 'For auditors who need the full toolkit',
  enterprise: 'For teams and compliance departments'
};

const PLAN_FEATURES: Record<UserPlan, { text: string; included: boolean }[]> = {
  free: [
    { text: 'Up to 500 transactions per audit', included: true },
    { text: 'Benford\'s Law analysis', included: true },
    { text: 'Interactive charts', included: true },
    { text: 'AI summaries (Step 4)', included: false },
    { text: 'PDF & CSV export (Step 5)', included: false },
    { text: 'Unlimited uploads', included: false },
  ],
  pro: [
    { text: 'Unlimited transactions per audit', included: true },
    { text: 'Benford\'s Law analysis', included: true },
    { text: 'Interactive charts', included: true },
    { text: 'AI summaries (Step 4)', included: true },
    { text: 'PDF & CSV export (Step 5)', included: true },
    { text: 'Priority support', included: true },
  ],
  enterprise: [
    { text: 'Everything in Pro', included: true },
    { text: 'Team collaboration', included: true },
    { text: 'ERP integrations', included: true },
    { text: 'Custom branding on exports', included: true },
    { text: 'Dedicated account manager', included: true },
    { text: 'SLA guarantee', included: true },
  ]
};

export function PricingPage() {
  const ctx = useContext(AuthContext);
  const currentPlan = ctx?.currentPlan ?? 'free';
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [prices, setPrices] = useState<PricesResponse | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Show upgrade=1 banner if redirected from successful checkout
  const upgraded = new URLSearchParams(window.location.search).get('upgraded');

  useEffect(() => {
    fetch(`${API_BASE}/billing/prices`)
      .then((r) => r.json())
      .then((d) => setPrices(d.data))
      .catch(() => setError('Failed to load pricing. Please refresh.'));
  }, []);

  const handleUpgrade = async (plan: UserPlan) => {
    if (!ctx) return;
    if (plan === 'free') return;
    if (!prices) return;

    const priceData = plan === 'pro'
      ? prices.pro[interval]
      : prices.enterprise[interval];

    setLoadingPlan(plan);
    setError(null);

    try {
      await ctx.createCheckout(priceData.priceId);
    } catch {
      setError('Failed to start checkout. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManage = async () => {
    if (!ctx) return;
    setLoadingPlan('manage');
    await ctx.openBillingPortal();
    setLoadingPlan(null);
  };

  const formatPrice = (amount: number) => `$${(amount / 100).toFixed(0)}`;

  const getPrice = (plan: UserPlan) => {
    if (!prices || plan === 'free') return '$0';
    const data = plan === 'pro' ? prices.pro[interval] : prices.enterprise[interval];
    const base = formatPrice(data.amount);
    return interval === 'yearly' ? `${base}/yr` : `${base}/mo`;
  };

  const plans: UserPlan[] = ['free', 'pro', 'enterprise'];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>

      {/* Upgraded banner */}
      {upgraded && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          color: '#166534',
          fontSize: '0.9rem',
          fontWeight: 500
        }}>
          Your plan has been upgraded successfully. Welcome aboard!
        </div>
      )}

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          color: '#991b1b',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem' }}>
          Simple, transparent pricing
        </h1>
        <p style={{ color: '#6b7280', margin: '0 0 1.5rem' }}>
          Start free. Upgrade when you need more.
        </p>

        {/* Interval toggle */}
        <div style={{
          display: 'inline-flex',
          background: '#f3f4f6',
          borderRadius: '8px',
          padding: '3px',
          gap: '2px'
        }}>
          {(['monthly', 'yearly'] as const).map((i) => (
            <button
              key={i}
              onClick={() => setInterval(i)}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                background: interval === i ? '#fff' : 'transparent',
                color: interval === i ? '#111827' : '#6b7280',
                boxShadow: interval === i ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              {i === 'monthly' ? 'Monthly' : 'Yearly (save 17%)'}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem'
      }}>
        {plans.map((plan) => {
          const isCurrent = plan === currentPlan;
          const isPopular = plan === 'pro';

          return (
            <div
              key={plan}
              style={{
                border: isPopular ? '2px solid #7c3aed' : '1.5px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem',
                background: '#fff',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {isPopular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#7c3aed',
                  color: '#fff',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 12px',
                  borderRadius: '99px',
                  letterSpacing: '0.04em'
                }}>
                  MOST POPULAR
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
                    {PLAN_LABELS[plan]}
                  </span>
                  {isCurrent && (
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      background: '#f0fdf4',
                      color: '#166534',
                      padding: '2px 8px',
                      borderRadius: '99px',
                      border: '1px solid #86efac'
                    }}>
                      Current plan
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7280' }}>
                  {PLAN_DESCRIPTIONS[plan]}
                </p>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#111827' }}>
                  {getPrice(plan)}
                </span>
                {plan !== 'free' && (
                  <span style={{ fontSize: '0.8rem', color: '#6b7280', marginLeft: '4px' }}>
                    {interval === 'monthly' ? '/month' : '/year'}
                  </span>
                )}
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', flexGrow: 1 }}>
                {PLAN_FEATURES[plan].map((f) => (
                  <li key={f.text} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                    color: f.included ? '#374151' : '#9ca3af',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ color: f.included ? '#16a34a' : '#d1d5db', fontSize: '1rem' }}>
                      {f.included ? '✓' : '✗'}
                    </span>
                    {f.text}
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              {isCurrent ? (
                plan === 'free' ? (
                  <button disabled style={disabledBtnStyle}>Current plan</button>
                ) : (
                  <button
                    onClick={handleManage}
                    disabled={loadingPlan === 'manage'}
                    style={secondaryBtnStyle}
                  >
                    {loadingPlan === 'manage' ? 'Opening...' : 'Manage subscription'}
                  </button>
                )
              ) : plan === 'free' ? (
                <button disabled style={disabledBtnStyle}>Free forever</button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={!!loadingPlan}
                  style={plan === 'pro' ? primaryBtnStyle : secondaryBtnStyle}
                >
                  {loadingPlan === plan ? 'Redirecting...' : `Upgrade to ${PLAN_LABELS[plan]}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: '#9ca3af' }}>
        Payments processed securely by Stripe. Cancel anytime from your billing portal.
      </p>
    </div>
  );
}

const primaryBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem',
  background: '#7c3aed',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '0.9rem',
  fontWeight: 600,
  cursor: 'pointer'
};

const secondaryBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem',
  background: '#fff',
  color: '#374151',
  border: '1.5px solid #d1d5db',
  borderRadius: '8px',
  fontSize: '0.9rem',
  fontWeight: 600,
  cursor: 'pointer'
};

const disabledBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem',
  background: '#f3f4f6',
  color: '#9ca3af',
  border: '1.5px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '0.9rem',
  fontWeight: 600,
  cursor: 'not-allowed'
};