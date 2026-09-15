import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Square, Sparkles } from 'lucide-react';
import VoiceButton from './VoiceButton';
import { AppLanguage } from '../hooks/useVoiceAssistant';

interface ChatInputProps {
  language: AppLanguage;
  isLoading: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  onSendMessage: (text: string) => void;
  onToggleListen: () => void;
  onStopSpeaking: () => void;
  onStopGenerating: () => void;
}

const PLACEHOLDERS: Record<AppLanguage, string> = {
  en: "Ask Rakshak about irrigation, pests, fertilizer, or today's plan...",
  hi: 'सिंचाई, कीट, उर्वरक या आज की कृषि योजना के बारे में रक्षक से पूछें...',
  te: 'నీటిపారుదల, పురుగులు, ఎరువులు లేదా నేటి ప్రణాళిక గురించి రక్షక్‌ను అడగండి...',
  mr: 'पाणी व्यवस्थापन, कीड, खते किंवा आजच्या कृती योजनेबद्दल विचारा...',
};

export const ChatInput: React.FC<ChatInputProps> = ({
  language,
  isLoading,
  isListening,
  isSpeaking,
  onSendMessage,
  onToggleListen,
  onStopSpeaking,
  onStopGenerating,
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [text]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative w-full">
      <div className="flex items-end gap-2 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700 shadow-md focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all duration-200">
        {/* Voice Input Button */}
        <div className="shrink-0 mb-0.5">
          <VoiceButton
            isListening={isListening}
            isSpeaking={isSpeaking}
            onToggleListen={onToggleListen}
            onStopSpeaking={onStopSpeaking}
            disabled={isLoading}
            size="md"
          />
        </div>

        {/* Dynamic Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDERS[language] || PLACEHOLDERS.en}
          rows={1}
          disabled={isLoading}
          className="flex-1 max-h-32 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none resize-none py-2 px-1 leading-relaxed"
        />

        {/* Send / Stop Streaming Button */}
        <div className="shrink-0 mb-0.5">
          {isLoading ? (
            <button
              type="button"
              onClick={onStopGenerating}
              title="Stop response generation"
              className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Square size={16} className="fill-current text-white" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!text.trim()}
              title="Send message to Rakshak AI"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
                text.trim()
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 cursor-pointer hover:shadow-emerald-500/20 hover:shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Sparkles size={12} className="text-emerald-500" />
          <span>Grounded in ICAR & KVK guidelines • Press Enter to send</span>
        </span>
        <span>Google Gemini 2.5 Flash</span>
      </div>
    </div>
  );
};

export default ChatInput;
