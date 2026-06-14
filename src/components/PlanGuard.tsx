import { useAuth } from '../hooks/useAuth';
import type { UserPlan } from '../contexts/AuthContext';

const PLAN_RANK: Record<UserPlan, number> = {
  free: 0,
  pro: 1,
  enterprise: 2
};

interface PlanGuardProps {
  required: UserPlan;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onBack?: () => void;
}

/**
 * Gate any feature by plan level.
 *
 * <PlanGuard required="pro">
 *   <Step4AISummary />
 * </PlanGuard>
 */
export function PlanGuard({ required, children, fallback, onBack }: PlanGuardProps) {
  const { currentPlan } = useAuth();
  const hasAccess = PLAN_RANK[currentPlan] >= PLAN_RANK[required];

  if (hasAccess) return <>{children}</>;
  if (fallback) return <>{fallback}</>;

  return <UpgradePrompt required={required} currentPlan={currentPlan} onBack={onBack} />;
}

// ── Upgrade prompt ────────────────────────────────────────────────────────

const PLAN_LABELS: Record<UserPlan, string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise'
};

const PLAN_COLORS: Record<UserPlan, { bg: string; border: string; btn: string; badge: string }> = {
  free: { bg: '', border: '', btn: '', badge: '' },
  pro: {
    bg: '#faf5ff',
    border: '#e9d5ff',
    btn: '#7c3aed',
    badge: '#7c3aed'
  },
  enterprise: {
    bg: '#fffbeb',
    border: '#fde68a',
    btn: '#d97706',
    badge: '#d97706'
  }
};

const PLAN_FEATURES: Record<UserPlan, string[]> = {
  pro: [
    'AI-powered audit summaries',
    'Multi-page PDF export',
    'Unlimited file uploads',
    'Priority email support'
  ],
  enterprise: [
    'Everything in Pro',
    'Team collaboration & comments',
    'ERP integrations (QuickBooks, SAP)',
    'Custom branding on exports',
    'Dedicated account manager'
  ],
  free: []
};

function UpgradePrompt({ required, currentPlan, onBack }: { required: UserPlan; currentPlan: UserPlan; onBack?: () => void }) {
  const colors = PLAN_COLORS[required];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      textAlign: 'center',
      border: `1.5px dashed ${colors.border}`,
      borderRadius: '12px',
      background: colors.bg,
      minHeight: '260px'
    }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ← Go back
        </button>
      )}
      {/* Icon */}
      <div style={{
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        background: `${colors.badge}18`,
        border: `2px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem',
        fontSize: '22px'
      }}>
        {required === 'enterprise' ? '⭐' : '✦'}
      </div>

      {/* Badge */}
      <span style={{
        display: 'inline-block',
        background: `${colors.badge}18`,
        color: colors.badge,
        border: `1px solid ${colors.border}`,
        borderRadius: '99px',
        fontSize: '0.72rem',
        fontWeight: 700,
        padding: '3px 10px',
        marginBottom: '0.75rem',
        letterSpacing: '0.04em'
      }}>
        {PLAN_LABELS[required].toUpperCase()} PLAN
      </span>

      <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 700, color: '#111827' }}>
        This feature requires {PLAN_LABELS[required]}
      </h3>

      <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: '#6b7280', maxWidth: '380px' }}>
        You're on the <strong>{PLAN_LABELS[currentPlan]}</strong> plan.
        Upgrade to <strong style={{ color: colors.badge }}>{PLAN_LABELS[required]}</strong> to unlock this feature.
      </p>

      {/* Feature list */}
      {PLAN_FEATURES[required].length > 0 && (
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: '0 0 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
          textAlign: 'left'
        }}>
          {PLAN_FEATURES[required].map((f) => (
            <li key={f} style={{
              fontSize: '0.85rem',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ color: colors.badge, fontWeight: 700 }}>✓</span>
              {f}
            </li>
          ))}
        </ul>
      )}

      {/* CTA */}
      <button
        onClick={() => window.location.href = '/pricing'}
        style={{
          padding: '0.65rem 1.75rem',
          background: colors.btn,
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'opacity 0.15s'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        Upgrade to {PLAN_LABELS[required]} →
      </button>

      <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#9ca3af' }}>
        Cancel anytime · Secure payment by Stripe
      </p>
    </div>
  );
}