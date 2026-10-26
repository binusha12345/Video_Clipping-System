// ============================================================
// AI Provider Factory
// Selects the correct STT/LLM/TTS provider based on env config
// ============================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const require: any;

import { env } from '../../config/env';
import { ISTTProvider, ILLMProvider, ITTSProvider } from './types';
import { MockSTTProvider } from './providers/mock/stt';
import { MockLLMProvider } from './providers/mock/llm';
import { MockTTSProvider } from './providers/mock/tts';
import { logger } from '../../utils/logger';

// Lazy-load OpenAI providers only if configured
function createSTTProvider(): ISTTProvider {
  switch (env.AI_STT_PROVIDER) {
    case 'mock':
      logger.info('[AI] Using Mock STT provider');
      return new MockSTTProvider();
    case 'openai':
      // Dynamic import to avoid requiring openai package when not used
      try {
        const { OpenAISTTProvider } = require('./providers/openai/stt');
        logger.info('[AI] Using OpenAI Whisper STT provider');
        return new OpenAISTTProvider(env.OPENAI_API_KEY!);
      } catch {
        logger.warn('[AI] OpenAI STT provider not available, falling back to mock');
        return new MockSTTProvider();
      }
    case 'assemblyai':
      try {
        const { AssemblyAISTTProvider } = require('./providers/assemblyai/stt');
        logger.info('[AI] Using AssemblyAI STT provider');
        return new AssemblyAISTTProvider(env.ASSEMBLYAI_API_KEY!);
      } catch {
        logger.warn('[AI] AssemblyAI STT provider not available, falling back to mock');
        return new MockSTTProvider();
      }
    default:
      return new MockSTTProvider();
  }
}

function createLLMProvider(): ILLMProvider {
  switch (env.AI_LLM_PROVIDER) {
    case 'mock':
      logger.info('[AI] Using Mock LLM provider');
      return new MockLLMProvider();
    case 'openai':
      try {
        const { OpenAILLMProvider } = require('./providers/openai/llm');
        logger.info('[AI] Using OpenAI GPT-4 LLM provider');
        return new OpenAILLMProvider(env.OPENAI_API_KEY!);
      } catch {
        logger.warn('[AI] OpenAI LLM provider not available, falling back to mock');
        return new MockLLMProvider();
      }
    default:
      return new MockLLMProvider();
  }
}

function createTTSProvider(): ITTSProvider {
  switch (env.AI_TTS_PROVIDER) {
    case 'mock':
      logger.info('[AI] Using Mock TTS provider');
      return new MockTTSProvider();
    case 'openai':
      try {
        const { OpenAITTSProvider } = require('./providers/openai/tts');
        logger.info('[AI] Using OpenAI TTS provider');
        return new OpenAITTSProvider(env.OPENAI_API_KEY!);
      } catch {
        logger.warn('[AI] OpenAI TTS provider not available, falling back to mock');
        return new MockTTSProvider();
      }
    case 'elevenlabs':
      try {
        const { ElevenLabsTTSProvider } = require('./providers/elevenlabs/tts');
        logger.info('[AI] Using ElevenLabs TTS provider');
        return new ElevenLabsTTSProvider(env.ELEVENLABS_API_KEY!);
      } catch {
        logger.warn('[AI] ElevenLabs TTS provider not available, falling back to mock');
        return new MockTTSProvider();
      }
    default:
      return new MockTTSProvider();
  }
}

// Singleton providers
export const sttProvider: ISTTProvider = createSTTProvider();
export const llmProvider: ILLMProvider = createLLMProvider();
export const ttsProvider: ITTSProvider = createTTSProvider();
