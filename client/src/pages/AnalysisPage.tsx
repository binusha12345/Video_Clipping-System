import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, Clock, ChevronRight, AlertCircle, ArrowLeft, Loader, Zap, Tag, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProjectStore, type ClipCandidate } from '../store/projectStore';
import { projectService } from '../services/services';
import { getErrorMessage } from '../services/api';
import { useEditorStore } from '../store/editorStore';

const STAGE_LABELS: Record<string, string> = {
  PENDING: 'Setting up...',
  DOWNLOADING: 'Downloading video from YouTube...',
  ANALYZING: 'Running AI analysis — this may take a minute...',
  READY: 'Analysis complete!',
  ERROR: 'Analysis failed',
};

function EngagementRing({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const fill = (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#8b5cf6' : '#f59e0b';

  return (
    <div className="score-ring" style={{ width: '70px', height: '70px' }}>
      <svg width="70" height="70" viewBox="0 0 70 70">
        <circle cx="35" cy="35" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle
          cx="35" cy="35" r={radius}
          fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${fill} ${circumference}`}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <span className="score-value" style={{ color, fontSize: '14px' }}>{score}</span>
    </div>
  );
}

function ClipCard({ clip, index, onSelect }: { clip: ClipCandidate; index: number; onSelect: () => void }) {
  const [expanded, setExpanded] = useState(false);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const durationColors: Record<number, string> = { 30: '#10b981', 60: '#8b5cf6', 120: '#06b6d4' };
  const durationColor = durationColors[clip.duration] || '#8b5cf6';

  return (
    <div className="card card-hover animate-fade-in-up" style={{ padding: '24px', animationDelay: `${index * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Score */}
        <div style={{ flexShrink: 0 }}>
          <EngagementRing score={clip.engagementScore} />
          <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Score</div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: `${durationColor}22`, color: durationColor, border: `1px solid ${durationColor}44`, fontSize: '11px', padding: '3px 10px' }}>
              <Clock size={10} /> {clip.duration}s
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              {formatTime(clip.startTime)} → {formatTime(clip.endTime)}
            </span>
            <span className="badge badge-purple" style={{ fontSize: '10px' }}>
              Clip {index + 1}
            </span>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', lineHeight: 1.3 }}>{clip.title}</h3>

          {/* Hook */}
          <div style={{ padding: '10px 14px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-primary-light)', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Zap size={10} style={{ display: 'inline', marginRight: '4px' }} />Hook
            </div>
            <p style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontStyle: 'italic', lineHeight: 1.5 }}>"{clip.hook}"</p>
          </div>

          {/* Reason */}
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>{clip.reason}</p>

          {/* Topics & Emotions */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {clip.topics?.map((t) => (
              <span key={t} className="badge badge-cyan" style={{ fontSize: '10px', padding: '2px 8px' }}>
                <Tag size={9} /> {t}
              </span>
            ))}
            {clip.emotions?.map((e) => (
              <span key={e} className="badge badge-amber" style={{ fontSize: '10px', padding: '2px 8px' }}>
                <Heart size={9} /> {e}
              </span>
            ))}
          </div>

          {/* Transcript preview */}
          {clip.transcript?.length > 0 && (
            <div>
              <button
                onClick={() => setExpanded(!expanded)}
                style={{ fontSize: '12px', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '8px' }}
              >
                {expanded ? '▼' : '▶'} {expanded ? 'Hide' : 'Show'} transcript
              </button>
              {expanded && (
                <div style={{ maxHeight: '120px', overflowY: 'auto', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  {clip.transcript.map((seg, i) => (
                    <span key={i}>{seg.text} </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Select Button */}
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
        <button
          id={`select-clip-${index}`}
          onClick={onSelect}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <Sparkles size={16} />
          Edit This Clip
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeProject, setActiveProject, setSelectedClip } = useProjectStore();
  const { resetConfig } = useEditorStore();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const fetchProject = useCallback(async () => {
    if (!id) return;
    try {
      const project = await projectService.get(id);
      setActiveProject(project);

      // Stop polling once the pipeline settled
      if (project.status === 'READY' || project.status === 'ERROR') {
        stopPolling();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }, [id, setActiveProject]);

  useEffect(() => {
    if (!id) return;
    fetchProject();

    // Poll for status updates every 3 seconds while the pipeline runs
    pollRef.current = setInterval(fetchProject, 3000);

    return () => stopPolling();
  }, [id, fetchProject]);

  const handleSelectClip = (clip: ClipCandidate) => {
    setSelectedClip(clip);
    resetConfig();
    navigate(`/project/${id}/editor/${clip.id}`);
  };

  const project = activeProject;

  if (!project) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
        <div className="animate-spin-slow" style={{ width: '32px', height: '32px', border: '3px solid rgba(139,92,246,0.3)', borderTopColor: '#8b5cf6', borderRadius: '50%' }} />
      </div>
    );
  }

  const isProcessing = project.status === 'DOWNLOADING' || project.status === 'ANALYZING' || project.status === 'PENDING';
  const progressMap: Record<string, number> = { PENDING: 10, DOWNLOADING: 35, ANALYZING: 70, READY: 100, ERROR: 0 };
  const progress = progressMap[project.status] || 0;

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', padding: '40px 0' }}>
      <div className="container">

        {/* Back + Header */}
        <div style={{ marginBottom: '32px' }}>
          <button onClick={() => navigate('/dashboard')} className="btn-ghost" style={{ marginBottom: '16px', padding: '6px 0' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </button>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {project.videoMetadata?.thumbnailUrl && (
              <img
                src={project.videoMetadata.thumbnailUrl}
                alt="Video thumbnail"
                style={{ width: '120px', height: '68px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }}
              />
            )}
            <div>
              <h1 className="font-display" style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '6px' }}>
                {project.videoMetadata?.title || 'Analyzing Video'}
              </h1>
              {project.videoMetadata?.uploader && (
                <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                  by {project.videoMetadata.uploader}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Analysis Progress */}
        {isProcessing && (
          <div className="card animate-fade-in" style={{ padding: '32px', marginBottom: '32px', border: '1px solid rgba(139,92,246,0.25)', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
              <Loader size={24} style={{ color: '#8b5cf6' }} className="animate-spin-slow" />
              <span style={{ fontSize: '16px', fontWeight: 600 }}>{STAGE_LABELS[project.status]}</span>
            </div>
            <div className="progress-bar" style={{ maxWidth: '480px', margin: '0 auto 12px' }}>
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {project.statusMessage || 'Please wait while we process your video...'}
            </p>
          </div>
        )}

        {/* Error State */}
        {project.status === 'ERROR' && (
          <div style={{ padding: '24px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', marginBottom: '32px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 600, marginBottom: '4px', color: '#fca5a5' }}>Analysis Failed</p>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>{project.statusMessage || 'An error occurred during analysis. Please try again.'}</p>
            </div>
          </div>
        )}

        {/* Clip Candidates */}
        {project.status === 'READY' && project.clips.length > 0 && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
                <Sparkles size={20} style={{ display: 'inline', marginRight: '8px', color: '#8b5cf6' }} />
                {project.clips.length} Clip Candidates Identified
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                AI-identified moments ranked by engagement potential. Select a clip to open the editor.
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                ⚠️ Engagement scores are estimates only. ClipForge AI does not guarantee viral performance.
              </p>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
              {project.clips.map((clip, i) => (
                <ClipCard key={clip.id} clip={clip} index={i} onSelect={() => handleSelectClip(clip)} />
              ))}
            </div>
          </>
        )}

        {project.status === 'READY' && project.clips.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <AlertCircle size={40} style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No clips found</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
              The AI could not identify suitable clip candidates in this video.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
