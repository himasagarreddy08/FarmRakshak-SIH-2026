import React, { useEffect, useRef, useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  VolumeX, 
  CheckCircle2, 
  Thermometer, 
  Droplets, 
  CloudRain, 
  ShieldAlert, 
  Globe,
  Radio
} from 'lucide-react';
import { useRakshakChat, FarmingContext } from '../hooks/useRakshakChat';
import { useVoiceAssistant, AppLanguage } from '../hooks/useVoiceAssistant';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import SuggestionChips from '../components/SuggestionChips';

// Language details for UI selector
const LANGUAGES: Array<{ code: AppLanguage; name: string; native: string }> = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
];

import type { FarmStateSnapshot, Field } from '../App';

interface RakshakAssistantProps {
  farmState?: FarmStateSnapshot | null;
  fields?: Field[];
  currentFieldId?: string;
  appLanguage?: AppLanguage;
  onLanguageChange?: (lang: AppLanguage) => void;
}

export const RakshakAssistant: React.FC<RakshakAssistantProps> = ({
  farmState,
  fields = [],
  currentFieldId = 'field-01',
  appLanguage = 'en',
  onLanguageChange,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>(appLanguage);
  const [speakingMessageText, setSpeakingMessageText] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync language with parent if changed
  useEffect(() => {
    if (appLanguage && appLanguage !== selectedLanguage) {
      setSelectedLanguage(appLanguage);
    }
  }, [appLanguage]);

  const currentField = fields.find((f) => f.id === currentFieldId) || fields[0] || {
    id: 'field-01',
    name: 'North Field - Plot 2',
    crop: 'Cotton',
    stage: 'Flowering & Boll formation',
    soilMoisture: 32,
  };

  // Compile active farming context
  const activeFarmingContext: FarmingContext = {
    fieldName: currentField.name,
    crop: farmState?.crop || currentField.crop,
    cropStage: farmState?.cropStage || currentField.stage || 'Flowering & Vegetative',
    soilMoisture: farmState?.sensor.soilMoisture ?? currentField.soilMoisture ?? 32,
    ph: farmState?.sensor.ph ?? 6.7,
    nitrogen: farmState?.sensor.nitrogen ?? '49 kg/ha',
    phosphorus: farmState?.sensor.phosphorus ?? 37,
    potassium: farmState?.sensor.potassium ?? 51,
    temperature: farmState?.weather.temperature ?? 30,
    humidity: farmState?.weather.humidity ?? 68,
    rainfallChance: farmState?.weather.rainfallChance ?? 40,
    windSpeed: (farmState?.weather as any)?.windSpeed ?? 14,
    uvIndex: 7,
    diseaseScan: (farmState as any)?.health ? {
      diseaseName: (farmState as any).health.diseaseName,
      confidence: (farmState as any).health.confidence,
      severity: (farmState as any).health.healthStatus === 'danger' ? 'High' : 'Moderate',
      symptoms: (farmState as any).health.symptoms || 'Foliar discoloration observed',
    } : undefined,
    lastRecommendations: (farmState as any)?.recommendations || [
      'Apply measured irrigation during cooler evening hours',
      'Scout lower leaves for early pest thresholds',
    ],
    farmId: farmState?.farmId || 'farm-01',
    partitionId: farmState?.partitionId || 'partition-02',
  };

  // Voice Assistant Hook
  const {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
  } = useVoiceAssistant({
    language: selectedLanguage,
    onAutoSend: (text) => {
      sendMessage(text);
    },
  });

  // Chat Hook
  const {
    messages,
    isLoading,
    isReconnecting,
    updateContext,
    sendMessage,
    regenerateResponse,
    stopGenerating,
    clearChat,
  } = useRakshakChat({
    language: selectedLanguage,
    initialContext: activeFarmingContext,
    onAssistantReply: (reply) => {
      // If voice was active, read reply aloud
      if (isListening) {
        speak(reply, selectedLanguage);
        setSpeakingMessageText(reply);
      }
    },
  });

  // Auto-scroll chat to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Sync context when farmState changes
  useEffect(() => {
    updateContext(activeFarmingContext);
  }, [farmState, currentFieldId]);

  const handleLanguageSelect = (lang: AppLanguage) => {
    setSelectedLanguage(lang);
    if (onLanguageChange) onLanguageChange(lang);
  };

  const handleSpeakMessage = (text: string) => {
    setSpeakingMessageText(text);
    speak(text, selectedLanguage);
  };

  const handleStopSpeakingMessage = () => {
    stopSpeaking();
    setSpeakingMessageText(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-5xl mx-auto w-full px-2 sm:px-4 py-2">
      {/* Top Header Card */}
      <header className="shrink-0 mb-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500/20">
            <Bot size={24} />
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                Rakshak AI Assistant
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60">
                <Sparkles size={10} /> Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Your AI Farming Companion • Grounded to <strong className="text-emerald-600 dark:text-emerald-400">{activeFarmingContext.fieldName}</strong> ({activeFarmingContext.crop})
            </p>
          </div>
        </div>

        {/* Right Controls: Language Selector, Clear, Voice Status */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Active Speaking Indicator */}
          {isSpeaking && (
            <button
              type="button"
              onClick={handleStopSpeakingMessage}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all animate-pulse"
              title="Stop speaking"
            >
              <VolumeX size={14} />
              <span className="hidden sm:inline">Stop Voice</span>
            </button>
          )}

          {/* Language Switcher Dropdown */}
          <div className="relative inline-flex items-center">
            <Globe size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageSelect(e.target.value as AppLanguage)}
              className="appearance-none pl-7 pr-7 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.native} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          {/* Clear Chat Button */}
          <button
            type="button"
            onClick={clearChat}
            title="Clear conversation"
            className="p-1.5 rounded-xl text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      {/* Farming Context Memory Pill Bar */}
      <div className="shrink-0 mb-2 px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-2 overflow-x-auto text-[11px] text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-3 overflow-x-auto">
          <span className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[10px] flex items-center gap-1 shrink-0">
            <Radio size={12} className="text-emerald-500 animate-pulse" /> Live Farm Memory:
          </span>

          <span className="shrink-0 inline-flex items-center gap-1">
            <strong>Crop:</strong> {activeFarmingContext.crop} ({activeFarmingContext.cropStage})
          </span>

          <span className="shrink-0 inline-flex items-center gap-1">
            <Droplets size={12} className="text-cyan-500" />
            <strong>Moisture:</strong> {activeFarmingContext.soilMoisture}%
          </span>

          <span className="shrink-0 inline-flex items-center gap-1">
            <CloudRain size={12} className="text-blue-500" />
            <strong>Rain:</strong> {activeFarmingContext.rainfallChance}%
          </span>

          <span className="shrink-0 inline-flex items-center gap-1">
            <Thermometer size={12} className="text-amber-500" />
            <strong>Temp:</strong> {activeFarmingContext.temperature}°C
          </span>

          {activeFarmingContext.diseaseScan?.diseaseName && (
            <span className="shrink-0 inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
              <ShieldAlert size={12} />
              Scan: {activeFarmingContext.diseaseScan.diseaseName} ({activeFarmingContext.diseaseScan.confidence}%)
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => updateContext(activeFarmingContext)}
          title="Refresh field memory"
          className="shrink-0 p-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <main className="flex-1 overflow-y-auto px-2 py-3 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 shadow-inner flex flex-col gap-1">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            language={selectedLanguage}
            onRegenerate={regenerateResponse}
            onSpeak={handleSpeakMessage}
            onStopSpeaking={handleStopSpeakingMessage}
            isSpeakingThis={isSpeaking && speakingMessageText === msg.content}
          />
        ))}

        {isReconnecting && (
          <div className="flex items-center gap-2 p-3 my-2 text-xs font-semibold text-amber-700 dark:text-amber-300 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 w-fit animate-pulse">
            <RefreshCw size={14} className="animate-spin text-amber-500" />
            <span>Reconnecting to Rakshak AI backend & retrying...</span>
          </div>
        )}

        {isLoading && !isReconnecting && (
          <div className="flex items-center gap-2 p-3 my-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 w-fit animate-pulse">
            <Sparkles size={16} className="animate-spin" />
            <span>Rakshak AI is analyzing ICAR-KVK agricultural guidelines...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Bottom Area: Suggestion Chips & Chat Input */}
      <footer className="shrink-0 mt-2 space-y-2">
        <SuggestionChips
          language={selectedLanguage}
          onSelectPrompt={(p) => sendMessage(p)}
          disabled={isLoading}
        />

        <ChatInput
          language={selectedLanguage}
          isLoading={isLoading}
          isListening={isListening}
          isSpeaking={isSpeaking}
          onSendMessage={(text) => sendMessage(text)}
          onToggleListen={toggleListening}
          onStopSpeaking={handleStopSpeakingMessage}
          onStopGenerating={stopGenerating}
        />
      </footer>
    </div>
  );
};

export default RakshakAssistant;
