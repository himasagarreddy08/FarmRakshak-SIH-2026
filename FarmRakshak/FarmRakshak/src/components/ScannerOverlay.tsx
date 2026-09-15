import React from 'react';
import { ScannerDetection, ScannerPhase } from '../hooks/useCameraScanner';

interface ScannerOverlayProps {
  phase: ScannerPhase;
  detection: ScannerDetection | null;
  stabilizeProgress: number;
  flashActive: boolean;
}

export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({
  phase,
  detection,
  stabilizeProgress,
  flashActive,
}) => {
  const isGoodCrop = detection?.isCrop && (detection.issues?.length ?? 0) === 0;
  const cornerColor = isGoodCrop ? '#22c55e' : '#94a3b8';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Flash overlay */}
      {flashActive && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,0.92)',
            zIndex: 50,
            animation: 'scanFlash 0.7s ease-out forwards',
          }}
        />
      )}

      {/* Dark vignette mask around the scanning reticle */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 68% 68% at 50% 50%, transparent 58%, rgba(0,0,0,0.62) 100%)',
        }}
      />

      {/* Scanner Reticle */}
      <div
        style={{
          position: 'relative',
          width: 'min(72vw, 72vh, 320px)',
          height: 'min(72vw, 72vh, 320px)',
          maxWidth: '340px',
          maxHeight: '340px',
        }}
      >
        {/* Corner brackets */}
        {[
          { top: 0, left: 0, borderTop: '4px solid', borderLeft: '4px solid', borderRadius: '12px 0 0 0' },
          { top: 0, right: 0, borderTop: '4px solid', borderRight: '4px solid', borderRadius: '0 12px 0 0' },
          { bottom: 0, left: 0, borderBottom: '4px solid', borderLeft: '4px solid', borderRadius: '0 0 0 12px' },
          { bottom: 0, right: 0, borderBottom: '4px solid', borderRight: '4px solid', borderRadius: '0 0 12px 0' },
        ].map((style, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 32,
              height: 32,
              borderColor: cornerColor,
              transition: 'border-color 0.3s ease',
              ...style,
            }}
          />
        ))}

        {/* Laser scan line */}
        <div
          style={{
            position: 'absolute',
            left: 8,
            right: 8,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${cornerColor}, ${cornerColor}aa, transparent)`,
            boxShadow: `0 0 12px 2px ${cornerColor}80`,
            animation: 'laserScan 1.8s ease-in-out infinite',
            borderRadius: 2,
          }}
        />

        {/* Detection bounding box */}
        {detection?.boundingBox && detection.isCrop && (
          <div
            style={{
              position: 'absolute',
              left: `${(detection.boundingBox.x / (detection.boundingBox.width + detection.boundingBox.x)) * 100}%`,
              top: `${(detection.boundingBox.y / (detection.boundingBox.height + detection.boundingBox.y)) * 100}%`,
              width: `${(detection.boundingBox.width / (detection.boundingBox.width + detection.boundingBox.x)) * 100}%`,
              height: `${(detection.boundingBox.height / (detection.boundingBox.height + detection.boundingBox.y)) * 100}%`,
              border: '2px solid #86efac',
              borderRadius: 6,
              transition: 'all 0.2s ease',
            }}
          />
        )}

        {/* Crop name badge at top of reticle */}
        {detection?.isCrop && detection.cropName && (
          <div
            style={{
              position: 'absolute',
              top: -34,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(22,163,74,0.92)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              padding: '3px 14px',
              borderRadius: 20,
              letterSpacing: 0.5,
              whiteSpace: 'nowrap',
            }}
          >
            🌿 {detection.cropName} Leaf
          </div>
        )}

        {/* Stabilize progress ring */}
        {phase === 'stabilizing' && stabilizeProgress > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: -6,
              borderRadius: '50%',
              border: '3px solid transparent',
              borderTopColor: '#22c55e',
              borderRightColor: stabilizeProgress > 50 ? '#22c55e' : 'transparent',
              borderBottomColor: stabilizeProgress > 75 ? '#22c55e' : 'transparent',
              animation: 'spin 1s linear infinite',
            }}
          />
        )}
      </div>

      {/* Confidence indicator */}
      {detection?.isCrop && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            borderRadius: 10,
            padding: '6px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: 56,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, color: '#22c55e', lineHeight: 1 }}>
            {detection.confidence}%
          </div>
          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>
            CONFIDENCE
          </div>
        </div>
      )}

      {/* Status pill at the bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background:
            phase === 'no_crop' || phase === 'quality_issue'
              ? 'rgba(239,68,68,0.85)'
              : phase === 'stabilizing'
              ? 'rgba(16,185,129,0.9)'
              : 'rgba(0,0,0,0.70)',
          color: '#fff',
          padding: '8px 20px',
          borderRadius: 24,
          fontSize: 13,
          fontWeight: 600,
          maxWidth: 320,
          textAlign: 'center',
          backdropFilter: 'blur(8px)',
          whiteSpace: 'pre-line',
          transition: 'background 0.3s',
          lineHeight: 1.4,
          letterSpacing: 0.2,
        }}
      >
        {phase === 'stabilizing'
          ? '🎯 Crop detected — Auto capturing...'
          : detection?.statusMessage || 'Point camera at a crop leaf'}
      </div>

      <style>{`
        @keyframes laserScan {
          0% { top: 8px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: calc(100% - 10px); opacity: 0; }
        }
        @keyframes scanFlash {
          0% { opacity: 0.95; }
          100% { opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ScannerOverlay;
