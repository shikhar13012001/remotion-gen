export const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

// Default voice ID - "Rachel" (professional, clear)
// Find more at: https://api.elevenlabs.io/v1/voices
export const DEFAULT_VOICE_ID = "tZssYepgGaQmegsMEXjK";

export interface GenerateOptions {
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  /** Sentence texts for accurate boundary detection in buildWordTimings */
  sentenceTexts?: string[];
}

export interface WordTiming {
  word: string;
  start: number; // seconds
  end: number;   // seconds
  sentenceIndex: number;
}

export interface TimestampResult {
  audioPath: string;
  wordTimings: WordTiming[];
  durationSec: number;
}
