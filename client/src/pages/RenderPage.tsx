import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, CheckCircle, XCircle, Loader, ArrowLeft, Film, Clock, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { renderService } from '../services/services';
import { getErrorMessage } from '../services/api';

interface JobStatus {
  id: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  stage?: string;
  error?: string;
  downloadUrl?: string;
}

const STAGE_MESSAGES: Record<string, string> = {
  'Starting render...': '🎬 Initializing render pipeline...',
  'Loading project...': '📂 Loading project files...',
  'Generating subtitles...': '✍️ Generating subtitle file...',
  'Processing video...': '🎞️ Processing video frames...',
  'Rendering clip...': '⚙️ FFmpeg encoding...',
  'Encoding...': '🔧 Encoding to H.264/AAC...',
  'Finalizing...': '✅ Finalizing output...',
  'Complete': '🎉 Render complete!',
};

export default function RenderPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobStatus | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishedRef = useRef(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!jobId) return;
    try {
      const status = await renderService.getStatus(jobId);
      setJob(status);
      if (status.status === 'COMPLETED' || status.status === 'FAILED') {
        if (!finishedRef.current) {
          finishedRef.current = true;
          if (status.status === 'COMPLETED') {
            toast.success('Render complete! Your clip is ready to download.');
          } else {
            toast.error(status.error || 'Render failed. Please try again.');
          }
        }
        stopPolling();
      }
      if (status.stage) {
        const msg = STAGE_MESSAGES[status.stage] || status.stage;
        setLogs((prev) => {
          if (prev[prev.length - 1]?.includes(msg)) return prev;
          return [...prev.slice(-50), `[${new Date().toLocaleTimeString()}] ${msg}`];
        });
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }, [jobId, stopPolling]);

  const startPolling = useCallback(() => {
    if (pollRef.current || finishedRef.current) return;
    pollRef.current = setInterval(fetchStatus, 3000);
  }, [fetchStatus]);

  useEffect(() => {
    if (!jobId) return;
    finishedRef.current = false;

    // Initial status fetch
    fetchStatus();

    // Subscribe to SSE. EventSource cannot set request headers, so the API
    // accepts the access token as a `?token=` query parameter on this route.
    // In this build there is no real token, so we skip the query parameter
    // and rely on the server treating every request as authenticated.
    const es = new EventSource(`/api/render/${jobId}/progress`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'progress') {
        setJob((prev) => ({
          ...prev!,
          ...data,
          id: jobId,
        }));

        if (data.stage) {
          const msg = STAGE_MESSAGES[data.stage] || data.stage;
          setLogs((prev) => {
            if (prev[prev.length - 1]?.includes(msg)) return prev;
            return [...prev.slice(-50), `[${new Date().toLocaleTimeString()}] ${msg}`];
          });
        }

        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          finishedRef.current = true;
          stopPolling();
          if (data.status === 'COMPLETED') {
            toast.success('Render complete! Your clip is ready to download.');
          } else {
            toast.error('Render failed. Please try again.');
          }
          es.close();
          // Final fetch so the download URL / error text is up to date
          fetchStatus();
        }
      }
    };

    // SSE unavailable (proxy hiccup, reconnect, …) — fall back to polling
    es.onerror = () => {
      startPolling();
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      stopPolling();
    };
  }, [jobId, fetchStatus, startPolling, stopPolling]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleDownload = async () => {
    if (!jobId) return;
    setDownloading(true);
    try {
      // Download through the axios instance so the request carries any
      // auth headers the client store may add in a future build.
      const blob = await renderService.download(jobId);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `clipforge_${jobId}.mp4`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  const isComplete = job?.status === 'COMPLETED';
  const isFailed = job?.status === 'FAILED';
  const isProcessing = job?.status === 'PROCESSING' || job?.status === 'QUEUED';

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: '720px' }}>

        <button onClick={() => navigate('/dashboard')} className="btn-ghost" style={{ marginBottom: '24px', padding: '6px 0' }}>
          <ArrowLeft size={16} /> Dashboard
        </button>

        <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '8px' }}>
          {isComplete ? '🎉 Clip Ready!' : isFailed ? '❌ Render Failed' : '⚙️ Rendering Your Clip...'}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', marginBottom: '40px' }}>
          {isComplete ? 'Your clip has been rendered and is ready for download.' :
           isFailed ? 'An error occurred during rendering.' :
           'FFmpeg is processing your clip. This typically takes 1–3 minutes.'}
        </p>

        {/* Status Card */}
        <div className="card" style={{ padding: '32px', marginBottom: '24px', border: `1px solid ${isComplete ? 'rgba(16,185,129,0.3)' : isFailed ? 'rgba(239,68,68,0.3)' : 'rgba(139,92,246,0.25)'}` }}>

          {/* Status Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isComplete ? 'rgba(16,185,129,0.15)' : isFailed ? 'rgba(239,68,68,0.15)' : 'rgba(139,92,246,0.15)',
            }}>
              {isComplete && <CheckCircle size={28} style={{ color: '#10b981' }} />}
              {isFailed && <XCircle size={28} style={{ color: '#ef4444' }} />}
              {isProcessing && <Loader size={28} style={{ color: '#8b5cf6' }} className="animate-spin-slow" />}
              {!job && <Film size={28} style={{ color: '#8b5cf6' }} />}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                {job?.stage ? (STAGE_MESSAGES[job.stage] || job.stage) : 'Initializing...'}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                Job ID: {jobId?.substring(0, 8)}...
              </div>
            </div>
          </div>

          {/* Progress */}
          {!isFailed && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Progress</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary-light)' }}>{job?.progress || 0}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${job?.progress || 0}%`,
                    background: isComplete ? 'linear-gradient(90deg, #10b981, #6ee7b7)' : 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {isFailed && job?.error && (
            <div style={{ padding: '16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', color: '#fca5a5' }}>{job.error}</p>
            </div>
          )}

          {/* Specs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { icon: Film, label: 'Format', value: 'MP4 H.264' },
              { icon: Sparkles, label: 'Resolution', value: '1080×1920' },
              { icon: Clock, label: 'Frame Rate', value: '30 FPS' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                <Icon size={16} style={{ color: 'var(--color-text-muted)', marginBottom: '6px' }} />
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          {isComplete && (
            <button
              id="download-btn"
              onClick={handleDownload}
              disabled={downloading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '15px', padding: '14px', background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              {downloading ? (
                <><Loader size={16} className="animate-spin-slow" /> Downloading...</>
              ) : (
                <><Download size={18} /> Download MP4</>
              )}
            </button>
          )}

          {isFailed && (
            <button onClick={() => navigate(-1)} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              <ArrowLeft size={16} /> Back to Editor
            </button>
          )}
        </div>

        {/* Render Log */}
        {logs.length > 0 && (
          <div className="card" style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text-secondary)' }}>
              Render Log
            </h3>
            <div style={{
              fontFamily: 'monospace', fontSize: '12px', color: '#6ee7b7',
              background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '12px',
              maxHeight: '180px', overflowY: 'auto',
              border: '1px solid rgba(16,185,129,0.15)',
            }}>
              {logs.map((log, i) => (
                <div key={i} style={{ marginBottom: '4px', opacity: 0.8 }}>{log}</div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {/* Copyright reminder */}
        {isComplete && (
          <div className="copyright-banner" style={{ marginTop: '20px' }}>
            <strong>Reminder:</strong> Before publishing this clip, ensure you have the legal rights to distribute it on your chosen platform. ClipForge AI does not grant copyright permission or guarantee monetization.
          </div>
        )}
      </div>
    </div>
  );
}
