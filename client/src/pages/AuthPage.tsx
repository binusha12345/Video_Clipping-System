import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRightLeft, User } from 'lucide-react';

/**
 * This build has no accounts. The auth page is kept as a thin informational
 * placeholder so any stray /auth nav targets render something sensible; there
 * is no register/login/refresh flow.
 */
export default function AuthPage() {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Real auth endpoints do not exist in this build, so these handlers are
  // intentionally no-ops that keep the page usable and informative.
  const handleLogin = async () => { /* no-op: no accounts */ };
  const handleRegister = async () => { /* no-op: no accounts */ };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand">
          <div className="auth-logo">
            <ClipSVG />
            <span>ClipForge AI</span>
          </div>
          <h1>ClipForge — no sign-in required</h1>
          <p>
            This build runs without an accounts system. Every visitor is treated
            as authenticated, so you can start clipping immediately — no
            registration or password required. Use the button below to jump to
            the dashboard, or keep reading to see how the old sign-in flow used
            to look.
          </p>
          <Link to="/dashboard" className="btn-primary">
            Go to Dashboard
          </Link>
        </div>

        {/* Retained as an informational placeholder; disabled in this build. */}
        <div className="auth-forms">
          {/* Login */}
          <div className={`auth-form ${view === 'login' ? 'active' : ''}`}>
            <h2>Sign in</h2>
            <div className="form-group">
              <label>Email</label>
              <div className="input-with-icon">
                <Mail size={18} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  disabled
                  defaultValue="user@clipforge.local"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  disabled
                />
                <button
                  type="button"
                  className="input-icon-btn"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary auth-submit"
              disabled
              onClick={() => {
                // In this build login is a no-op that just goes to the dashboard.
                handleLogin().finally(() => {
                  navigate('/dashboard');
                });
              }}
            >
              <ArrowRightLeft size={18} />
              Sign in
            </button>
            <div className="auth-switch">
              Don't have an account?{' '}
              <button type="button" className="auth-link" onClick={() => setView('register')}>
                Register
              </button>
            </div>
          </div>

          {/* Register */}
          <div className={`auth-form ${view === 'register' ? 'active' : ''}`}>
            <h2>Create account</h2>
            <div className="form-group">
              <label>Full name</label>
              <div className="input-with-icon">
                <User size={18} />
                <input type="text" placeholder="Jane Smith" disabled />
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <div className="input-with-icon">
                <Mail size={18} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  disabled
                  defaultValue="user@clipforge.local"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  disabled
                />
                <button
                  type="button"
                  className="input-icon-btn"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary auth-submit"
              disabled
              onClick={() => {
                // In this build registration is a no-op that just goes to the dashboard.
                handleRegister().finally(() => {
                  navigate('/dashboard');
                });
              }}
            >
              <ArrowRightLeft size={18} />
              Create account
            </button>
            <div className="auth-switch">
              Already have an account?{' '}
              <button type="button" className="auth-link" onClick={() => setView('login')}>
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClipSVG() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="url(#clipForgeAuthGrad)" />
      <path d="M9 11L14 16L9 21V11Z" fill="white" fillOpacity="0.9" />
      <path d="M19 21L14 16L19 11V21Z" fill="white" fillOpacity="0.9" />
      <defs>
        <linearGradient id="clipForgeAuthGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}
