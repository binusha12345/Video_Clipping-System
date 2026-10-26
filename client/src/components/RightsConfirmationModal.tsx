import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, X, Upload, Video } from 'lucide-react';

const RIGHTS_OPTIONS = [
  { value: 'OWNER', label: 'I Own This Content', desc: 'I created this video and own all rights to it.' },
  { value: 'LICENSED', label: 'I Have a License', desc: 'I have a formal license or explicit written permission from the rights holder.' },
  { value: 'CREATIVE_COMMONS', label: 'Creative Commons', desc: 'This content is published under a Creative Commons license that permits repurposing.' },
  { value: 'PUBLIC_DOMAIN', label: 'Public Domain', desc: 'This content is in the public domain with no copyright restrictions.' },
  { value: 'FAIR_USE_CLAIM', label: 'Fair Use Claim', desc: 'I believe this use qualifies as fair use under applicable law. I accept all associated risk.' },
];

interface Props {
  url: string;
  onConfirm: (rightsType: string, rightsSafeMode: boolean) => void;
  onClose: () => void;
}

export default function RightsConfirmationModal({ url, onConfirm, onClose }: Props) {
  const [selectedRights, setSelectedRights] = useState('');
  const [rightsSafeMode, setRightsSafeMode] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  const safeModeConflict = rightsSafeMode && selectedRights === 'FAIR_USE_CLAIM';
  const canConfirm = Boolean(selectedRights && confirmed && !safeModeConflict);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(6, 4, 15, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div className="animate-fade-in-up card" style={{
        width: '100%', maxWidth: '620px',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Rights & Permissions Confirmation</h2>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Required before processing content</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '8px' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '28px' }}>
          {/* Critical Warning */}
          <div className="copyright-banner" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '6px' }}>Important: ClipForge AI does NOT grant copyright permission</strong>
                <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px', lineHeight: 1.7, color: '#fcd34d' }}>
                  <li>This tool does not make third-party content copyright-free</li>
                  <li>This tool cannot guarantee monetization of processed content</li>
                  <li>You are solely responsible for ensuring you have the legal right to process this content</li>
                  <li>Using others' content without permission may violate copyright law</li>
                </ul>
              </div>
            </div>
          </div>

          {/* URL Display */}
          {url && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isYouTube ? <Video size={16} style={{ color: '#ef4444', flexShrink: 0 }} /> : <Upload size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />}
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
            </div>
          )}

          {/* Rights Type Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
              What is your relationship to this content? <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {RIGHTS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  id={`rights-${opt.value.toLowerCase()}`}
                  onClick={() => setSelectedRights(opt.value)}
                  style={{
                    padding: '12px 16px', borderRadius: '10px', border: '1px solid',
                    borderColor: selectedRights === opt.value ? 'rgba(139,92,246,0.6)' : 'var(--color-border)',
                    background: selectedRights === opt.value ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%',
                      border: `2px solid ${selectedRights === opt.value ? '#8b5cf6' : 'rgba(255,255,255,0.2)'}`,
                      background: selectedRights === opt.value ? '#8b5cf6' : 'transparent',
                      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {selectedRights === opt.value && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '2px' }}>{opt.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{opt.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Rights-Safe Mode */}
          <div style={{ padding: '14px 16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#6ee7b7', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={14} /> Enable Rights-Safe Mode (Recommended)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Restricts processing to owner-confirmed, licensed, or CC/public domain content only
                </div>
              </div>
              <button
                id="rights-safe-mode-toggle"
                onClick={() => setRightsSafeMode(!rightsSafeMode)}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: rightsSafeMode ? '#10b981' : 'rgba(255,255,255,0.12)',
                  transition: 'all 0.2s', position: 'relative', flexShrink: 0, marginLeft: '16px',
                }}
              >
                <div style={{
                  position: 'absolute', top: '3px',
                  left: rightsSafeMode ? '22px' : '3px',
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: 'white', transition: 'all 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }} />
              </button>
            </div>
          </div>

          {/* Rights-Safe Mode conflict */}
          {safeModeConflict && (
            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', marginBottom: '24px', fontSize: '13px', color: '#fca5a5' }}>
              Rights-Safe Mode excludes Fair Use claims. Pick another rights type, or turn off Rights-Safe Mode to continue with this claim.
            </div>
          )}

          {/* Final confirmation checkbox */}
          <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '28px' }}>
            <button
              id="rights-confirm-checkbox"
              onClick={() => setConfirmed(!confirmed)}
              style={{
                width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0, marginTop: '2px',
                border: `2px solid ${confirmed ? '#8b5cf6' : 'rgba(255,255,255,0.2)'}`,
                background: confirmed ? '#8b5cf6' : 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              {confirmed && <CheckCircle size={12} color="white" />}
            </button>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              I confirm that I have the legal right to process this content under the rights type selected above. I understand that ClipForge AI does not grant copyright permission and that I am solely responsible for compliance with applicable copyright laws.
            </span>
          </label>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onClose} className="btn-secondary" id="rights-cancel" style={{ flex: 1, justifyContent: 'center' }}>
              Cancel
            </button>
            <button
              id="rights-confirm-btn"
              onClick={() => canConfirm && onConfirm(selectedRights, rightsSafeMode)}
              className="btn-primary"
              disabled={!canConfirm}
              style={{ flex: 2, justifyContent: 'center' }}
            >
              <Shield size={16} />
              Confirm & Start Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
