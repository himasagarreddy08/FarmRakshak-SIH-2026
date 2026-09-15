import React from 'react';
import { Mic, MicOff, VolumeX } from 'lucide-react';

interface VoiceButtonProps {
  isListening: boolean;
  isSpeaking?: boolean;
  onToggleListen: () => void;
  onStopSpeaking?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  isListening,
  isSpeaking = false,
  onToggleListen,
  onStopSpeaking,
  disabled = false,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-3',
  }[size];

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  }[size];

  return (
    <div className="relative inline-flex items-center gap-1.5">
      {/* If speaking aloud, show stop speaking shortcut */}
      {isSpeaking && onStopSpeaking && (
        <button
          type="button"
          onClick={onStopSpeaking}
          title="Stop reading aloud"
          className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all animate-pulse"
        >
          <VolumeX size={14} />
          <span>Stop Voice</span>
        </button>
      )}

      {/* Main Microphone Button */}
      <button
        type="button"
        onClick={onToggleListen}
        disabled={disabled}
        title={isListening ? 'Stop listening (click to finish)' : 'Start speaking (voice query)'}
        aria-label={isListening ? 'Stop listening' : 'Start speaking'}
        className={`relative flex items-center justify-center rounded-full transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 ${sizeClasses} ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white scale-105 shadow-red-500/40 shadow-lg ring-4 ring-red-400/40'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md hover:scale-105'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {isListening ? (
          <>
            <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-60 pointer-events-none" />
            <MicOff size={iconSizes} className="relative z-10" />
          </>
        ) : (
          <Mic size={iconSizes} />
        )}
      </button>
    </div>
  );
};

export default VoiceButton;
