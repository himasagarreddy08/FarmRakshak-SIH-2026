import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  SwitchCamera,
  Flashlight,
  ZoomIn,
  Image,
} from 'lucide-react';
import { ScannerOverlay } from './ScannerOverlay';
import { useCameraScanner, CapturedScanData } from '../hooks/useCameraScanner';

interface CameraScannerProps {
  onCapture: (data: CapturedScanData) => void;
  onClose: () => void;
}

const STABILIZE_FRAMES = 8;

export const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, onClose }) => {
  const {
    videoRef,
    canvasRef,
    phase,
    detection,
    captured,
    flashActive,
    torchActive,
    errorMsg,
    startCamera,
    stopCamera,
    switchCamera,
    toggleTorch,
    retake,
  } = useCameraScanner();

  const [stabilizeCount, setStabilizeCount] = useState(0);
  const stableRef = useRef(0);
  const captureSubmittedRef = useRef(false);

  // Track stabilization progress
  useEffect(() => {
    if (phase === 'stabilizing') {
      stableRef.current = Math.min(stableRef.current + 1, STABILIZE_FRAMES);
      setStabilizeCount(stableRef.current);
    } else {
      stableRef.current = 0;
      setStabilizeCount(0);
    }
  }, [phase, detection]);

  // Once captured, emit to parent immediately
  useEffect(() => {
    if (captured && !captureSubmittedRef.current) {
      captureSubmittedRef.current = true;
      // Freeze for 1 second then hand off
      setTimeout(() => {
        onCapture(captured);
      }, 1000);
    }
  }, [captured, onCapture]);

  // Gallery file picker handler
  const handleGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onCapture({
        imageDataUrl: reader.result as string,
        cropName: 'Unknown',
        confidence: 0,
      });
    };
    reader.readAsDataURL(file);
    stopCamera();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ─── Top Bar ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => { stopCamera(); onClose(); }}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
          }}
          title="Close Camera"
        >
          <X size={20} />
        </button>

        <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: 0.5 }}>
          🌾 FarmRakshak AI Scanner
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={toggleTorch}
            style={{
              background: torchActive ? 'rgba(253,224,71,0.3)' : 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: torchActive ? '#fde047' : '#fff',
            }}
            title="Toggle Flash"
          >
            <Flashlight size={18} />
          </button>

          <button
            onClick={switchCamera}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
            }}
            title="Switch Camera"
          >
            <SwitchCamera size={18} />
          </button>
        </div>
      </div>

      {/* ─── Camera Preview / Captured Image ─────────────────────── */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        {phase === 'idle' && !captured && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
              color: '#94a3b8',
            }}
          >
            <Camera size={64} strokeWidth={1} />
            <p style={{ fontSize: 15, textAlign: 'center', maxWidth: 260, lineHeight: 1.5 }}>
              Point your camera at a crop leaf and let FarmRakshak auto-detect plant diseases
            </p>
            <button
              onClick={() => startCamera('environment')}
              style={{
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                color: '#fff',
                border: 'none',
                borderRadius: 32,
                padding: '14px 36px',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 4px 20px rgba(22,163,74,0.4)',
              }}
            >
              <Camera size={20} />
              Scan Crop
            </button>
          </div>
        )}

        {phase === 'requesting_permission' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              gap: 16,
            }}
          >
            <div style={{ fontSize: 40 }}>📷</div>
            <p>Requesting camera access...</p>
          </div>
        )}

        {phase === 'error' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fca5a5',
              gap: 16,
              padding: 32,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 40 }}>⚠️</div>
            <p style={{ lineHeight: 1.6 }}>{errorMsg}</p>
            <button
              onClick={() => startCamera('environment')}
              style={{
                background: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: 24,
                padding: '10px 28px',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Live Video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: phase !== 'idle' && phase !== 'error' && phase !== 'requesting_permission' ? 'block' : 'none',
          }}
        />

        {/* Captured freeze frame */}
        {captured && (
          <img
            src={captured.imageDataUrl}
            alt="Captured"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}

        {/* Overlay */}
        {!captured &&
          phase !== 'idle' &&
          phase !== 'error' &&
          phase !== 'requesting_permission' && (
            <ScannerOverlay
              phase={phase}
              detection={detection}
              stabilizeProgress={(stabilizeCount / STABILIZE_FRAMES) * 100}
              flashActive={flashActive}
            />
          )}

        {/* Flash on captured */}
        {flashActive && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255,255,255,0.9)',
              zIndex: 50,
              pointerEvents: 'none',
              animation: 'scanFlash 0.7s ease-out forwards',
            }}
          />
        )}
      </div>

      {/* Hidden canvas for frame processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* ─── Bottom Controls ──────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '16px 24px 28px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        {/* Gallery button */}
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            color: '#94a3b8',
            fontSize: 11,
            fontWeight: 600,
          }}
          title="Choose from Gallery"
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.12)',
              borderRadius: '50%',
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image size={20} color="#fff" />
          </div>
          Gallery
          <input type="file" accept="image/*" hidden onChange={handleGallery} />
        </label>

        {/* Central scan button */}
        {!captured ? (
          <button
            onClick={() =>
              phase === 'idle' || phase === 'error'
                ? startCamera('environment')
                : stopCamera()
            }
            style={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              background:
                phase === 'idle' || phase === 'error'
                  ? 'linear-gradient(135deg, #16a34a, #15803d)'
                  : 'rgba(255,255,255,0.15)',
              border: '4px solid rgba(255,255,255,0.35)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow:
                phase === 'idle' || phase === 'error'
                  ? '0 4px 24px rgba(22,163,74,0.5)'
                  : 'none',
              transition: 'all 0.2s',
            }}
            title={phase === 'idle' || phase === 'error' ? 'Scan Crop' : 'Stop Scanning'}
          >
            {phase === 'idle' || phase === 'error' ? (
              <Camera size={28} color="#fff" />
            ) : (
              <X size={28} color="#fff" />
            )}
          </button>
        ) : (
          <button
            onClick={retake}
            style={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              border: '4px solid rgba(255,255,255,0.35)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              color: '#fff',
              fontSize: 9,
              fontWeight: 700,
            }}
            title="Retake"
          >
            <ZoomIn size={22} />
            RETAKE
          </button>
        )}

        {/* Zoom/close button */}
        <button
          onClick={() => { stopCamera(); onClose(); }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            color: '#94a3b8',
            fontSize: 11,
            fontWeight: 600,
            background: 'none',
            border: 'none',
          }}
          title="Close Camera"
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.12)',
              borderRadius: '50%',
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} color="#fff" />
          </div>
          Close
        </button>
      </div>

      <style>{`
        @keyframes scanFlash {
          0% { opacity: 0.9; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default CameraScanner;
