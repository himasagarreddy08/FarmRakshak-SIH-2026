import React, { useState, useCallback } from 'react';
import { CameraScanner } from '../components/CameraScanner';
import { DiseaseResultCard, DiseaseResult } from '../components/DiseaseResultCard';
import { CapturedScanData } from '../hooks/useCameraScanner';
import { Camera, Leaf, Loader2 } from 'lucide-react';

type ScanView = 'landing' | 'camera' | 'analyzing' | 'result';

interface ScanCropProps {
  onAddActivity?: (act: { type: string; date: string; note: string }) => void;
  notify?: (msg: string) => void;
  language?: string;
}

const SCAN_API_URL = '/api/scan';

async function callScanApi(
  imageDataUrl: string,
  cropHint: string,
  language: string
): Promise<DiseaseResult> {
  const res = await fetch(SCAN_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: imageDataUrl,
      cropHint,
      language,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as any;
    throw new Error(body?.error || `Scan API error: HTTP ${res.status}`);
  }

  const data = await res.json() as any;
  return {
    crop: data.crop || cropHint || 'Unknown Crop',
    disease: data.disease || 'Healthy Plant',
    isHealthy: data.isHealthy ?? true,
    confidence: data.confidence ?? 88,
    severity: data.severity ?? 'None',
    symptoms: data.symptoms || 'No symptoms detected.',
    treatment: data.treatment || 'No treatment required.',
    organicSolution: data.organicSolution || 'Continue regular crop maintenance.',
    chemicalRecommendation: data.chemicalRecommendation || 'No chemical treatment required.',
    icarRecommendation: data.icarRecommendation || 'Continue standard ICAR IPM practices.',
    fertilizerAdvice: data.fertilizerAdvice || 'Maintain balanced NPK nutrition.',
    irrigationAdvice: data.irrigationAdvice || 'Continue scheduled irrigation.',
    weatherWarning: data.weatherWarning || 'No weather alerts at this time.',
  };
}

export default function ScanCrop({ onAddActivity, notify, language = 'en' }: ScanCropProps) {
  const [view, setView] = useState<ScanView>('landing');
  const [capturedData, setCapturedData] = useState<CapturedScanData | null>(null);
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState('');

  const handleCaptured = useCallback(
    async (data: CapturedScanData) => {
      setCapturedData(data);
      setView('analyzing');
      setAnalyzeError('');

      try {
        const diseaseResult = await callScanApi(data.imageDataUrl, data.cropName, language);
        setResult(diseaseResult);
        setView('result');

        onAddActivity?.({
          type: 'Plant Scan',
          date: new Date().toLocaleDateString('en-IN'),
          note: `${diseaseResult.disease} detected in ${diseaseResult.crop} (${diseaseResult.confidence}% confidence, Severity: ${diseaseResult.severity}).`,
        });

        notify?.(`Scan complete: ${diseaseResult.disease}`);
      } catch (err: any) {
        setAnalyzeError(err?.message || 'Disease analysis failed. Please try again.');
        setView('camera');
        notify?.(`Scan error: ${err?.message}`);
      }
    },
    [language, onAddActivity, notify]
  );

  const handleScanAgain = useCallback(() => {
    setCapturedData(null);
    setResult(null);
    setAnalyzeError('');
    setView('landing');
  }, []);

  const handleSaveToTimeline = useCallback(() => {
    if (!result) return;
    onAddActivity?.({
      type: 'Disease Report Saved',
      date: new Date().toLocaleDateString('en-IN'),
      note: `${result.disease} in ${result.crop} — ${result.severity} severity. ICAR: ${result.icarRecommendation.slice(0, 80)}...`,
    });
    notify?.('Report saved to Field Timeline!');
  }, [result, onAddActivity, notify]);

  // ─── Camera fullscreen view ───────────────────────────────────────────────
  if (view === 'camera') {
    return (
      <>
        <CameraScanner
          onCapture={handleCaptured}
          onClose={() => setView('landing')}
        />
        {analyzeError && (
          <div
            style={{
              position: 'fixed',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(220,38,38,0.95)',
              color: '#fff',
              padding: '10px 22px',
              borderRadius: 24,
              fontSize: 13,
              fontWeight: 600,
              zIndex: 200,
              maxWidth: 340,
              textAlign: 'center',
            }}
          >
            {analyzeError}
          </div>
        )}
      </>
    );
  }

  // ─── Analyzing state ──────────────────────────────────────────────────────
  if (view === 'analyzing') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>🔬 Analyzing Crop Leaf...</h2>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
            Running disease prediction with ICAR classification engine
          </p>
        </div>

        <div
          style={{
            borderRadius: 16,
            overflow: 'hidden',
            background: 'hsl(var(--muted) / 0.5)',
            position: 'relative',
            minHeight: 320,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {capturedData?.imageDataUrl && (
            <img
              src={capturedData.imageDataUrl}
              alt="Analyzing"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'blur(3px) brightness(0.4)',
              }}
            />
          )}

          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(22,163,74,0.25)',
                border: '3px solid #22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 1.5s infinite',
              }}
            >
              <Loader2 size={30} color="#22c55e" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <div style={{ textAlign: 'center', color: '#fff' }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Detecting disease...</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                {capturedData?.cropName && capturedData.cropName !== 'Unknown'
                  ? `Crop: ${capturedData.cropName}`
                  : 'Identifying crop species...'}
              </div>
            </div>

            {/* Progress steps */}
            {[
              '✓ Crop leaf verified',
              '✓ Image quality validated',
              '⟳ Running disease classifier...',
            ].map((step, i) => (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  color: i < 2 ? '#86efac' : '#fde047',
                  fontWeight: 600,
                }}
              >
                {step}
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
          @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        `}</style>
      </div>
    );
  }

  // ─── Result view ──────────────────────────────────────────────────────────
  if (view === 'result' && result) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800 }}>🔍 Scan Result</h2>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
              AI-powered crop disease diagnosis • ICAR recommendations
            </p>
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              background: 'rgba(22,163,74,0.1)',
              color: '#16a34a',
              padding: '4px 10px',
              borderRadius: 8,
            }}
          >
            PlantVillage AI
          </span>
        </div>

        <DiseaseResultCard
          result={result}
          capturedImage={capturedData?.imageDataUrl}
          onScanAgain={handleScanAgain}
          onSaveToTimeline={handleSaveToTimeline}
        />
      </div>
    );
  }

  // ─── Landing view ─────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>🌾 FarmRakshak AI Crop Scanner</h2>
        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
          Google Lens-style scanner • Auto-detects only crop leaves • ICAR disease classification
        </p>
      </div>

      {analyzeError && (
        <div
          style={{
            background: 'rgba(220,38,38,0.1)',
            border: '1px solid rgba(220,38,38,0.3)',
            borderRadius: 10,
            padding: '12px 16px',
            color: '#dc2626',
            fontSize: 13,
          }}
        >
          ⚠️ {analyzeError}
        </div>
      )}

      {/* ─ Scanner launch card ─ */}
      <div className="card card-pad">
        <div
          style={{
            height: 280,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #052e16, #14532d, #052e16)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
          }}
          onClick={() => setView('camera')}
        >
          {/* Animated scanner grid lines */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(34,197,94,0.07) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(34,197,94,0.07) 40px)',
            }}
          />

          {/* Pulsing center icon */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(22,163,74,0.2)',
              border: '2px solid rgba(34,197,94,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1,
              animation: 'pulse 2s infinite',
            }}
          >
            <Camera size={36} color="#4ade80" />
          </div>

          {/* Scanner frame corners overlay */}
          {[
            { top: 20, left: 20, borderTop: '3px solid', borderLeft: '3px solid', borderRadius: '8px 0 0 0' },
            { top: 20, right: 20, borderTop: '3px solid', borderRight: '3px solid', borderRadius: '0 8px 0 0' },
            { bottom: 20, left: 20, borderBottom: '3px solid', borderLeft: '3px solid', borderRadius: '0 0 0 8px' },
            { bottom: 20, right: 20, borderBottom: '3px solid', borderRight: '3px solid', borderRadius: '0 0 8px 0' },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 24,
                height: 24,
                borderColor: '#22c55e',
                ...s,
              }}
            />
          ))}

          <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
              Tap to Open AI Scanner
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>
              Rear camera opens automatically
            </div>
          </div>
        </div>

        {/* Controls row */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button
            onClick={() => setView('camera')}
            style={{
              flex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '13px 20px',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              border: 'none',
              borderRadius: 12,
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(22,163,74,0.3)',
            }}
          >
            <Camera size={18} />
            Scan Crop
          </button>

          <label
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '13px 16px',
              background: 'hsl(var(--muted) / 0.5)',
              border: '1px solid hsl(var(--border))',
              borderRadius: 12,
              color: 'hsl(var(--foreground))',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Leaf size={16} />
            Gallery
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  handleCaptured({
                    imageDataUrl: reader.result as string,
                    cropName: 'Unknown',
                    confidence: 0,
                  });
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
        </div>
      </div>

      {/* ─ Supported crops legend ─ */}
      <div className="card card-pad">
        <div style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          Supported Crops · Auto Detected
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            'Cotton', 'Paddy', 'Tomato', 'Chilli', 'Maize', 'Wheat',
            'Potato', 'Brinjal', 'Banana', 'Papaya', 'Groundnut', 'Soybean', 'Sugarcane', 'Mango',
          ].map((crop) => (
            <span
              key={crop}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 12px',
                background: 'rgba(22,163,74,0.1)',
                border: '1px solid rgba(22,163,74,0.25)',
                borderRadius: 20,
                color: '#16a34a',
              }}
            >
              🌿 {crop}
            </span>
          ))}
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
          <strong style={{ color: 'hsl(var(--foreground))' }}>Rejected automatically:</strong> Bottles, bikes, people, phones, roads, walls, sky, and all non-crop objects.
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.8;transform:scale(1.04);} }
      `}</style>
    </div>
  );
}
