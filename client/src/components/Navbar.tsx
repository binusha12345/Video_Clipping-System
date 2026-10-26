import { Link } from 'react-router-dom';
import { Scissors, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  // This build has no accounts; user is a stable mock so the navbar chip
  // always has something to display and the rest of the app keeps working.
  const { user } = useAuthStore();

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(6, 4, 15, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        {/* Logo */}
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Scissors size={18} color="white" />
          </div>
          <span className="font-display" style={{ fontWeight: 700, fontSize: '18px', color: '#f4f0ff' }}>
            Clip<span className="gradient-text">Forge</span> <span style={{ color: 'var(--color-primary-light)', fontSize: '13px', fontWeight: 500 }}>AI</span>
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link to="/dashboard" className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LayoutDashboard size={16} />
            Dashboard
          </Link>

          {/* User chip — informational only; this build has no accounts */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 12px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, color: 'white',
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'ClipForge User'}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
