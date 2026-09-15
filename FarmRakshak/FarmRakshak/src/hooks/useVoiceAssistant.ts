import { useState, useRef, useCallback, useEffect } from 'react';

export type AppLanguage = 'en' | 'hi' | 'te' | 'mr';

const LANG_CODE_MAP: Record<AppLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  mr: 'mr-IN',
};

export interface UseVoiceAssistantProps {
  language: AppLanguage;
  onTranscript?: (text: string) => void;
  onAutoSend?: (text: string) => void;
}

export function useVoiceAssistant({ language, onTranscript, onAutoSend }: UseVoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasSpeech = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    setIsSupported(hasSpeech);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    }
  }, []);

  const speak = useCallback((rawText: string, lang: AppLanguage = language) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    stopSpeaking();

    // Clean markdown, card blocks, and code blocks for clean speech
    const cleanText = rawText
      .replace(/```card:[\s\S]*?```/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#{1,6}\s+/g, '')
      .replace(/>\s*/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    currentUtteranceRef.current = utterance;
    utterance.lang = LANG_CODE_MAP[lang] || 'en-IN';
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    // Pick best available voice for language
    const voices = window.speechSynthesis.getVoices();
    const targetLang = LANG_CODE_MAP[lang] || 'en-IN';
    const matchingVoice = voices.find((v) => v.lang === targetLang || v.lang.startsWith(targetLang.slice(0, 2)));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [language, stopSpeaking]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    stopSpeaking();

    if (typeof window === 'undefined' || !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use keyboard input.');
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRec();
    recognitionRef.current = recognition;

    recognition.lang = LANG_CODE_MAP[language] || 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      let current = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
      if (onTranscript) {
        onTranscript(current);
      }

      // If final result
      if (event.results[0] && event.results[0].isFinal) {
        setIsListening(false);
        if (onAutoSend && current.trim()) {
          onAutoSend(current.trim());
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('[VoiceAssistant] recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error('[VoiceAssistant] start error:', e);
      setIsListening(false);
    }
  }, [language, onTranscript, onAutoSend, stopSpeaking]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSpeaking,
    transcript,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
  };
}
