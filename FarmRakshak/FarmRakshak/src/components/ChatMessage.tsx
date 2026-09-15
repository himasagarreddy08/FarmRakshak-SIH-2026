import React, { useState } from 'react';
import { 
  Bot, 
  User, 
  Copy, 
  Check, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Droplets, 
  Wind, 
  Sun, 
  Thermometer, 
  ShieldAlert, 
  Sprout,
  Info
} from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../hooks/useRakshakChat';
import { AppLanguage } from '../hooks/useVoiceAssistant';

interface ChatMessageProps {
  message: ChatMessageType;
  language: AppLanguage;
  onRegenerate?: (id: string) => void;
  onSpeak?: (text: string) => void;
  onStopSpeaking?: () => void;
  isSpeakingThis?: boolean;
}

// Disease Card Data Interface
interface DiseaseCardData {
  name?: string;
  confidence?: number;
  symptoms?: string[];
  causes?: string;
  severity?: 'High' | 'Moderate' | 'Low' | string;
  treatment?: string;
  icarRecommendation?: string;
}

// Weather Card Data Interface
interface WeatherCardData {
  temperature?: string;
  humidity?: string;
  rainProbability?: string;
  wind?: string;
  uv?: string;
  advisory?: string;
}

// Action Card Data Interface
interface ActionItem {
  recommended?: boolean;
  reason?: string;
  details?: string;
}

interface ActionCardData {
  irrigate?: ActionItem;
  spray?: ActionItem;
  fertilize?: ActionItem;
  harvest?: ActionItem;
  monitor?: ActionItem;
}

/**
 * Component to render Rich Disease Card
 */
const DiseaseCard: React.FC<{ data: DiseaseCardData }> = ({ data }) => {
  const severityColors = {
    High: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
    Moderate: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    Low: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  }[data.severity || 'Moderate'] || 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';

  return (
    <div className="my-3 p-4 rounded-xl bg-gradient-to-br from-red-50/60 via-white to-amber-50/40 dark:from-red-950/20 dark:via-slate-900 dark:to-amber-950/10 border border-red-200/60 dark:border-red-900/40 shadow-sm">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-red-100 dark:border-red-900/30">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
            <ShieldAlert size={18} />
          </span>
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              {data.name || 'Crop Disease Diagnostic'}
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              AI Confidence: <strong>{data.confidence ?? 85}%</strong>
            </span>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${severityColors}`}>
          Severity: {data.severity || 'Moderate'}
        </span>
      </div>

      {data.symptoms && data.symptoms.length > 0 && (
        <div className="mb-2.5">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Symptoms:</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {data.symptoms.map((s, idx) => (
              <span key={idx} className="px-2 py-0.5 text-xs rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                • {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.causes && (
        <div className="mb-2 text-xs text-slate-600 dark:text-slate-400">
          <strong className="text-slate-700 dark:text-slate-300">Causes: </strong>
          {data.causes}
        </div>
      )}

      {data.treatment && (
        <div className="mb-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200">
          <strong className="block font-semibold mb-0.5 text-emerald-700 dark:text-emerald-300">
            💊 Recommended Treatment:
          </strong>
          {data.treatment}
        </div>
      )}

      {data.icarRecommendation && (
        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-1.5">
          <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-blue-800 dark:text-blue-300">ICAR / KVK Advisory: </strong>
            {data.icarRecommendation}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Component to render Rich Weather Card
 */
const WeatherCard: React.FC<{ data: WeatherCardData }> = ({ data }) => {
  return (
    <div className="my-3 p-4 rounded-xl bg-gradient-to-br from-blue-50/60 via-white to-cyan-50/40 dark:from-blue-950/20 dark:via-slate-900 dark:to-cyan-950/10 border border-blue-200/60 dark:border-blue-900/40 shadow-sm">
      <div className="flex items-center gap-2 pb-2 mb-3 border-b border-blue-100 dark:border-blue-900/30">
        <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Sun size={18} />
        </span>
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
          Agromet Weather & Field Conditions
        </h4>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center mb-3">
        <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
          <Thermometer size={14} className="mx-auto text-amber-500 mb-1" />
          <div className="text-[11px] text-slate-500">Temp</div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{data.temperature || '30°C'}</div>
        </div>

        <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
          <Droplets size={14} className="mx-auto text-blue-500 mb-1" />
          <div className="text-[11px] text-slate-500">Humidity</div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{data.humidity || '68%'}</div>
        </div>

        <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
          <Droplets size={14} className="mx-auto text-cyan-500 mb-1" />
          <div className="text-[11px] text-slate-500">Rain Prob.</div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{data.rainProbability || '40%'}</div>
        </div>

        <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
          <Wind size={14} className="mx-auto text-teal-500 mb-1" />
          <div className="text-[11px] text-slate-500">Wind</div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{data.wind || '14 km/h'}</div>
        </div>

        <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 col-span-2 sm:col-span-1">
          <Sun size={14} className="mx-auto text-orange-500 mb-1" />
          <div className="text-[11px] text-slate-500">UV Index</div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{data.uv || '7 High'}</div>
        </div>
      </div>

      {data.advisory && (
        <div className="text-xs p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border border-blue-100 dark:border-blue-900/40">
          <strong>Agromet Advisory: </strong>
          {data.advisory}
        </div>
      )}
    </div>
  );
};

/**
 * Component to render Rich Action Plan Card
 */
const ActionCard: React.FC<{ data: ActionCardData }> = ({ data }) => {
  const actions = [
    { key: 'irrigate', label: 'Irrigate', icon: <Droplets size={14} />, item: data.irrigate },
    { key: 'spray', label: 'Spray Application', icon: <Wind size={14} />, item: data.spray },
    { key: 'fertilize', label: 'Fertilization', icon: <Sprout size={14} />, item: data.fertilize },
    { key: 'harvest', label: 'Harvesting', icon: <CheckCircle2 size={14} />, item: data.harvest },
    { key: 'monitor', label: 'Field Scouting', icon: <Info size={14} />, item: data.monitor },
  ];

  return (
    <div className="my-3 p-4 rounded-xl bg-gradient-to-br from-emerald-50/60 via-white to-green-50/40 dark:from-emerald-950/20 dark:via-slate-900 dark:to-green-950/10 border border-emerald-200/60 dark:border-emerald-900/40 shadow-sm">
      <div className="flex items-center gap-2 pb-2 mb-3 border-b border-emerald-100 dark:border-emerald-900/30">
        <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Sprout size={18} />
        </span>
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
          Daily Operational Action Plan
        </h4>
      </div>

      <div className="flex flex-col gap-2">
        {actions.map(({ key, label, icon, item }) => {
          if (!item) return null;
          const isRecommended = item.recommended !== false;
          const text = item.details || item.reason || (isRecommended ? 'Recommended today' : 'Do not perform today');

          return (
            <div
              key={key}
              className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs ${
                isRecommended
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/70 dark:border-emerald-800/40 text-slate-700 dark:text-slate-200'
                  : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/50 text-slate-500 dark:text-slate-400'
              }`}
            >
              <span className={`p-1 rounded-md shrink-0 mt-0.5 ${
                isRecommended ? 'bg-emerald-500 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {icon}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <strong className="text-slate-800 dark:text-slate-100 font-semibold">{label}</strong>
                  {isRecommended ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={11} /> YES
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-400">
                      <XCircle size={11} /> HOLD
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed">{text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Enhanced Markdown Content Parser and Renderer
 */
const FormattedMarkdownContent: React.FC<{ content: string; isStreaming?: boolean }> = ({ content, isStreaming }) => {
  // Extract and separate cards and text
  const parts: React.ReactNode[] = [];
  const cardRegex = /```card:(disease|weather|action)\s*([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = cardRegex.exec(content)) !== null) {
    const preText = content.substring(lastIndex, match.index);
    if (preText.trim()) {
      parts.push(<MarkdownTextChunk key={`text-${lastIndex}`} text={preText} />);
    }

    const cardType = match[1];
    const cardJsonStr = match[2].trim();

    try {
      const parsedData = JSON.parse(cardJsonStr);
      if (cardType === 'disease') {
        parts.push(<DiseaseCard key={`card-${match.index}`} data={parsedData} />);
      } else if (cardType === 'weather') {
        parts.push(<WeatherCard key={`card-${match.index}`} data={parsedData} />);
      } else if (cardType === 'action') {
        parts.push(<ActionCard key={`card-${match.index}`} data={parsedData} />);
      }
    } catch {
      // If incomplete JSON during streaming, show card skeleton or raw text
      parts.push(
        <div key={`card-skeleton-${match.index}`} className="p-3 my-2 text-xs rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 animate-pulse">
          Generating {cardType.toUpperCase()} card...
        </div>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  const remainingText = content.substring(lastIndex);
  if (remainingText) {
    parts.push(<MarkdownTextChunk key={`text-tail`} text={remainingText} />);
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-100 text-sm leading-relaxed space-y-2">
      {parts.length > 0 ? parts : <span className="italic text-slate-400">Thinking...</span>}
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-emerald-500 animate-pulse align-middle" />
      )}
    </div>
  );
};

/**
 * Helper to render markdown text elements: headers, bold, bullets, tables, code blocks, alerts
 */
const MarkdownTextChunk: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = (key: string) => {
    if (tableRows.length === 0) return null;
    const header = tableRows[0];
    const body = tableRows.slice(1);
    tableRows = [];
    inTable = false;

    return (
      <div key={key} className="my-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
        <table className="min-w-full text-xs text-left">
          <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200">
            <tr>
              {header.map((col, idx) => (
                <th key={idx} className="p-2 border-b border-slate-200 dark:border-slate-700">
                  {col.trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {body.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-2 text-slate-700 dark:text-slate-300">
                    {renderInlineStyles(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const flushCode = (key: string) => {
    const code = codeBuffer.join('\n');
    codeBuffer = [];
    inCodeBlock = false;
    return (
      <div key={key} className="my-2.5 p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
        <pre>{code}</pre>
      </div>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(flushCode(`code-${i}`));
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Markdown Table row
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line.split('|').slice(1, -1);
      // Skip separator line e.g. |---|---|
      if (cells.some((c) => c.trim().startsWith('---') || c.trim().startsWith(':--'))) {
        continue;
      }
      inTable = true;
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      elements.push(flushTable(`table-${i}`));
    }

    // Highlighted Alert / Callout
    if (line.trim().startsWith('>')) {
      const alertText = line.replace(/^>\s*/, '');
      const isWarning = alertText.includes('[!WARNING]') || alertText.toLowerCase().includes('warning');
      const isTip = alertText.includes('[!TIP]') || alertText.toLowerCase().includes('tip') || alertText.includes('💡');
      
      elements.push(
        <div
          key={`alert-${i}`}
          className={`my-2 p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
            isWarning
              ? 'bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-500/30'
              : isTip
              ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-500/30'
              : 'bg-blue-500/10 text-blue-800 dark:text-blue-200 border-blue-500/30'
          }`}
        >
          {isWarning ? <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" /> : <Info size={15} className="text-emerald-500 shrink-0 mt-0.5" />}
          <div>{renderInlineStyles(alertText.replace(/\[![A-Z]+\]/gi, '').trim())}</div>
        </div>
      );
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-base font-bold text-slate-900 dark:text-white mt-3 mb-1">
          {renderInlineStyles(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-1 border-b pb-1 border-slate-200 dark:border-slate-700">
          {renderInlineStyles(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-xl font-extrabold text-slate-900 dark:text-white mt-4 mb-2">
          {renderInlineStyles(line.slice(2))}
        </h1>
      );
      continue;
    }

    // Bullets
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      elements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2 ml-2 my-0.5 text-xs">
          <span className="text-emerald-500 mt-1">•</span>
          <span className="flex-1">{renderInlineStyles(line.trim().slice(2))}</span>
        </div>
      );
      continue;
    }

    // Numbered list
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2 ml-2 my-0.5 text-xs">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">{numMatch[1]}.</span>
          <span className="flex-1">{renderInlineStyles(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Standard paragraph line
    if (line.trim()) {
      elements.push(
        <p key={`p-${i}`} className="my-1 text-xs">
          {renderInlineStyles(line)}
        </p>
      );
    }
  }

  if (inTable) {
    elements.push(flushTable(`table-end`));
  }
  if (inCodeBlock) {
    elements.push(flushCode(`code-end`));
  }

  return <>{elements}</>;
};

/**
 * Render bold, italics, inline code within a line
 */
function renderInlineStyles(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-slate-900 dark:text-slate-50">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={idx} className="italic text-slate-700 dark:text-slate-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  language,
  onRegenerate,
  onSpeak,
  onStopSpeaking,
  isSpeakingThis = false,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className={`flex gap-3 my-3 w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-sm shrink-0 ring-2 ring-emerald-500/20">
          <Bot size={18} />
        </div>
      )}

      {/* Message Bubble Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 transition-all duration-200 shadow-sm ${
          isUser
            ? 'bg-emerald-600 text-white rounded-tr-xs'
            : 'bg-white/95 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800 rounded-tl-xs backdrop-blur-xs'
        }`}
      >
        {/* User / Assistant Header in bubble */}
        <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-black/5 dark:border-white/5">
          <span className="text-[11px] font-bold tracking-wide uppercase opacity-80 flex items-center gap-1">
            {isUser ? 'You' : 'Rakshak AI (Gemini 2.5 Flash)'}
          </span>
          <span className="text-[10px] opacity-60">{message.timestamp}</span>
        </div>

        {/* Bubble Content */}
        {isUser ? (
          <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <FormattedMarkdownContent content={message.content} isStreaming={message.isStreaming} />
        )}

        {/* Action Toolbar for Assistant Messages */}
        {!isUser && !message.isStreaming && (
          <div className="flex items-center justify-end gap-1.5 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-slate-500 dark:text-slate-400">
            {/* Read aloud / stop speaking */}
            {onSpeak && (
              <button
                type="button"
                onClick={() => (isSpeakingThis && onStopSpeaking ? onStopSpeaking() : onSpeak(message.content))}
                title={isSpeakingThis ? 'Stop speaking' : 'Read answer aloud'}
                className={`p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs flex items-center gap-1 ${
                  isSpeakingThis ? 'text-amber-500 animate-pulse' : 'hover:text-emerald-600'
                }`}
              >
                {isSpeakingThis ? <VolumeX size={14} /> : <Volume2 size={14} />}
                <span className="text-[11px]">{isSpeakingThis ? 'Stop' : 'Listen'}</span>
              </button>
            )}

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              title="Copy response"
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 transition-colors text-xs flex items-center gap-1"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Regenerate Button */}
            {onRegenerate && (
              <button
                type="button"
                onClick={() => onRegenerate(message.id)}
                title="Regenerate response"
                className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 transition-colors text-xs flex items-center gap-1"
              >
                <RotateCw size={14} />
                <span className="text-[11px]">Regenerate</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-700 dark:bg-slate-600 flex items-center justify-center text-white shadow-sm shrink-0">
          <User size={18} />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
