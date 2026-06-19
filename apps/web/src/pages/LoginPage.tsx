import { useState, useEffect, useRef, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// ── Slider data ───────────────────────────────────────────────────────────────

const SLIDES = [
  {
    icon: (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="22" width="64" height="40" rx="6" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        <rect x="8" y="32" width="64" height="10" fill="rgba(255,255,255,0.18)" />
        <rect x="18" y="48" width="18" height="4" rx="2" fill="rgba(255,255,255,0.4)" />
        <rect x="44" y="48" width="20" height="4" rx="2" fill="rgba(255,255,255,0.25)" />
        <circle cx="60" cy="26" r="5" fill="rgba(255,200,100,0.6)" />
        <circle cx="66" cy="26" r="5" fill="rgba(255,120,80,0.5)" />
      </svg>
    ),
    headline: 'Full Card Lifecycle',
    sub: 'Issue, activate, block, hotlist and close cards across every state — all from one unified platform.',
  },
  {
    icon: (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M40 12 L62 22 L62 42 C62 55 52 65 40 68 C28 65 18 55 18 42 L18 22 Z" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        <path d="M30 40 L37 47 L52 32" stroke="rgba(100,255,180,0.9)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="55" cy="28" r="3" fill="rgba(255,255,255,0.25)" />
        <circle cx="25" cy="28" r="3" fill="rgba(255,255,255,0.25)" />
        <line x1="28" y1="28" x2="52" y2="28" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3 2" />
      </svg>
    ),
    headline: 'Maker-Checker Control',
    sub: 'Every sensitive operation requires dual approval. No single person can issue or modify a card unilaterally.',
  },
  {
    icon: (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="26" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        <circle cx="40" cy="40" r="16" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        <path d="M34 40 L38 44 L46 36" stroke="rgba(100,220,255,0.95)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="40" cy="18" r="3" fill="rgba(255,255,255,0.35)" />
        <circle cx="58" cy="29" r="3" fill="rgba(255,255,255,0.35)" />
        <circle cx="58" cy="51" r="3" fill="rgba(255,255,255,0.35)" />
        <circle cx="40" cy="62" r="3" fill="rgba(255,255,255,0.35)" />
        <circle cx="22" cy="51" r="3" fill="rgba(255,255,255,0.35)" />
        <circle cx="22" cy="29" r="3" fill="rgba(255,255,255,0.35)" />
      </svg>
    ),
    headline: '8-Layer Auth Engine',
    sub: 'Every transaction clears idempotency, card state, channel, limits, velocity, and optimistic-lock balance checks.',
  },
  {
    icon: (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="28" width="22" height="28" rx="4" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
        <rect x="46" y="20" width="22" height="36" rx="4" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
        <rect x="15" y="34" width="16" height="3" rx="1.5" fill="rgba(255,255,255,0.35)" />
        <rect x="15" y="40" width="10" height="3" rx="1.5" fill="rgba(255,255,255,0.2)" />
        <rect x="15" y="46" width="13" height="3" rx="1.5" fill="rgba(255,255,255,0.2)" />
        <rect x="49" y="28" width="16" height="3" rx="1.5" fill="rgba(255,255,255,0.35)" />
        <rect x="49" y="34" width="10" height="3" rx="1.5" fill="rgba(255,255,255,0.2)" />
        <rect x="49" y="40" width="13" height="3" rx="1.5" fill="rgba(255,255,255,0.2)" />
        <rect x="49" y="46" width="8" height="3" rx="1.5" fill="rgba(255,255,255,0.2)" />
        <path d="M34 42 C38 42 42 38 46 38" stroke="rgba(100,200,255,0.7)" strokeWidth="1.5" strokeDasharray="2 2" />
      </svg>
    ),
    headline: 'Immutable Audit Log',
    sub: 'Every state change is captured in an append-only audit trail — a tamper-evident record for compliance and forensics.',
  },
];

// ── Sign-in form ──────────────────────────────────────────────────────────────

function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {error && (
        <div className="auth-alert auth-alert-error">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M8 4.5v4M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          {error}
        </div>
      )}

      <div className="auth-field">
        <label className="auth-label" htmlFor="si-email">Email address</label>
        <div className="auth-input-wrap">
          <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.25"/><path d="M1.5 5.5L8 9.5l6.5-4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>
          <input
            id="si-email"
            className="auth-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
      </div>

      <div className="auth-field">
        <div className="auth-label-row">
          <label className="auth-label" htmlFor="si-password">Password</label>
          <button type="button" className="auth-forgot">Forgot password?</button>
        </div>
        <div className="auth-input-wrap">
          <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.25"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>
          <input
            id="si-password"
            className="auth-input auth-input-pw"
            type={showPw ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
            {showPw
              ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8C2.5 4.5 5 3 8 3s5.5 1.5 7 5c-1.5 3.5-4 5-7 5S2.5 11.5 1 8z" stroke="currentColor" strokeWidth="1.25"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.25"/><path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>
              : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8C2.5 4.5 5 3 8 3s5.5 1.5 7 5c-1.5 3.5-4 5-7 5S2.5 11.5 1 8z" stroke="currentColor" strokeWidth="1.25"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.25"/></svg>
            }
          </button>
        </div>
      </div>

      <button className="auth-submit" type="submit" disabled={loading}>
        {loading
          ? <><span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Signing in…</>
          : 'Sign in'}
      </button>

      <div className="auth-divider"><span>or continue with</span></div>

      <div className="auth-demo-creds">
        <p className="auth-demo-label">Demo credentials</p>
        <div className="auth-demo-grid">
          {[
            { email: 'admin@cardence.dev',    pw: 'Admin1234!',    role: 'Admin'    },
            { email: 'officer@cardence.dev',  pw: 'Officer1234!',  role: 'Officer'  },
            { email: 'approver@cardence.dev', pw: 'Approver1234!', role: 'Approver' },
            { email: 'viewer@cardence.dev',   pw: 'Viewer1234!',   role: 'Viewer'   },
          ].map(({ email: e, pw, role }) => (
            <button
              key={e}
              type="button"
              className="auth-demo-pill"
              onClick={() => { setEmail(e); setPassword(pw); }}
            >
              {role}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}

// ── Sign-up form ──────────────────────────────────────────────────────────────

function SignUpForm({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [role, setRole]           = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'First name is required';
    if (!lastName.trim())  e.lastName  = 'Last name is required';
    if (!email.trim())     e.email     = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (!role)             e.role      = 'Please select a role';
    if (!password)         e.password  = 'Password is required';
    else if (password.length < 8) e.password = 'Minimum 8 characters';
    if (confirm !== password) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="auth-success">
        <div className="auth-success-icon">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="17" stroke="#16a34a" strokeWidth="1.5"/><path d="M11 18l5 5 9-9" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h3 className="auth-success-title">Request submitted</h3>
        <p className="auth-success-text">
          Your access request has been sent to the system administrator.
          You will receive an email at <strong>{email}</strong> once your account is approved.
        </p>
        <button className="auth-submit" style={{ marginTop: '1.5rem' }} onClick={onSwitchToSignIn}>
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-row">
        <div className="auth-field">
          <label className="auth-label" htmlFor="su-fn">First name</label>
          <input
            id="su-fn"
            className={`auth-input ${errors.firstName ? 'auth-input-error' : ''}`}
            type="text"
            placeholder="Jane"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          {errors.firstName && <span className="auth-field-error">{errors.firstName}</span>}
        </div>
        <div className="auth-field">
          <label className="auth-label" htmlFor="su-ln">Last name</label>
          <input
            id="su-ln"
            className={`auth-input ${errors.lastName ? 'auth-input-error' : ''}`}
            type="text"
            placeholder="Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          {errors.lastName && <span className="auth-field-error">{errors.lastName}</span>}
        </div>
      </div>

      <div className="auth-field">
        <label className="auth-label" htmlFor="su-email">Work email</label>
        <div className="auth-input-wrap">
          <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.25"/><path d="M1.5 5.5L8 9.5l6.5-4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>
          <input
            id="su-email"
            className={`auth-input ${errors.email ? 'auth-input-error' : ''}`}
            type="email"
            placeholder="jane.doe@bank.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {errors.email && <span className="auth-field-error">{errors.email}</span>}
      </div>

      <div className="auth-field">
        <label className="auth-label" htmlFor="su-role">Requested role</label>
        <div className="auth-input-wrap">
          <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.25"/><path d="M2.5 13c0-2.485 2.462-4.5 5.5-4.5s5.5 2.015 5.5 4.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>
          <select
            id="su-role"
            className={`auth-input auth-select ${errors.role ? 'auth-input-error' : ''}`}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">Select a role…</option>
            <option value="officer">Officer — create customers, cards, submit transactions</option>
            <option value="approver">Approver — approve maker-checker requests</option>
            <option value="viewer">Viewer — read-only access</option>
          </select>
        </div>
        {errors.role && <span className="auth-field-error">{errors.role}</span>}
      </div>

      <div className="auth-field">
        <label className="auth-label" htmlFor="su-pw">Password</label>
        <div className="auth-input-wrap">
          <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.25"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>
          <input
            id="su-pw"
            className={`auth-input auth-input-pw ${errors.password ? 'auth-input-error' : ''}`}
            type={showPw ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
            {showPw
              ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8C2.5 4.5 5 3 8 3s5.5 1.5 7 5c-1.5 3.5-4 5-7 5S2.5 11.5 1 8z" stroke="currentColor" strokeWidth="1.25"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.25"/><path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>
              : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8C2.5 4.5 5 3 8 3s5.5 1.5 7 5c-1.5 3.5-4 5-7 5S2.5 11.5 1 8z" stroke="currentColor" strokeWidth="1.25"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.25"/></svg>
            }
          </button>
        </div>
        {errors.password && <span className="auth-field-error">{errors.password}</span>}
      </div>

      <div className="auth-field">
        <label className="auth-label" htmlFor="su-confirm">Confirm password</label>
        <div className="auth-input-wrap">
          <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.25"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>
          <input
            id="su-confirm"
            className={`auth-input ${errors.confirm ? 'auth-input-error' : ''}`}
            type={showPw ? 'text' : 'password'}
            placeholder="Repeat password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {errors.confirm && <span className="auth-field-error">{errors.confirm}</span>}
      </div>

      <button className="auth-submit" type="submit">Request access</button>

      <p className="auth-legal">
        By requesting access you agree to your organisation's data handling and acceptable-use policies.
      </p>
    </form>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab]       = useState<'signin' | 'signup'>('signin');
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % SLIDES.length);
    }, 4500);
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const goTo = (idx: number) => {
    setCurrent(idx);
    resetTimer();
  };

  return (
    <div className="auth-split">
      {/* ── Left panel — slider ─────────────────────────────── */}
      <div className="auth-left">
        <div className="auth-brand">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="rgba(255,255,255,0.15)" />
            <rect x="4" y="9" width="20" height="13" rx="2.5" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
            <rect x="4" y="13" width="20" height="4" fill="rgba(255,255,255,0.25)" />
            <rect x="7" y="18" width="6" height="1.5" rx="0.75" fill="rgba(255,255,255,0.5)" />
          </svg>
          <span className="auth-brand-name">Cardence</span>
        </div>

        <div className="auth-slider">
          {SLIDES.map((slide, i) => (
            <div
              key={i}
              className={`auth-slide ${i === current ? 'auth-slide-active' : i === (current - 1 + SLIDES.length) % SLIDES.length ? 'auth-slide-exit' : ''}`}
            >
              <div className="auth-slide-icon">{slide.icon}</div>
              <h2 className="auth-slide-headline">{slide.headline}</h2>
              <p className="auth-slide-sub">{slide.sub}</p>
            </div>
          ))}
        </div>

        <div className="auth-dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`auth-dot ${i === current ? 'auth-dot-active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="auth-left-footer">
          <span>Sandbox-grade issuer platform</span>
          <span className="auth-left-footer-sep">·</span>
          <span>NestJS · React · MySQL</span>
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────────── */}
      <div className="auth-right">
        <div className="auth-right-inner">
          <div className="auth-right-header">
            <h1 className="auth-right-title">
              {tab === 'signin' ? 'Welcome back' : 'Request access'}
            </h1>
            <p className="auth-right-sub">
              {tab === 'signin'
                ? 'Sign in to your Cardence workspace'
                : "Submit a request to join your team's workspace"}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${tab === 'signin' ? 'auth-tab-active' : ''}`}
              onClick={() => setTab('signin')}
            >
              Sign in
            </button>
            <button
              className={`auth-tab ${tab === 'signup' ? 'auth-tab-active' : ''}`}
              onClick={() => setTab('signup')}
            >
              Sign up
            </button>
          </div>

          {tab === 'signin'
            ? <SignInForm onSuccess={() => navigate('/', { replace: true })} />
            : <SignUpForm onSwitchToSignIn={() => setTab('signin')} />
          }
        </div>
      </div>
    </div>
  );
}
