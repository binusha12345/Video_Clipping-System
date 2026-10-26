#!/usr/bin/env node
// ============================================================
// Generates the bundled CC0 music library.
//
// Every track is synthesised from scratch (oscillators and
// noise — no samples, no third-party audio), so the output is
// genuinely CC0 / public domain, which is what the app claims.
//
//   npm run music:generate        (from server/)
//   node scripts/generate-music.js --force
//
// Output: storage/music/<track-id>.mp3
// ============================================================
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const SAMPLE_RATE = 44100;
const LOOP_SECONDS = 60;
const OUT_DIR = path.resolve(__dirname, '../storage/music');
const FORCE = process.argv.includes('--force');

const TWO_PI = Math.PI * 2;

const TRACKS = [
  {
    id: 'upbeat-corporate-01',
    title: 'Upbeat Corporate',
    genre: 'Corporate',
    bpm: 128,
    root: 261.63, // C4
    style: 'pluck',
    progression: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [5, 9, 12]],
    description: 'Clean, professional background music suitable for tutorials and presentations.',
  },
  {
    id: 'ambient-chill-01',
    title: 'Ambient Chill',
    genre: 'Ambient',
    bpm: 90,
    root: 220.0, // A3
    style: 'pad',
    progression: [[0, 7, 12], [-2, 5, 10], [3, 10, 15], [0, 7, 12]],
    description: 'Relaxed, atmospheric background music perfect for lifestyle content.',
  },
  {
    id: 'energetic-pop-01',
    title: 'Energetic Pop',
    genre: 'Pop',
    bpm: 140,
    root: 293.66, // D4
    style: 'pluck',
    progression: [[0, 4, 7, 11], [7, 11, 14, 17], [5, 9, 12, 16], [7, 11, 14, 17]],
    description: 'High-energy pop beat ideal for highlights and montages.',
  },
  {
    id: 'lo-fi-beats-01',
    title: 'Lo-Fi Study Beats',
    genre: 'Lo-Fi',
    bpm: 85,
    root: 196.0, // G3
    style: 'lofi',
    progression: [[0, 3, 7, 10], [-2, 2, 5, 9], [3, 7, 10, 14], [0, 3, 7, 10]],
    description: 'Mellow lo-fi hip hop beats for a relaxed, focused atmosphere.',
  },
  {
    id: 'cinematic-inspire-01',
    title: 'Cinematic Inspire',
    genre: 'Cinematic',
    bpm: 110,
    root: 174.61, // F3
    style: 'pad',
    progression: [[0, 7, 12, 16], [5, 12, 17, 21], [-4, 3, 8, 12], [0, 7, 12, 16]],
    description: 'Epic, motivational cinematic music for storytelling content.',
  },
  {
    id: 'electronic-future-01',
    title: 'Electronic Future',
    genre: 'Electronic',
    bpm: 132,
    root: 246.94, // B3
    style: 'pluck',
    progression: [[0, 3, 7], [0, 3, 7], [-2, 2, 5], [0, 3, 7]],
    description: 'Modern electronic beats perfect for tech and gaming content.',
  },
];

function midiFreq(root, semitones) {
  return root * Math.pow(2, semitones / 12);
}

/** Per-sample value of a decaying sine note. */
function tone(t, freq, decay, phase) {
  return Math.sin(TWO_PI * freq * t + phase) * Math.exp(-t * decay);
}

function triangle(t, freq) {
  const p = (t * freq) % 1;
  return 4 * Math.abs(p - 0.5) - 1;
}

/** Deterministic noise so runs are reproducible. */
let noiseSeed = 0x2f6e2b1;
function noise() {
  noiseSeed = (noiseSeed * 1103515245 + 12345) & 0x7fffffff;
  return (noiseSeed / 0x7fffffff) * 2 - 1;
}

function renderTrack(spec) {
  const total = Math.floor(SAMPLE_RATE * LOOP_SECONDS);
  const left = new Float64Array(total);
  const right = new Float64Array(total);
  const beat = 60 / spec.bpm;
  const bar = beat * 4;
  const step = beat / 2; // eighth notes

  let lpStateL = 0;
  let lpStateR = 0;
  let hatEnv = 0;

  for (let i = 0; i < total; i++) {
    const t = i / SAMPLE_RATE;
    const barPos = t % bar;
    const chordIndex = Math.floor(t / bar) % spec.progression.length;
    const chord = spec.progression[chordIndex];
    const stepIndex = Math.floor(t / step);
    const noteInChord = chord[stepIndex % chord.length];
    const beatPos = (t % beat) / beat;

    // ── Bass: root of the chord, one note per bar ─────────────
    const bass = tone(t % bar, midiFreq(spec.root, chord[0] - 24), 1.2, 0) * 0.34;

    // ── Chord bed ─────────────────────────────────────────────
    let chordL = 0;
    let chordR = 0;
    for (const semi of chord) {
      const f = midiFreq(spec.root, semi);
      if (spec.style === 'pad') {
        chordL += Math.sin(TWO_PI * f * t) * 0.16 + Math.sin(TWO_PI * f * 1.003 * t) * 0.1;
        chordR += Math.sin(TWO_PI * f * 1.001 * t + 1.1) * 0.16 + Math.sin(TWO_PI * f * 0.997 * t) * 0.1;
      } else {
        const env = Math.exp(-barPos * 3.5);
        const v = (spec.style === 'lofi' ? triangle(t, f) : Math.sin(TWO_PI * f * t)) * env;
        chordL += v * 0.13;
        chordR += v * 0.13;
      }
    }

    // ── Melody / arpeggio on eighth notes ─────────────────────
    const noteT = t - stepIndex * step;
    const melodyFreq = midiFreq(spec.root, noteInChord + 12);
    const melody = spec.style === 'pad'
      ? tone(noteT, melodyFreq, 4, 0) * 0.12
      : tone(noteT, melodyFreq, 6, 0) * 0.2;

    // ── Percussion ────────────────────────────────────────────
    let drumsL = 0;
    let drumsR = 0;
    if (spec.style !== 'pad') {
      // kick: pitch-swept sine on every beat
      const kickT = t % beat;
      const kickFreq = 120 * Math.exp(-kickT * 26) + 45;
      const kick = Math.sin(TWO_PI * kickFreq * kickT) * Math.exp(-kickT * 12) * 0.5;
      // hat: short noise burst on off-beats
      const nearOff = Math.abs(beatPos - 0.5);
      if (nearOff < 0.02) hatEnv = 1;
      hatEnv *= 0.985;
      const hat = noise() * hatEnv * (spec.style === 'lofi' ? 0.08 : 0.12);
      drumsL = kick + hat * 0.7;
      drumsR = kick + hat;
    }

    // ── Gentle low-pass to keep it warm ───────────────────────
    const inL = chordL + melody * 0.9 + bass + drumsL;
    const inR = chordR + melody * 1.1 + bass + drumsR;
    lpStateL += (inL - lpStateL) * 0.45;
    lpStateR += (inR - lpStateR) * 0.45;

    // Fade the loop in/out so looping is seamless
    const edge = Math.min(1, t / 1.5, (LOOP_SECONDS - t) / 1.5);
    const fade = Math.max(0, edge);
    left[i] = Math.tanh(lpStateL * 1.4) * 0.85 * fade;
    right[i] = Math.tanh(lpStateR * 1.4) * 0.85 * fade;
  }

  return { left, right };
}

function writeWav(filePath, left, right) {
  const frames = left.length;
  const dataSize = frames * 2 * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(2, 22); // stereo
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < frames; i++) {
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(left[i] * 32767))), offset);
    offset += 2;
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(right[i] * 32767))), offset);
    offset += 2;
  }
  fs.writeFileSync(filePath, buf);
}

function encodeMp3(wavPath, mp3Path) {
  const ffmpegPath = require('ffmpeg-static');
  const result = spawnSync(
    ffmpegPath,
    ['-y', '-i', wavPath, '-codec:a', 'libmp3lame', '-b:a', '160k', mp3Path],
    { encoding: 'utf8' }
  );
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed encoding ${mp3Path}: ${(result.stderr || '').split('\n').slice(-8).join('\n')}`);
  }
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const track of TRACKS) {
    const mp3Path = path.join(OUT_DIR, `${track.id}.mp3`);
    if (fs.existsSync(mp3Path) && !FORCE) {
      console.log(`⏭  ${track.title} — already exists`);
      continue;
    }

    process.stdout.write(`🎵 ${track.title} (${track.bpm} BPM)... `);
    const started = Date.now();
    const { left, right } = renderTrack(track);
    const wavPath = path.join(OUT_DIR, `${track.id}.wav`);
    writeWav(wavPath, left, right);
    encodeMp3(wavPath, mp3Path);
    fs.unlinkSync(wavPath);
    console.log(`done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  }

  console.log(`\nMusic library ready: ${OUT_DIR}`);
})().catch((err) => {
  console.error('Music generation failed:', err.message);
  process.exit(1);
});
