import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Scissors, Type, Music, Droplets, Mic2, Play, Loader, Wand2, AlignCenter, AlignLeft, AlignRight, Bold, Italic } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProjectStore } from '../store/projectStore';
import { useEditorStore, type SubtitleStyle, type WatermarkConfig } from '../store/editorStore';
import { renderService, projectService } from '../services/services';
import { getErrorMessage } from '../services/api';

const FONT_OPTIONS = ['Inter', 'Arial', 'Impact', 'Bebas Neue', 'Oswald', 'Roboto', 'Montserrat', 'Poppins'];
const POSITION_OPTIONS: { value: SubtitleStyle['position']; icon: React.FC<any>; label: string }[] = [
  { value: 'top', icon: AlignLeft, label: 'Top' },
  { value: 'middle', icon: AlignCenter, label: 'Middle' },
  { value: 'bottom', icon: AlignRight, label: 'Bottom' },
];
const ANIMATION_OPTIONS: { value: SubtitleStyle['animation']; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fade-in', label: 'Fade In' },
  { value: 'slide-up', label: 'Slide Up' },
  { value: 'typewriter', label: 'Typewriter' },
  { value: 'bounce', label: 'Bounce' },
];

const WATERMARK_POSITIONS: { value: WatermarkConfig['position']; label: string }[] = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'center', label: 'Center' },
];

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  license: string;
  genre: string;
  bpm?: number;
}

const MUSIC_LIBRARY: MusicTrack[] = [
  { id: 'upbeat-corporate-01', title: 'Upbeat Corporate', artist: 'CC0 Music', duration: 120, license: 'CC0', genre: 'Corporate', bpm: 128 },
  { id: 'ambient-chill-01', title: 'Ambient Chill', artist: 'CC0 Music', duration: 180, license: 'CC0', genre: 'Ambient', bpm: 90 },
  { id: 'energetic-pop-01', title: 'Energetic Pop', artist: 'CC0 Music', duration: 150, license: 'CC0', genre: 'Pop', bpm: 140 },
  { id: 'lo-fi-beats-01', title: 'Lo-Fi Study Beats', artist: 'CC0 Music', duration: 200, license: 'CC0', genre: 'Lo-Fi', bpm: 85 },
  { id: 'cinematic-inspire-01', title: 'Cinematic Inspire', artist: 'CC0 Music', duration: 160, license: 'CC0', genre: 'Cinematic', bpm: 110 },
  { id: 'electronic-future-01', title: 'Electronic Future', artist: 'CC0 Music', duration: 135, license: 'CC0', genre: 'Electronic', bpm: 132 },
];

function SectionHeader({ icon: Icon, title }: { icon: React.FC<any>; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
      <Icon size={18} style={{ color: 'var(--color-primary-light)' }} />
      <h3 style={{ fontSize: '15px', fontWeight: 700 }}>{title}</h3>
    </div>
  );
}

function SliderField({ label, value, min, max, step = 1, onChange, format = (v: number) => String(v) }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; format?: (v: number) => string;
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{label}</label>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary-light)' }}>{format(value)}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#8b5cf6' }}
      />
    </div>
  );
}

export default function EditorPage() {
  const { id, clipId } = useParams<{ id: string; clipId: string }>();
  const navigate = useNavigate();
  const { activeProject, selectedClip, setActiveProject } = useProjectStore();
  const { config, activeTab, setConfig, setSubtitleStyle, setWatermark, setActiveTab, setCurrentRenderJobId } = useEditorStore();
  const [isRendering, setIsRendering] = useState(false);
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>(MUSIC_LIBRARY);

  // A hard refresh empties the store — reload the project so the editor still works
  useEffect(() => {
    if (!id || activeProject) return;
    projectService
      .get(id)
      .then((project) => setActiveProject(project))
      .catch((err) => toast.error(getErrorMessage(err)));
  }, [id, activeProject, setActiveProject]);

  // Prefer the server's music library (only tracks that actually exist)
  useEffect(() => {
    renderService
      .getMusicLibrary()
      .then((tracks) => {
        if (Array.isArray(tracks) && tracks.length > 0) setMusicTracks(tracks);
      })
      .catch(() => {
        /* keep the built-in list */
      });
  }, []);

  const clip = selectedClip || activeProject?.clips.find((c) => c.id === clipId);

  const TABS = [
    { id: 'trim', icon: Scissors, label: 'Trim' },
    { id: 'subtitles', icon: Type, label: 'Subtitles' },
    { id: 'music', icon: Music, label: 'Music' },
    { id: 'watermark', icon: Droplets, label: 'Watermark' },
    { id: 'voice', icon: Mic2, label: 'Voice' },
  ] as const;

  const handleRender = async () => {
    if (!id || !clipId) return;
    setIsRendering(true);
    try {
      const result = await renderService.start({
        projectId: id,
        clipId,
        editorConfig: config,
      });
      setCurrentRenderJobId(result.jobId);
      toast.success('Render started! Processing your clip...');
      navigate(`/render/${result.jobId}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsRendering(false);
    }
  };

  if (!clip) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Clip not found. Please go back and select a clip.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', padding: '32px 0' }}>
      <div className="container">
        <button onClick={() => navigate(`/project/${id}`)} className="btn-ghost" style={{ marginBottom: '24px', padding: '6px 0' }}>
          <ArrowLeft size={16} /> Back to Clips
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>

          {/* LEFT: Preview + Tab Content */}
          <div>
            {/* Video Preview Area */}
            <div className="card" style={{ padding: '24px', marginBottom: '24px', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{clip.title}</h1>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    {clip.startTime.toFixed(1)}s — {clip.endTime.toFixed(1)}s · {clip.duration}s clip
                  </p>
                </div>
              </div>

              {/* Vertical Preview Mockup */}
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '160px', aspectRatio: '9/16', background: 'linear-gradient(180deg, #1a1530 0%, #06040f 100%)',
                  borderRadius: '12px', border: '2px solid rgba(139,92,246,0.3)', flexShrink: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px', position: 'relative', overflow: 'hidden',
                }}>
                  {/* Preview content */}
                  <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                      <Play size={16} style={{ color: '#a78bfa', marginLeft: '2px' }} />
                    </div>
                    <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.3 }}>
                      9:16 Preview<br />1080×1920
                    </div>
                  </div>

                  {/* Subtitle preview */}
                  {config.subtitles && (
                    <div style={{
                      position: 'absolute',
                      [config.subtitleStyle.position === 'top' ? 'top' : config.subtitleStyle.position === 'middle' ? 'top' : 'bottom']: config.subtitleStyle.position === 'middle' ? '40%' : '10px',
                      left: '4px', right: '4px', textAlign: 'center',
                    }}>
                      <span style={{
                        fontSize: `${Math.round(config.subtitleStyle.fontSize / 8)}px`,
                        fontWeight: config.subtitleStyle.bold ? 700 : 400,
                        fontStyle: config.subtitleStyle.italic ? 'italic' : 'normal',
                        color: config.subtitleStyle.color,
                        textShadow: `0 0 ${config.subtitleStyle.outlineWidth}px ${config.subtitleStyle.outlineColor}`,
                        lineHeight: 1.3, display: 'block',
                      }}>
                        {clip.transcript?.[0]?.text?.substring(0, 30) || 'Sample subtitle text'}
                      </span>
                    </div>
                  )}

                  {/* Watermark preview */}
                  {config.watermark.enabled && config.watermark.text && (
                    <div style={{
                      position: 'absolute',
                      bottom: config.watermark.position.includes('bottom') ? '8px' : undefined,
                      top: config.watermark.position.includes('top') ? '8px' : undefined,
                      left: config.watermark.position.includes('left') ? '8px' : undefined,
                      right: config.watermark.position.includes('right') ? '8px' : undefined,
                      fontSize: '7px', opacity: config.watermark.opacity,
                      color: 'white', fontWeight: 600,
                    }}>
                      {config.watermark.text}
                    </div>
                  )}

                  {/* Duration badge */}
                  <div style={{ position: 'absolute', top: '6px', right: '6px', fontSize: '8px', fontWeight: 700, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 5px', borderRadius: '4px' }}>
                    {clip.duration - (config.trimStart + config.trimEnd)}s
                  </div>
                </div>

                {/* Clip info */}
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Hook</div>
                    <p style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--color-primary-light)', lineHeight: 1.5 }}>"{clip.hook}"</p>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Why selected</div>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{clip.reason}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Panels */}
            <div className="card" style={{ padding: '0', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              {/* Tab bar */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', overflowX: 'auto' }}>
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    id={`editor-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      flex: 1, padding: '14px 12px', fontSize: '13px', fontWeight: 600,
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: activeTab === tab.id ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                      borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                      marginBottom: '-1px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '6px', transition: 'all 0.15s', whiteSpace: 'nowrap', minWidth: '80px',
                    }}
                  >
                    <tab.icon size={15} /> {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ padding: '24px' }}>
                {/* TRIM TAB */}
                {activeTab === 'trim' && (
                  <div>
                    <SectionHeader icon={Scissors} title="Trim Clip" />
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', marginBottom: '20px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                        Original: {clip.startTime.toFixed(1)}s — {clip.endTime.toFixed(1)}s ({clip.duration}s)
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        Final duration: <strong style={{ color: 'var(--color-primary-light)' }}>{(clip.duration - config.trimStart - config.trimEnd).toFixed(1)}s</strong>
                      </div>
                    </div>
                    <SliderField
                      label="Trim from start"
                      value={config.trimStart}
                      min={0}
                      max={Math.max(0, clip.duration / 2 - 5)}
                      step={0.5}
                      onChange={(v) => setConfig({ trimStart: v })}
                      format={(v) => `${v}s`}
                    />
                    <SliderField
                      label="Trim from end"
                      value={config.trimEnd}
                      min={0}
                      max={Math.max(0, clip.duration / 2 - 5)}
                      step={0.5}
                      onChange={(v) => setConfig({ trimEnd: v })}
                      format={(v) => `${v}s`}
                    />
                  </div>
                )}

                {/* SUBTITLES TAB */}
                {activeTab === 'subtitles' && (
                  <div>
                    <SectionHeader icon={Type} title="Subtitle Style" />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 600 }}>Enable Subtitles</label>
                      <button
                        id="subtitles-toggle"
                        onClick={() => setConfig({ subtitles: !config.subtitles })}
                        style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: config.subtitles ? '#8b5cf6' : 'rgba(255,255,255,0.12)', transition: 'all 0.2s', position: 'relative' }}
                      >
                        <div style={{ position: 'absolute', top: '3px', left: config.subtitles ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'all 0.2s' }} />
                      </button>
                    </div>

                    {config.subtitles && (
                      <div style={{ display: 'grid', gap: '16px' }}>
                        {/* Font */}
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Font Family</label>
                          <select
                            className="input-field"
                            value={config.subtitleStyle.fontFamily}
                            onChange={(e) => setSubtitleStyle({ fontFamily: e.target.value })}
                            style={{ background: 'rgba(255,255,255,0.04)', cursor: 'pointer' }}
                          >
                            {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>

                        <SliderField label="Font Size" value={config.subtitleStyle.fontSize} min={16} max={80} step={2}
                          onChange={(v) => setSubtitleStyle({ fontSize: v })} format={(v) => `${v}px`} />

                        {/* Colors */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Text Color</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input type="color" value={config.subtitleStyle.color}
                                onChange={(e) => setSubtitleStyle({ color: e.target.value })}
                                style={{ width: '40px', height: '36px', borderRadius: '8px', border: '1px solid var(--color-border)', cursor: 'pointer', padding: '2px', background: 'rgba(255,255,255,0.04)' }} />
                              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{config.subtitleStyle.color}</span>
                            </div>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Outline Color</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input type="color" value={config.subtitleStyle.outlineColor}
                                onChange={(e) => setSubtitleStyle({ outlineColor: e.target.value })}
                                style={{ width: '40px', height: '36px', borderRadius: '8px', border: '1px solid var(--color-border)', cursor: 'pointer', padding: '2px', background: 'rgba(255,255,255,0.04)' }} />
                              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{config.subtitleStyle.outlineColor}</span>
                            </div>
                          </div>
                        </div>

                        <SliderField label="Outline Width" value={config.subtitleStyle.outlineWidth} min={0} max={8}
                          onChange={(v) => setSubtitleStyle({ outlineWidth: v })} format={(v) => `${v}px`} />

                        {/* Style toggles */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setSubtitleStyle({ bold: !config.subtitleStyle.bold })}
                            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid', fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'all 0.15s', background: config.subtitleStyle.bold ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)', color: config.subtitleStyle.bold ? 'var(--color-primary-light)' : 'var(--color-text-muted)', borderColor: config.subtitleStyle.bold ? 'rgba(139,92,246,0.4)' : 'var(--color-border)' }}
                          >
                            <Bold size={14} />
                          </button>
                          <button
                            onClick={() => setSubtitleStyle({ italic: !config.subtitleStyle.italic })}
                            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid', fontSize: '14px', fontStyle: 'italic', cursor: 'pointer', transition: 'all 0.15s', background: config.subtitleStyle.italic ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)', color: config.subtitleStyle.italic ? 'var(--color-primary-light)' : 'var(--color-text-muted)', borderColor: config.subtitleStyle.italic ? 'rgba(139,92,246,0.4)' : 'var(--color-border)' }}
                          >
                            <Italic size={14} />
                          </button>
                        </div>

                        {/* Position */}
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Position</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {POSITION_OPTIONS.map((pos) => (
                              <button key={pos.value}
                                onClick={() => setSubtitleStyle({ position: pos.value })}
                                style={{ flex: 1, padding: '10px 8px', borderRadius: '8px', border: '1px solid', fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s', background: config.subtitleStyle.position === pos.value ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)', color: config.subtitleStyle.position === pos.value ? 'var(--color-primary-light)' : 'var(--color-text-muted)', borderColor: config.subtitleStyle.position === pos.value ? 'rgba(139,92,246,0.4)' : 'var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                              >
                                <pos.icon size={14} /> {pos.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Animation */}
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Animation</label>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {ANIMATION_OPTIONS.map((anim) => (
                              <button key={anim.value}
                                onClick={() => setSubtitleStyle({ animation: anim.value })}
                                style={{ padding: '6px 14px', borderRadius: '100px', border: '1px solid', fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s', background: config.subtitleStyle.animation === anim.value ? 'rgba(139,92,246,0.2)' : 'transparent', color: config.subtitleStyle.animation === anim.value ? 'var(--color-primary-light)' : 'var(--color-text-muted)', borderColor: config.subtitleStyle.animation === anim.value ? 'rgba(139,92,246,0.4)' : 'var(--color-border)' }}
                              >
                                {anim.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* MUSIC TAB */}
                {activeTab === 'music' && (
                  <div>
                    <SectionHeader icon={Music} title="Background Music" />
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
                      All tracks are CC0 / Public Domain licensed. Safe to use in any content.
                    </p>

                    <div style={{ display: 'grid', gap: '8px', marginBottom: '20px' }}>
                      <button
                        onClick={() => setConfig({ musicTrackId: undefined })}
                        style={{
                          padding: '12px 16px', borderRadius: '10px', border: '1px solid',
                          borderColor: !config.musicTrackId ? 'rgba(139,92,246,0.4)' : 'var(--color-border)',
                          background: !config.musicTrackId ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)',
                          cursor: 'pointer', textAlign: 'left', color: !config.musicTrackId ? 'var(--color-primary-light)' : 'var(--color-text-muted)', fontSize: '13px', fontWeight: 500,
                        }}
                      >
                        No music
                      </button>
                      {musicTracks.map((track) => (
                        <button
                          key={track.id}
                          id={`music-track-${track.id}`}
                          onClick={() => setConfig({ musicTrackId: track.id })}
                          style={{
                            padding: '12px 16px', borderRadius: '10px', border: '1px solid',
                            borderColor: config.musicTrackId === track.id ? 'rgba(139,92,246,0.4)' : 'var(--color-border)',
                            background: config.musicTrackId === track.id ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)',
                            cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: config.musicTrackId === track.id ? 'var(--color-primary-light)' : 'var(--color-text-primary)', marginBottom: '2px' }}>
                                {track.title}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                {track.genre} · {track.bpm} BPM · {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
                              </div>
                            </div>
                            <span className="badge badge-green" style={{ fontSize: '10px', padding: '2px 8px' }}>{track.license}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {config.musicTrackId && (
                      <>
                        <SliderField label="Music Volume" value={config.musicVolume} min={0} max={1} step={0.05}
                          onChange={(v) => setConfig({ musicVolume: v })} format={(v) => `${Math.round(v * 100)}%`} />
                        <SliderField label="Voice Volume" value={config.voiceVolume} min={0} max={1} step={0.05}
                          onChange={(v) => setConfig({ voiceVolume: v })} format={(v) => `${Math.round(v * 100)}%`} />
                      </>
                    )}
                  </div>
                )}

                {/* WATERMARK TAB */}
                {activeTab === 'watermark' && (
                  <div>
                    <SectionHeader icon={Droplets} title="Watermark" />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 600 }}>Enable Watermark</label>
                      <button
                        id="watermark-toggle"
                        onClick={() => setWatermark({ enabled: !config.watermark.enabled })}
                        style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: config.watermark.enabled ? '#8b5cf6' : 'rgba(255,255,255,0.12)', transition: 'all 0.2s', position: 'relative' }}
                      >
                        <div style={{ position: 'absolute', top: '3px', left: config.watermark.enabled ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'all 0.2s' }} />
                      </button>
                    </div>

                    {config.watermark.enabled && (
                      <div style={{ display: 'grid', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Watermark Text</label>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="@YourHandle or ©YourBrand"
                            value={config.watermark.text || ''}
                            onChange={(e) => setWatermark({ text: e.target.value })}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Position</label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                            {WATERMARK_POSITIONS.map((pos) => (
                              <button key={pos.value}
                                onClick={() => setWatermark({ position: pos.value })}
                                style={{ padding: '8px', borderRadius: '8px', border: '1px solid', fontSize: '11px', cursor: 'pointer', transition: 'all 0.15s', background: config.watermark.position === pos.value ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.02)', color: config.watermark.position === pos.value ? 'var(--color-primary-light)' : 'var(--color-text-muted)', borderColor: config.watermark.position === pos.value ? 'rgba(139,92,246,0.4)' : 'var(--color-border)' }}
                              >
                                {pos.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <SliderField label="Opacity" value={config.watermark.opacity} min={0.1} max={1} step={0.05}
                          onChange={(v) => setWatermark({ opacity: v })} format={(v) => `${Math.round(v * 100)}%`} />
                      </div>
                    )}
                  </div>
                )}

                {/* VOICE TAB */}
                {activeTab === 'voice' && (
                  <div>
                    <SectionHeader icon={Mic2} title="AI Commentary & Voice" />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div>
                        <label style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>AI Commentary</label>
                        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Generate AI narration based on clip content</p>
                      </div>
                      <button
                        id="ai-commentary-toggle"
                        onClick={() => setConfig({ aiCommentary: !config.aiCommentary })}
                        style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: config.aiCommentary ? '#8b5cf6' : 'rgba(255,255,255,0.12)', transition: 'all 0.2s', position: 'relative', flexShrink: 0 }}
                      >
                        <div style={{ position: 'absolute', top: '3px', left: config.aiCommentary ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'all 0.2s' }} />
                      </button>
                    </div>

                    {config.aiCommentary && (
                      <div style={{ display: 'grid', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Commentary Script (optional)</label>
                          <textarea
                            className="input-field"
                            placeholder="Leave empty to auto-generate from clip content..."
                            value={config.aiCommentaryText || ''}
                            onChange={(e) => setConfig({ aiCommentaryText: e.target.value })}
                            rows={4}
                            style={{ resize: 'vertical' }}
                          />
                        </div>
                        <SliderField label="Voice Volume" value={config.voiceVolume} min={0} max={1} step={0.05}
                          onChange={(v) => setConfig({ voiceVolume: v })} format={(v) => `${Math.round(v * 100)}%`} />
                        <div className="badge badge-cyan" style={{ display: 'inline-flex', fontSize: '11px' }}>
                          <Wand2 size={10} /> TTS provider: Mock (configure OpenAI/ElevenLabs in .env)
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Render Panel */}
          <div style={{ position: 'sticky', top: '80px' }}>
            <div className="card" style={{ padding: '24px', border: '1px solid rgba(139,92,246,0.25)', background: 'linear-gradient(145deg, rgba(26,21,48,0.9), rgba(15,11,30,0.9))' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Export Settings</h3>

              {/* Summary */}
              <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
                {[
                  { label: 'Format', value: '9:16 Vertical (Shorts/Reels/TikTok)' },
                  { label: 'Resolution', value: '1080 × 1920' },
                  { label: 'Frame Rate', value: '30 FPS' },
                  { label: 'Codec', value: 'H.264 / AAC' },
                  { label: 'Duration', value: `${(clip.duration - config.trimStart - config.trimEnd).toFixed(1)}s` },
                  { label: 'Subtitles', value: config.subtitles ? `${config.subtitleStyle.fontFamily}, ${config.subtitleStyle.position}` : 'Disabled' },
                  { label: 'Music', value: config.musicTrackId ? musicTracks.find(t => t.id === config.musicTrackId)?.title || 'Selected' : 'None' },
                  { label: 'Watermark', value: config.watermark.enabled ? (config.watermark.text || 'Enabled') : 'Disabled' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="divider" />

              <button
                id="render-btn"
                onClick={handleRender}
                disabled={isRendering}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: '15px', padding: '14px', marginTop: '16px' }}
              >
                {isRendering ? (
                  <><Loader size={16} className="animate-spin-slow" /> Starting render...</>
                ) : (
                  <><Wand2 size={16} /> Render & Export</>
                )}
              </button>

              <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '12px', textAlign: 'center', lineHeight: 1.5 }}>
                Rendering processes your clip on the server using FFmpeg. This may take 1–3 minutes depending on clip length.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
