// ============================================================
// Mock STT Provider
// Returns realistic-looking transcript segments for development
// No external API calls — fully deterministic for testing
// ============================================================
import { ISTTProvider, STTResult, TranscriptSegment } from '../../types';

const SAMPLE_SENTENCES = [
  "If you've ever wondered how the top creators on YouTube manage to grow so fast,",
  "I'm going to show you exactly what they do differently.",
  "The number one mistake most people make is focusing on subscribers instead of watch time.",
  "Here's the thing — the algorithm doesn't care about your subscriber count.",
  "What it actually rewards is session time and click-through rate.",
  "Let me break this down into three simple steps that anyone can implement today.",
  "First, you need to hook your audience within the first three seconds.",
  "Studies show that 60 percent of viewers decide to leave in the first five seconds.",
  "Your opening needs to create immediate curiosity or promise a clear benefit.",
  "Second, you need to deliver value faster than your competitors.",
  "Don't spend two minutes introducing yourself — get to the point immediately.",
  "The creator who gives the most value in the shortest time wins every time.",
  "Third, end every video with a bridge to your next piece of content.",
  "Tell viewers exactly what they should watch next and why.",
  "This is how you build a loyal audience that comes back week after week.",
  "The creators who understand retention are the ones who go viral consistently.",
  "It's not about luck — it's about engineering every single second of your video.",
  "If you apply these three principles, you will see results within 30 days.",
  "I've seen channels go from zero to a hundred thousand subscribers in three months.",
  "The difference is always in the execution, not the idea.",
  "Now let me show you some real examples from channels that have done this successfully.",
  "Take a look at this video — notice how they set up the hook in the thumbnail.",
  "Everything from the title to the first frame is designed to maximize curiosity.",
  "This is what we call a pattern interrupt — something unexpected that stops the scroll.",
  "The best creators are not just storytellers — they are engineers of attention.",
  "Every transition, every cut, every music cue is intentional.",
  "When you start treating your content like a product, your growth becomes predictable.",
  "I want you to take one thing from this video and apply it to your next upload.",
  "Don't try to change everything at once — start with your hook.",
  "Rewrite the first fifteen seconds of your next video using what you learned here.",
];

export class MockSTTProvider implements ISTTProvider {
  name = 'mock';

  async transcribe(audioPath: string, language = 'en'): Promise<STTResult> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const segments: TranscriptSegment[] = [];
    let currentTime = 0;

    for (let i = 0; i < SAMPLE_SENTENCES.length; i++) {
      const sentence = SAMPLE_SENTENCES[i];
      const wordCount = sentence.split(' ').length;
      const duration = wordCount * 0.4 + Math.random() * 0.3; // ~2.5 words/sec
      const pause = Math.random() * 0.5; // natural pause between sentences

      segments.push({
        start: Math.round(currentTime * 100) / 100,
        end: Math.round((currentTime + duration) * 100) / 100,
        text: sentence,
        confidence: 0.88 + Math.random() * 0.12,
        speaker: 'SPEAKER_00',
      });

      currentTime += duration + pause;
    }

    const fullText = segments.map((s) => s.text).join(' ');

    return {
      segments,
      fullText,
      language,
      duration: currentTime,
    };
  }
}
