import React from 'react';
import { useLocation } from 'wouter';
import { Sparkles, Bot } from 'lucide-react';

export const FloatingAskRakshak: React.FC = () => {
  const [location, setLocation] = useLocation();

  // Hide button if already on the /assistant page
  if (location === '/assistant') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center">
      <button
        type="button"
        onClick={() => setLocation('/assistant')}
        title="Chat with Rakshak AI Assistant"
        className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold text-sm shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/50 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border border-white/20"
      >
        <span className="relative flex items-center justify-center">
          <Bot size={20} className="group-hover:rotate-12 transition-transform duration-300" />
          <Sparkles size={10} className="absolute -top-1 -right-1 text-amber-300 animate-bounce" />
        </span>
        <span className="tracking-wide">Ask Rakshak</span>
        <span className="absolute -top-1 -left-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
      </button>
    </div>
  );
};

export default FloatingAskRakshak;
