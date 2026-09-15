import React from 'react';
import { Droplets, AlertTriangle, Bug, Sparkles, CloudSun, CalendarCheck } from 'lucide-react';
import { AppLanguage } from '../hooks/useVoiceAssistant';

interface SuggestionChipsProps {
  language: AppLanguage;
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

interface ChipItem {
  id: string;
  icon: React.ReactNode;
  text: Record<AppLanguage, string>;
}

const CHIPS: ChipItem[] = [
  {
    id: 'irrigate',
    icon: <Droplets size={14} className="text-cyan-500" />,
    text: {
      en: 'Should I irrigate today?',
      hi: 'क्या मुझे आज सिंचाई करनी चाहिए?',
      te: 'ఈరోజు నేను నీరు పెట్టాలా?',
      mr: 'मी आज पाणी द्यावे का?',
    },
  },
  {
    id: 'disease',
    icon: <Bug size={14} className="text-red-500" />,
    text: {
      en: 'Diagnose my crop disease.',
      hi: 'मेरी फसल के रोग का निदान करें।',
      te: 'నా పంట తెగులును గుర్తించండి.',
      mr: 'माझ्या पिकाच्या रोगाचे निदान करा.',
    },
  },
  {
    id: 'bacterial-spot',
    icon: <Bug size={14} className="text-amber-500" />,
    text: {
      en: 'Explain bacterial leaf spot.',
      hi: 'बैक्टीरियल लीफ स्पॉट के बारे में समझाएं।',
      te: 'బాక్టీరియల్ ఆకు మచ్చ గురించి వివరించండి.',
      mr: 'जिवाणूजन्य करप्याबद्दल माहिती द्या.',
    },
  },
  {
    id: 'fertilizer',
    icon: <Sparkles size={14} className="text-emerald-500" />,
    text: {
      en: "Today's fertilizer recommendation.",
      hi: 'आज की उर्वरक सिफारिश बताएं।',
      te: 'నేటి ఎరువుల సిఫార్సు.',
      mr: 'आजची खत शिफारस सांगा.',
    },
  },
  {
    id: 'weather-risk',
    icon: <CloudSun size={14} className="text-blue-500" />,
    text: {
      en: 'Weather risk.',
      hi: 'मौसम का जोखिम समझाएं।',
      te: 'వాతావరణ ముప్పు వివరించండి.',
      mr: 'हवामानाचा धोका सांगा.',
    },
  },
  {
    id: 'risk-elevation',
    icon: <AlertTriangle size={14} className="text-orange-500" />,
    text: {
      en: 'Why is my risk level elevated?',
      hi: 'मेरा जोखिम स्तर क्यों बढ़ा हुआ है?',
      te: 'నా ప్రమాద స్థాయి ఎందుకు పెరిగింది?',
      mr: 'माझा धोका पातळी का वाढली आहे?',
    },
  },
  {
    id: 'action-plan',
    icon: <CalendarCheck size={14} className="text-purple-500" />,
    text: {
      en: "Give today's action plan.",
      hi: 'आज की कार्ययोजना बताएं।',
      te: 'నేటి కార్యాచరణ ప్రణాళికను ఇవ్వండి.',
      mr: 'आजची कृषी कृती योजना द्या.',
    },
  },
];

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({
  language,
  onSelectPrompt,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar scroll-smooth">
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((chip) => {
          const promptText = chip.text[language] || chip.text.en;
          return (
            <button
              key={chip.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectPrompt(promptText)}
              className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 whitespace-nowrap"
            >
              <span className="group-hover:scale-110 transition-transform duration-200">
                {chip.icon}
              </span>
              <span>{promptText}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestionChips;
