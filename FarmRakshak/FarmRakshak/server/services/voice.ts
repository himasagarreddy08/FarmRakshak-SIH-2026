import { LanguageCode } from './gemini';

export interface VoiceMetadata {
  language: LanguageCode;
  langCode: string;
  recommendedVoiceNames: string[];
  pitch: number;
  rate: number;
}

export const REGIONAL_VOICE_CONFIGS: Record<LanguageCode, VoiceMetadata> = {
  en: {
    language: 'en',
    langCode: 'en-IN',
    recommendedVoiceNames: ['Google हिन्दी', 'Google UK English Female', 'Microsoft Heera - English (India)', 'en-IN'],
    pitch: 1.0,
    rate: 0.95,
  },
  hi: {
    language: 'hi',
    langCode: 'hi-IN',
    recommendedVoiceNames: ['Google हिन्दी', 'Microsoft Kalpana - Hindi (India)', 'hi-IN'],
    pitch: 1.0,
    rate: 0.9,
  },
  te: {
    language: 'te',
    langCode: 'te-IN',
    recommendedVoiceNames: ['Google తెలుగు', 'Microsoft Mohan - Telugu (India)', 'te-IN'],
    pitch: 1.0,
    rate: 0.9,
  },
  mr: {
    language: 'mr',
    langCode: 'mr-IN',
    recommendedVoiceNames: ['Google मराठी', 'Microsoft Aarohi - Marathi (India)', 'mr-IN'],
    pitch: 1.0,
    rate: 0.9,
  },
};

export class VoiceService {
  /**
   * Returns recommended voice synthesis settings for the given language
   */
  public static getVoiceSettings(language: LanguageCode): VoiceMetadata {
    return REGIONAL_VOICE_CONFIGS[language] || REGIONAL_VOICE_CONFIGS.en;
  }

  /**
   * Sanitizes text for cleaner speech synthesis (strips markdown formatting, code blocks, card blocks)
   */
  public static prepareTextForSpeech(markdown: string): string {
    if (!markdown) return '';

    return markdown
      // Remove code blocks and card blocks
      .replace(/```card:[\s\S]*?```/g, '')
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove bold and italics
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove headers
      .replace(/#{1,6}\s+/g, '')
      // Remove blockquotes & callouts
      .replace(/>\s*\[![A-Z]+\]/gi, '')
      .replace(/>\s*/g, '')
      // Remove markdown links e.g. [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove excessive whitespace & clean punctuation
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .trim();
  }
}
