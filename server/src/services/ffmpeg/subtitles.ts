// ============================================================
// ASS Subtitle Generator
// Generates ASS subtitle files from transcript segments
// with full style support (font, color, position, animation)
// ============================================================
import fs from 'fs';
import path from 'path';

export interface SubtitleStyleConfig {
  fontFamily: string;
  fontSize: number;
  color: string;         // hex like #FFFFFF
  outlineColor: string;  // hex like #000000
  outlineWidth: number;
  bold: boolean;
  italic: boolean;
  position: 'top' | 'middle' | 'bottom';
  animation: 'none' | 'fade-in' | 'slide-up' | 'typewriter' | 'bounce';
  backgroundColor?: string;
  backgroundOpacity?: number;
}

export interface TranscriptSeg {
  start: number;
  end: number;
  text: string;
}

/**
 * Convert hex color to ASS BGR format
 */
function hexToASS(hex: string, alpha = 0): string {
  const clean = hex.replace('#', '');
  const r = clean.substring(0, 2);
  const g = clean.substring(2, 4);
  const b = clean.substring(4, 6);
  const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `&H${alphaHex}${b}${g}${r}`;
}

function secondsToASS(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.round((seconds % 1) * 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

function getVerticalAlignment(position: string): number {
  switch (position) {
    case 'top': return 8;
    case 'middle': return 5;
    case 'bottom': return 2;
    default: return 2;
  }
}

function getAnimationTag(animation: string, duration: number): string {
  const ms = Math.round(duration * 1000);
  switch (animation) {
    case 'fade-in':
      return `{\\fad(${Math.min(ms, 300)},0)}`;
    case 'slide-up':
      return `{\\move(960,1100,960,1000)}`;
    case 'bounce':
      return `{\\fad(100,100)}`;
    case 'typewriter':
      return ''; // handled per character — simplify to no animation
    default:
      return '';
  }
}

/**
 * Generate ASS subtitle file from transcript segments
 * Offsets timestamps relative to clip start time
 */
export function generateASSSubtitles(
  segments: TranscriptSeg[],
  clipStartTime: number,
  outputPath: string,
  style: SubtitleStyleConfig
): string {
  const alignment = getVerticalAlignment(style.position);
  const primaryColor = hexToASS(style.color);
  const outlineColor = hexToASS(style.outlineColor);
  const backColor = style.backgroundColor
    ? hexToASS(style.backgroundColor, 1 - (style.backgroundOpacity ?? 0))
    : '&H80000000';

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style.fontFamily},${style.fontSize},${primaryColor},${primaryColor},${outlineColor},${backColor},${style.bold ? '-1' : '0'},${style.italic ? '-1' : '0'},0,0,100,100,0,0,1,${style.outlineWidth},0,${alignment},80,80,60,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = segments
    .map((seg) => {
      // Adjust timestamps relative to clip start
      const start = Math.max(0, seg.start - clipStartTime);
      const end = Math.max(0, seg.end - clipStartTime);
      if (start >= end) return null;

      const animTag = getAnimationTag(style.animation, end - start);
      // Word-wrap at ~40 characters for vertical format
      const wrappedText = wrapText(seg.text, 40);

      return `Dialogue: 0,${secondsToASS(start)},${secondsToASS(end)},Default,,0,0,0,,${animTag}${wrappedText}`;
    })
    .filter(Boolean)
    .join('\n');

  const assContent = header + events;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, assContent, 'utf8');

  return outputPath;
}

function wrapText(text: string, maxWidth: number): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxWidth) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) lines.push(current);

  return lines.join('\\N');
}
