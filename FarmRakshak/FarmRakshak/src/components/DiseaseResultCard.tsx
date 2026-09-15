import React, { useState, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Languages,
  Download,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Droplets,
  FlaskConical,
  Leaf,
  ThermometerSun,
  Sprout,
} from 'lucide-react';

export interface DiseaseResult {
  crop: string;
  disease: string;
  isHealthy: boolean;
  confidence: number;
  severity: 'None' | 'Low' | 'Moderate' | 'High' | 'Severe';
  symptoms: string;
  treatment: string;
  organicSolution: string;
  chemicalRecommendation: string;
  icarRecommendation: string;
  fertilizerAdvice: string;
  irrigationAdvice: string;
  weatherWarning: string;
}

interface DiseaseResultCardProps {
  result: DiseaseResult;
  capturedImage?: string;
  onScanAgain: () => void;
  onSaveToTimeline?: () => void;
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  hi: 'हिन्दी',
  te: 'తెలుగు',
  mr: 'मराठी',
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  None: { color: '#16a34a', bg: 'rgba(22,163,74,0.12)', label: 'No Disease' },
  Low: { color: '#65a30d', bg: 'rgba(101,163,13,0.12)', label: 'Low Severity' },
  Moderate: { color: '#d97706', bg: 'rgba(217,119,6,0.12)', label: 'Moderate' },
  High: { color: '#ea580c', bg: 'rgba(234,88,12,0.12)', label: 'High Severity' },
  Severe: { color: '#dc2626', bg: 'rgba(220,38,38,0.12)', label: 'Severe' },
};

const SEVERITY_BARS: Record<string, number> = {
  None: 0,
  Low: 20,
  Moderate: 50,
  High: 75,
  Severe: 100,
};

function speakText(text: string, lang: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang === 'hi' ? 'hi-IN' : lang === 'te' ? 'te-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN';
  utter.rate = 0.9;
  utter.pitch = 1.05;
  window.speechSynthesis.speak(utter);
}

export const DiseaseResultCard: React.FC<DiseaseResultCardProps> = ({
  result,
  capturedImage,
  onScanAgain,
  onSaveToTimeline,
}) => {
  const [selectedLang, setSelectedLang] = useState('en');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const sev = SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.Moderate;
  const sevBar = SEVERITY_BARS[result.severity] ?? 50;

  const speakAdvice = () => {
    const text = `${result.disease} detected in ${result.crop}. ${result.treatment}. ${result.icarRecommendation}`;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      speakText(text, selectedLang);
      setIsSpeaking(true);
      const utter = window.speechSynthesis;
      const checkDone = setInterval(() => {
        if (!utter.speaking) {
          clearInterval(checkDone);
          setIsSpeaking(false);
        }
      }, 500);
    }
  };

  const handleSave = () => {
    onSaveToTimeline?.();
    setSavedMsg('✓ Saved to Field Timeline');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const InfoCard = ({
    icon,
    label,
    content,
    accent = '#16a34a',
  }: {
    icon: React.ReactNode;
    label: string;
    content: string;
    accent?: string;
  }) => (
    <div
      style={{
        background: 'hsl(var(--muted) / 0.4)',
        border: `1px solid ${accent}30`,
        borderRadius: 12,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: accent }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {label}
        </span>
      </div>
      <p style={{ fontSize: 13, color: 'hsl(var(--foreground))', lineHeight: 1.6, margin: 0 }}>
        {content}
      </p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ─── Header: Crop + Disease ──────────────────────────────── */}
      <div
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          background: result.isHealthy
            ? 'linear-gradient(135deg, #14532d, #166534)'
            : 'linear-gradient(135deg, #7f1d1d, #991b1b)',
          padding: '20px 20px 16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: result.isHealthy ? 'rgba(134,239,172,0.2)' : 'rgba(252,165,165,0.2)',
                borderRadius: 20,
                padding: '3px 12px',
                marginBottom: 8,
              }}
            >
              {result.isHealthy ? (
                <CheckCircle2 size={13} color="#86efac" />
              ) : (
                <AlertTriangle size={13} color="#fca5a5" />
              )}
              <span
                style={{ fontSize: 11, fontWeight: 700, color: result.isHealthy ? '#86efac' : '#fca5a5' }}
              >
                {result.isHealthy ? 'HEALTHY PLANT' : 'DISEASE DETECTED'}
              </span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 4px', lineHeight: 1.2 }}>
              {result.disease}
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
              🌾 {result.crop}
            </p>
          </div>

          {capturedImage && (
            <img
              src={capturedImage}
              alt="Scanned Leaf"
              style={{
                width: 72,
                height: 72,
                borderRadius: 10,
                objectFit: 'cover',
                border: '2px solid rgba(255,255,255,0.2)',
                flexShrink: 0,
              }}
            />
          )}
        </div>

        {/* Confidence + Severity row */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <div
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 10,
              padding: '10px 14px',
            }}
          >
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>CONFIDENCE</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
              {result.confidence}%
            </div>
          </div>

          <div
            style={{
              flex: 1,
              background: sev.bg,
              borderRadius: 10,
              padding: '10px 14px',
              border: `1px solid ${sev.color}40`,
            }}
          >
            <div style={{ fontSize: 11, color: sev.color, fontWeight: 600 }}>SEVERITY</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: sev.color }}>
              {sev.label}
            </div>
            {/* Severity bar */}
            <div
              style={{
                height: 4,
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 2,
                marginTop: 6,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${sevBar}%`,
                  background: sev.color,
                  borderRadius: 2,
                  transition: 'width 0.8s ease',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Action Buttons ──────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={speakAdvice}
          style={{
            flex: 1,
            minWidth: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 16px',
            background: isSpeaking ? 'rgba(99,102,241,0.15)' : 'hsl(var(--muted) / 0.5)',
            border: `1px solid ${isSpeaking ? '#818cf8' : 'hsl(var(--border))'}`,
            borderRadius: 10,
            color: isSpeaking ? '#818cf8' : 'hsl(var(--foreground))',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
          {isSpeaking ? 'Stop' : 'Speak Advice'}
        </button>

        <div style={{ flex: 1, minWidth: 130 }}>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'hsl(var(--muted) / 0.5)',
              border: '1px solid hsl(var(--border))',
              borderRadius: 10,
              color: 'hsl(var(--foreground))',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSave}
          style={{
            flex: 1,
            minWidth: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 16px',
            background: savedMsg ? 'rgba(22,163,74,0.15)' : 'hsl(var(--muted) / 0.5)',
            border: `1px solid ${savedMsg ? '#16a34a' : 'hsl(var(--border))'}`,
            borderRadius: 10,
            color: savedMsg ? '#16a34a' : 'hsl(var(--foreground))',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <Download size={15} />
          {savedMsg || 'Save Report'}
        </button>
      </div>

      {/* ─── Disease Details ─────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <InfoCard
          icon={<Leaf size={15} />}
          label="Symptoms"
          content={result.symptoms}
          accent="#16a34a"
        />

        <InfoCard
          icon={<Activity size={15} />}
          label="Treatment"
          content={result.treatment}
          accent="#2563eb"
        />

        <InfoCard
          icon={<Sprout size={15} />}
          label="Organic Solution"
          content={result.organicSolution}
          accent="#15803d"
        />

        <InfoCard
          icon={<FlaskConical size={15} />}
          label="Chemical Recommendation"
          content={result.chemicalRecommendation}
          accent="#7c3aed"
        />

        <InfoCard
          icon={<Leaf size={15} />}
          label="ICAR Recommendation"
          content={result.icarRecommendation}
          accent="#b45309"
        />

        <InfoCard
          icon={<Droplets size={15} />}
          label="Irrigation Advice"
          content={result.irrigationAdvice}
          accent="#0284c7"
        />

        <InfoCard
          icon={<ThermometerSun size={15} />}
          label="Weather Alert"
          content={result.weatherWarning}
          accent="#dc2626"
        />
      </div>

      {/* ─── Scan Again button ───────────────────────────────────── */}
      <button
        onClick={onScanAgain}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          padding: '14px 24px',
          background: 'linear-gradient(135deg, #16a34a, #15803d)',
          border: 'none',
          borderRadius: 12,
          color: '#fff',
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(22,163,74,0.35)',
        }}
      >
        <ArrowLeft size={18} />
        Scan Another Crop
      </button>
    </div>
  );
};

export default DiseaseResultCard;
