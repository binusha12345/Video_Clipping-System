import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, Upload, Sparkles, Folder, Trash2, Clock, CheckCircle, AlertCircle, Loader, ChevronRight, Shield, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProjectStore, type Project } from '../store/projectStore';
import { projectService } from '../services/services';
import { getErrorMessage } from '../services/api';
import RightsConfirmationModal from '../components/RightsConfirmationModal';
import { useDropzone } from 'react-dropzone';

const STATUS_CONFIG = {
  PENDING: { color: '#6b5f85', icon: Clock, label: 'Pending' },
  DOWNLOADING: { color: '#06b6d4', icon: Loader, label: 'Downloading' },
  ANALYZING: { color: '#8b5cf6', icon: Sparkles, label: 'Analyzing' },
  READY: { color: '#10b981', icon: CheckCircle, label: 'Ready' },
  ERROR: { color: '#ef4444', icon: AlertCircle, label: 'Error' },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { projects, setProjects, setActiveProject, addProject, removeProject, isLoading, setLoading } = useProjectStore();

  const [url, setUrl] = useState('');
  const [showRightsModal, setShowRightsModal] = useState(false);
  const [pendingUrl, setPendingUrl] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await projectService.list();
      setProjects(data.items);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [setProjects, setLoading]);

  // Load projects
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    // Basic YouTube URL validation
    const isYT = /youtube\.com|youtu\.be/i.test(url);
    if (!isYT) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    // Fetch metadata preview
    setFetchingMeta(true);
    try {
      await projectService.getMetadata(url);
      setPendingUrl(url);
      setShowRightsModal(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setFetchingMeta(false);
    }
  };

  const handleRightsConfirmed = async (rightsType: string, safeModeEnabled: boolean) => {
    setShowRightsModal(false);
    try {
      const project = pendingFile
        ? await projectService.upload(pendingFile, {
            rightsConfirmed: true,
            rightsType,
            rightsSafeMode: safeModeEnabled,
          })
        : await projectService.create({
            url: pendingUrl,
            rightsConfirmed: true,
            rightsType,
            rightsSafeMode: safeModeEnabled,
            sourceType: 'youtube',
          });
      addProject(project);
      setActiveProject(project);
      toast.success('Analysis started! Processing your video...');
      setPendingFile(null);
      setPendingUrl('');
      setUrl('');
      navigate(`/project/${project.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this project?')) return;
    try {
      await projectService.delete(id);
      removeProject(id);
      toast.success('Project deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm'] },
    maxSize: 500 * 1024 * 1024, // 500MB
    multiple: false,
    onDrop: (_accepted, rejected) => {
      if (rejected.length > 0) toast.error('File too large or unsupported format. Max 500MB.');
    },
    onDropAccepted: (files) => {
      const file = files[0];
      if (!file) return;
      setPendingFile(file);
      setPendingUrl(file.name);
      setShowRightsModal(true);
    },
  });

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', padding: '40px 0' }}>
      <div className="container">

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 className="font-display" style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: '8px' }}>
            Your <span className="gradient-text">Projects</span>
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
            Analyze and transform your authorized video content into short-form clips.
          </p>
        </div>

        {/* URL Input Card */}
        <div className="card" style={{ padding: '32px', marginBottom: '40px', border: '1px solid rgba(139,92,246,0.2)' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <button
              onClick={() => setUploadMode(false)}
              style={{
                padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                background: !uploadMode ? 'rgba(139,92,246,0.2)' : 'transparent',
                color: !uploadMode ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                border: `1px solid ${!uploadMode ? 'rgba(139,92,246,0.4)' : 'transparent'}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <Link2 size={15} /> YouTube URL
            </button>
            <button
              onClick={() => setUploadMode(true)}
              style={{
                padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                background: uploadMode ? 'rgba(16,185,129,0.15)' : 'transparent',
                color: uploadMode ? '#6ee7b7' : 'var(--color-text-muted)',
                border: `1px solid ${uploadMode ? 'rgba(16,185,129,0.3)' : 'transparent'}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <Upload size={15} /> Upload Video <span className="badge badge-green" style={{ fontSize: '10px', padding: '2px 6px' }}>Safest</span>
            </button>
          </div>

          {!uploadMode ? (
            <form onSubmit={handleUrlSubmit}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                    <Link2 size={16} />
                  </div>
                  <input
                    id="youtube-url-input"
                    type="url"
                    className="input-field"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    style={{ paddingLeft: '42px' }}
                  />
                </div>
                <button
                  id="analyze-btn"
                  type="submit"
                  className="btn-primary"
                  disabled={!url.trim() || fetchingMeta}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {fetchingMeta ? (
                    <span className="animate-spin-slow" style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                  ) : (
                    <><Sparkles size={16} /> Analyze Video</>
                  )}
                </button>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={12} />
                You will be asked to confirm your rights before processing begins.
              </p>
            </form>
          ) : (
            <div
              {...getRootProps()}
              id="upload-dropzone"
              style={{
                border: `2px dashed ${isDragActive ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '12px', padding: '48px', textAlign: 'center', cursor: 'pointer',
                background: isDragActive ? 'rgba(139,92,246,0.05)' : 'rgba(255,255,255,0.01)',
                transition: 'all 0.2s',
              }}
            >
              <input {...getInputProps()} />
              <Upload size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }} />
              <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>
                {isDragActive ? 'Drop your video here' : 'Drag & drop your video'}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>MP4, MOV, AVI, MKV, WebM — up to 500MB</p>
              <div className="badge badge-green" style={{ marginTop: '16px', display: 'inline-flex' }}>
                <Shield size={11} /> Safest: Only your own content
              </div>
            </div>
          )}
        </div>

        {/* Projects List */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
            <Folder size={18} style={{ display: 'inline', marginRight: '8px', color: 'var(--color-text-muted)' }} />
            Recent Projects
          </h2>
          <button onClick={loadProjects} className="btn-ghost" style={{ fontSize: '13px' }}>
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '16px' }} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Plus size={32} style={{ color: 'var(--color-primary-light)' }} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No projects yet</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
              Enter a YouTube URL above to analyze your first video.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {projects.map((project: Project) => {
              const status = STATUS_CONFIG[project.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = status.icon;
              return (
                <div
                  key={project.id}
                  className="card card-hover"
                  style={{ cursor: 'pointer', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}
                  onClick={() => {
                    setActiveProject(project);
                    navigate(`/project/${project.id}`);
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '12px', flexShrink: 0,
                    background: project.videoMetadata?.thumbnailUrl
                      ? `url(${project.videoMetadata.thumbnailUrl}) center/cover`
                      : 'rgba(139,92,246,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {!project.videoMetadata?.thumbnailUrl && <Folder size={24} style={{ color: 'var(--color-primary-light)' }} />}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {project.videoMetadata?.title || project.sourceUrl}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                      <span className="badge" style={{ fontSize: '10px', padding: '2px 8px', background: `${status.color}22`, color: status.color, border: `1px solid ${status.color}44` }}>
                        <StatusIcon size={10} className={project.status === 'ANALYZING' || project.status === 'DOWNLOADING' ? 'animate-spin-slow' : ''} />
                        {status.label}
                      </span>
                      {project.clips.length > 0 && (
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          {project.clips.length} clips
                        </span>
                      )}
                      {project.rightsType && (
                        <span className="badge badge-green" style={{ fontSize: '10px', padding: '2px 8px' }}>
                          <Shield size={9} /> {project.rightsType.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    <button
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      className="btn-ghost"
                      style={{ padding: '8px', color: 'var(--color-text-muted)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                    <ChevronRight size={18} style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rights Confirmation Modal */}
      {showRightsModal && (
        <RightsConfirmationModal
          url={pendingUrl}
          onConfirm={handleRightsConfirmed}
          onClose={() => {
            setShowRightsModal(false);
            setPendingFile(null);
            setPendingUrl('');
          }}
        />
      )}
    </div>
  );
}
