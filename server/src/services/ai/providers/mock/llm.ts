// ============================================================
// Mock LLM Provider
// Generates deterministic clip suggestions for development
// Simulates AI analysis without any API calls
// ============================================================
import { ILLMProvider, ClipAnalysisInput, LLMResult, ClipSuggestion, TranscriptSegment } from '../../types';

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickSlice(segments: TranscriptSegment[], startSec: number, durationSec: number): TranscriptSegment[] {
  return segments.filter((s) => s.start >= startSec && s.end <= startSec + durationSec);
}

const HOOKS = [
  'What if everything you knew about this topic was wrong?',
  "Here's the secret that top creators don't want you to know.",
  'I made this mistake for 3 years — don\'t make it too.',
  'This one change doubled my results overnight.',
  'Nobody talks about this, but it\'s the most important thing.',
  'The algorithm is broken — here\'s how to beat it.',
  'Stop doing this immediately if you want to grow.',
];

const TOPIC_SETS = [
  ['growth strategy', 'content creation', 'algorithm'],
  ['retention', 'watch time', 'engagement'],
  ['hook writing', 'storytelling', 'attention'],
  ['monetization', 'revenue', 'audience'],
  ['consistency', 'workflow', 'productivity'],
];

const EMOTION_SETS = [
  ['curiosity', 'motivation'],
  ['surprise', 'inspiration'],
  ['urgency', 'excitement'],
  ['empathy', 'trust'],
];

const REASONS = [
  'High-energy delivery with clear value proposition. Perfect hook for short-form content.',
  'Concise actionable advice delivered with urgency — strong engagement potential.',
  'Emotional resonance combined with practical tips — shareable moment.',
  'Strong narrative arc with a satisfying conclusion — great standalone clip.',
  'Counter-intuitive insight that challenges viewer assumptions — high virality potential.',
];

export class MockLLMProvider implements ILLMProvider {
  name = 'mock';

  async analyzeClips(input: ClipAnalysisInput): Promise<LLMResult> {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const { transcript: segments, videoMetadata } = input;
    const totalDuration = videoMetadata.duration || segments[segments.length - 1]?.end || 300;

    const targetDurations: (30 | 60 | 120)[] = [30, 60, 30, 120, 60];
    const clips: ClipSuggestion[] = [];

    // Spread clips evenly across the video
    const sectionSize = totalDuration / (targetDurations.length + 1);

    for (let i = 0; i < Math.min(targetDurations.length, 5); i++) {
      const targetDuration = targetDurations[i];
      const sectionStart = sectionSize * (i + 0.5);
      const maxStart = Math.max(0, totalDuration - targetDuration);
      const startTime = Math.min(Math.round(sectionStart), maxStart);
      const endTime = startTime + targetDuration;

      const slice = pickSlice(segments, startTime, targetDuration);

      clips.push({
        title: `Clip ${i + 1}: ${videoMetadata.title.substring(0, 40)} — Key Moment`,
        startTime,
        endTime,
        duration: targetDuration,
        hook: HOOKS[i % HOOKS.length],
        reason: REASONS[i % REASONS.length],
        engagementScore: getRandomInt(62, 95),
        topics: TOPIC_SETS[i % TOPIC_SETS.length],
        emotions: EMOTION_SETS[i % EMOTION_SETS.length],
        transcriptSlice: slice,
      });
    }

    return { clips };
  }

  async generateCommentary(clipText: string, style = 'engaging'): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return `[AI Commentary] This moment captures a key insight: "${clipText.substring(0, 80)}..." — a powerful takeaway that resonates with anyone looking to level up their content game.`;
  }
}
