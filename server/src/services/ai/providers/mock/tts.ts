// ============================================================
// Mock TTS Provider
// Returns a path to a silent placeholder audio file
// ============================================================
import { ITTSProvider, TTSResult } from '../../types';
import path from 'path';
import fs from 'fs';
import { storagePath } from '../../../../config/storage';

export class MockTTSProvider implements ITTSProvider {
  name = 'mock';

  async synthesize(text: string, voiceId = 'default', outputPath?: string): Promise<TTSResult> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const filename = outputPath || `tts_${Date.now()}.mp3`;
    const fullPath = path.join(storagePath, 'audio', filename);

    // Create a minimal silent MP3 file as placeholder
    // 1 second of silence encoded as minimal MP3
    const silentMp3 = Buffer.from(
      'fffb9000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      'hex'
    );
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, silentMp3);

    return {
      audioPath: fullPath,
      duration: Math.ceil(text.split(' ').length / 2.5), // ~2.5 words per second
    };
  }
}
