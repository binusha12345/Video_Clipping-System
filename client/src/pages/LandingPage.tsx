import { Link } from 'react-router-dom';
import { Scissors, Zap, Shield, Film, Mic, Music, ArrowRight, CheckCircle, Star, AlertTriangle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div style={{ position: 'relative', overflowX: 'hidden' }}>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px 60px', textAlign: 'center', position: 'relative' }}>

        {/* Background orbs */}
        <div style={{ position: 'absolute', top: '10%', left: '20%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto' }}>
          {/* Badge */}
          <div className="badge badge-purple animate-fade-in" style={{ marginBottom: '24px', display: 'inline-flex', fontSize: '12px', padding: '6px 16px' }}>
            <Zap size={12} />
            AI-Powered Short-Form Video Creator
          </div>

          {/* Headline */}
          <h1 className="font-display animate-fade-in-up" style={{ fontSize: 'clamp(40px, 7vw, 84px)', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-2px' }}>
            Transform Your Content Into{' '}
            <span className="gradient-text">Viral Clips</span>
          </h1>

          <p className="animate-fade-in-up" style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', color: 'var(--color-text-secondary)', lineHeight: 1.7, maxWidth: '640px', margin: '0 auto 48px', animationDelay: '0.1s' }}>
            ClipForge AI analyzes your authorized video content, identifies the most engaging moments, and renders them as stunning 9:16 vertical clips — ready for Shorts, Reels, and TikTok.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', animationDelay: '0.2s' }}>
            <Link to="/dashboard" className="btn-primary" id="hero-get-started" style={{ fontSize: '16px', padding: '14px 32px' }}>
              Get Started Free
              <ArrowRight size={18} />
            </Link>
            <a href="#features" className="btn-secondary" id="hero-learn-more" style={{ fontSize: '16px', padding: '14px 32px' }}>
              See How It Works
            </a>
          </div>

          {/* Stats */}
          <div className="animate-fade-in" style={{ display: 'flex', gap: '48px', justifyContent: 'center', marginTop: '64px', flexWrap: 'wrap', animationDelay: '0.3s' }}>
            {[
              { value: '9:16', label: 'Vertical Format' },
              { value: '1080p', label: 'Output Quality' },
              { value: '3-5', label: 'AI Clips Identified' },
              { value: '100%', label: 'Rights-Conscious' },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div className="font-display" style={{ fontSize: '32px', fontWeight: 800, background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview mockup */}
        <div className="animate-fade-in-up" style={{ marginTop: '80px', position: 'relative', maxWidth: '900px', width: '100%', animationDelay: '0.35s' }}>
          <div className="card" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(139,92,246,0.25)', boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 80px rgba(139,92,246,0.15)' }}>
            {/* Fake UI header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }} />
              <div style={{ flex: 1, height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>https://www.youtube.com/watch?v=...</span>
              </div>
            </div>
            {/* Fake clip cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { score: 94, title: 'Viral Hook: The 3-Second Rule', duration: '30s', color: '#10b981' },
                { score: 87, title: 'Key Insight: Algorithm Secrets', duration: '60s', color: '#8b5cf6' },
                { score: 81, title: 'Emotional Close: Call to Action', duration: '120s', color: '#06b6d4' },
              ].map((clip) => (
                <div key={clip.title} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '80px', background: `linear-gradient(135deg, ${clip.color}22, ${clip.color}11)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <Film size={24} style={{ color: clip.color, opacity: 0.6 }} />
                    <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '11px', fontWeight: 700, color: clip.color, background: `${clip.color}22`, padding: '2px 8px', borderRadius: '100px', border: `1px solid ${clip.color}44` }}>
                      {clip.score}
                    </div>
                  </div>
                  <div style={{ padding: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>{clip.title}</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{clip.duration} · AI Selected</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── COPYRIGHT NOTICE ──────────────────────────────────── */}
      <section style={{ padding: '0 24px 60px', maxWidth: '900px', margin: '0 auto' }}>
        <div className="copyright-banner">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#f59e0b' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '4px' }}>Copyright & Rights Notice</strong>
              ClipForge AI does <strong>not</strong> grant copyright permission, does not make third-party content copyright-free, and cannot guarantee monetization of processed content.
              You must confirm you own the content or have the necessary rights, licenses, or permissions before processing any video.
              This tool is designed for transforming content you are legally authorized to use.
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div className="badge badge-cyan" style={{ marginBottom: '16px', display: 'inline-flex' }}>Features</div>
          <h2 className="font-display" style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, marginBottom: '16px', letterSpacing: '-1px' }}>
            Everything You Need to Create<br /><span className="gradient-text">Stunning Short-Form Content</span>
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '16px', maxWidth: '540px', margin: '0 auto' }}>
            From AI analysis to final export — ClipForge AI handles the entire workflow.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {FEATURES.map((feature, i) => (
            <div key={feature.title} className="card card-hover animate-fade-in-up" style={{ padding: '28px', animationDelay: `${i * 0.08}s` }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${feature.color}22`, border: `1px solid ${feature.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <feature.icon size={22} style={{ color: feature.color }} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-primary)' }}>{feature.title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div className="badge badge-purple" style={{ marginBottom: '16px', display: 'inline-flex' }}>Workflow</div>
          <h2 className="font-display" style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, letterSpacing: '-1px' }}>
            How <span className="gradient-text">ClipForge AI</span> Works
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {STEPS.map((step, i) => (
            <div key={step.title} style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px', color: 'white', boxShadow: '0 0 20px rgba(139,92,246,0.4)' }}>
                  {i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: '2px', height: '60px', background: 'linear-gradient(to bottom, rgba(139,92,246,0.4), rgba(139,92,246,0.05))' }} />
                )}
              </div>
              <div style={{ paddingBottom: i < STEPS.length - 1 ? '40px' : '0', flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', marginTop: '12px' }}>{step.title}</h3>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: '15px' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── RIGHTS-SAFE SECTION ───────────────────────────────── */}
      <section style={{ padding: '80px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '48px', border: '1px solid rgba(16,185,129,0.3)', background: 'linear-gradient(145deg, rgba(16,185,129,0.08) 0%, rgba(6,4,15,0) 100%)' }}>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div className="badge badge-green" style={{ marginBottom: '16px', display: 'inline-flex' }}>
                <Shield size={12} />
                Rights-Safe Mode
              </div>
              <h2 className="font-display" style={{ fontSize: '28px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.5px' }}>
                Designed for <span style={{ color: '#10b981' }}>Copyright-Conscious</span> Creators
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: '15px' }}>
                ClipForge AI is built from the ground up as a tool for transforming content you are legally authorized to use — not a downloader for other creators' work.
              </p>
            </div>
            <div style={{ flex: 1, minWidth: '280px' }}>
              {RIGHTS_POINTS.map((point) => (
                <div key={point} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '3px' }} />
                  <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px 120px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 className="font-display" style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, marginBottom: '20px', letterSpacing: '-1px' }}>
            Ready to <span className="gradient-text">Forge Your Clips?</span>
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '16px', marginBottom: '40px', lineHeight: 1.7 }}>
            Start with your own content. Clip it. Style it. Export it. In minutes.
          </p>
          <Link to="/dashboard" className="btn-primary animate-pulse-glow" id="cta-get-started" style={{ fontSize: '16px', padding: '16px 40px' }}>
            Start Creating Free
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scissors size={14} color="white" />
          </div>
          <span className="font-display" style={{ fontWeight: 700, fontSize: '15px' }}>ClipForge AI</span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
          ClipForge AI does not grant copyright permission or make any content copyright-free. All copyright responsibility rests with the user.
          Only use this tool on content you own or are legally licensed to repurpose.
        </p>
      </footer>
    </div>
  );
}

const FEATURES = [
  { icon: Zap, color: '#8b5cf6', title: 'AI Clip Detection', desc: 'Speech-to-text + LLM analysis identifies 3–5 high-engagement moments with hooks, scores, and reasoning.' },
  { icon: Film, color: '#06b6d4', title: '9:16 Vertical Rendering', desc: 'Auto-convert to 1080×1920 with blur-padded background. H.264/AAC MP4 at 30 FPS.' },
  { icon: Mic, color: '#f59e0b', title: 'Auto Subtitles', desc: 'Burned-in ASS subtitles with full control over font, size, color, position, and animation style.' },
  { icon: Music, color: '#10b981', title: 'Licensed Music Library', desc: 'CC0 / Public Domain background tracks. Mix voice and music volume independently.' },
  { icon: Shield, color: '#ef4444', title: 'Copyright Protection', desc: 'Rights confirmation required before processing. Metadata tracking. Never bypasses DRM or access controls.' },
  { icon: Star, color: '#a78bfa', title: 'Engagement Scoring', desc: 'Each candidate clip receives an AI-calculated engagement score based on content analysis signals.' },
];

const STEPS = [
  { title: 'Confirm Your Rights', desc: 'Enter a YouTube URL or upload your own video. Confirm you own the content or have the legal rights to repurpose it.' },
  { title: 'AI Analyzes the Video', desc: 'ClipForge transcribes the audio, analyzes the transcript for hooks, emotions, and engagement signals, then identifies 3–5 prime clip moments.' },
  { title: 'Review Clip Candidates', desc: 'Each candidate shows a preview, timestamps, transcript, hook, reason for selection, and an Engagement Score.' },
  { title: 'Edit in the Clip Editor', desc: 'Trim, add subtitles, pick background music, add a watermark, control volumes, and optionally generate AI commentary.' },
  { title: 'Export as MP4', desc: 'Render to 1080×1920 H.264/AAC MP4. Download and upload to your Shorts, Reels, or TikTok channel.' },
];

const RIGHTS_POINTS = [
  'Rights confirmation required before any download or render',
  'Supports: Owner, Licensed, Creative Commons, Public Domain, Fair Use',
  'Rights-Safe Mode: process only user-uploaded content',
  'Source URL and rights timestamp stored with every project',
  'Only CC0/Public Domain music in the built-in library',
  'Never bypasses DRM, paywalls, or authentication',
  'Does not present third-party footage as copyright-free',
];
