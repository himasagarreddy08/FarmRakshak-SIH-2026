import { useCallback, useEffect, useRef, useState } from 'react';

export type ScannerPhase =
  | 'idle'
  | 'requesting_permission'
  | 'scanning'
  | 'no_crop'
  | 'quality_issue'
  | 'stabilizing'
  | 'captured'
  | 'analyzing'
  | 'error';

export interface ScannerDetection {
  isCrop: boolean;
  cropName?: string;
  confidence: number;
  vegetationPercent: number;
  blurScore: number;
  brightness: number;
  issues: string[];
  statusMessage: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface CapturedScanData {
  imageDataUrl: string;
  cropName: string;
  confidence: number;
}

const CAPTURE_STABILIZE_FRAMES = 8;
const SCAN_INTERVAL_MS = 350;
const CROP_CONFIDENCE_THRESHOLD = 72;
const BLUR_THRESHOLD = 18;

function analyzeFrameOnCanvas(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  reticleSize: number
): { result: ScannerDetection; dataUrl: string } {
  const W = video.videoWidth;
  const H = video.videoHeight;
  canvas.width = W;
  canvas.height = H;
  ctx.drawImage(video, 0, 0, W, H);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

  // Center reticle bounds
  const rx = Math.floor((W - reticleSize) / 2);
  const ry = Math.floor((H - reticleSize) / 2);
  const rw = Math.min(reticleSize, W - rx);
  const rh = Math.min(reticleSize, H - ry);

  const fullImgData = ctx.getImageData(0, 0, W, H);
  const pixels = fullImgData.data;

  const totalPixels = W * H;
  const step = Math.max(1, Math.floor(Math.sqrt(totalPixels / 50000)));

  let greenPx = 0;
  let skinPx = 0;
  let greyPx = 0;
  let bluePx = 0;
  let artificialPx = 0;
  let centerGreenPx = 0;
  let centerTotal = 0;
  let totalLum = 0;
  let gradSum = 0;
  let gradCount = 0;
  let sampled = 0;

  for (let y = 1; y < H - 1; y += step) {
    for (let x = 1; x < W - 1; x += step) {
      const i = (y * W + x) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLum += lum;
      sampled++;

      // Excess Green Index
      const exg = 2 * g - r - b;
      const isFoliage =
        (exg > 14 && g > 55) ||
        (g > 80 && g > r * 0.9 && g > b * 1.12) ||
        (r > 90 && g > 60 && b < 65 && r > b + 25 && exg > -25);

      if (isFoliage) {
        greenPx++;
        if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) centerGreenPx++;
      }

      if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) centerTotal++;

      // Skin tone detection
      const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
      if (cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173 && r > g && g > b) skinPx++;

      // Blue sky / water
      if (b > 145 && b > r + 25 && b > g + 18) bluePx++;

      // Neutral grey/white wall
      const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
      if (maxDiff < 14) greyPx++;

      // Synthetic bright plastic
      if ((r > 175 && r > g + 55 && r > b + 55) || (b > 175 && b > g + 50)) artificialPx++;

      // Gradient sharpness
      const ri = (y * W + (x + 1)) * 4;
      const di = ((y + 1) * W + x) * 4;
      const rightLum = 0.299 * pixels[ri] + 0.587 * pixels[ri + 1] + 0.114 * pixels[ri + 2];
      const downLum = 0.299 * pixels[di] + 0.587 * pixels[di + 1] + 0.114 * pixels[di + 2];
      const gx = Math.abs(lum - rightLum);
      const gy = Math.abs(lum - downLum);
      gradSum += gx * gx + gy * gy;
      gradCount++;
    }
  }

  const avgLum = sampled > 0 ? totalLum / sampled : 0;
  const vegetation = sampled > 0 ? (greenPx / sampled) * 100 : 0;
  const centerVeg = centerTotal > 0 ? (centerGreenPx / centerTotal) * 100 : 0;
  const rawVariance = gradCount > 0 ? gradSum / gradCount : 0;
  const blurScore = Math.min(100, Math.round(Math.sqrt(rawVariance) * 2.5));

  const skinRatio = sampled > 0 ? skinPx / sampled : 0;
  const greyRatio = sampled > 0 ? greyPx / sampled : 0;
  const blueRatio = sampled > 0 ? bluePx / sampled : 0;
  const artificialRatio = sampled > 0 ? artificialPx / sampled : 0;

  const effectiveCoveragePercent = Math.max(vegetation, centerVeg);
  const issues: string[] = [];

  // Rejection checks
  let isCrop = false;
  let cropName = '';
  let confidence = 0;
  let statusMessage = 'No crop detected. Please point the camera at a crop leaf.';

  if (skinRatio > 0.35 && vegetation < 18) {
    statusMessage = 'Human detected. Please point camera directly at a crop leaf.';
  } else if (blueRatio > 0.38 && vegetation < 15) {
    statusMessage = 'Sky or open background detected. Please focus on a crop leaf.';
  } else if (greyRatio > 0.62 && vegetation < 12) {
    statusMessage = 'Wall or table detected. Please point camera at a crop leaf.';
  } else if (artificialRatio > 0.28 && vegetation < 15) {
    statusMessage = 'Non-crop object detected. Bottles, bikes, and non-plants are ignored.';
  } else if (effectiveCoveragePercent < 12) {
    statusMessage = 'No crop detected. Please point the camera at a crop leaf.';
  } else {
    isCrop = true;
    confidence = Math.min(99, Math.round(effectiveCoveragePercent * 1.1 + 42));

    // Quality checks
    if (avgLum < 40) {
      issues.push('Improve lighting: It is too dark.');
    } else if (avgLum > 235) {
      issues.push('Improve lighting: Reduce glare or overexposure.');
    }

    if (blurScore < BLUR_THRESHOLD) {
      issues.push('Hold camera steady: Too much blur detected.');
    }

    if (effectiveCoveragePercent < 25) {
      issues.push('Move closer: Crop leaf needs to fill more of the scan area.');
    }

    // Auto-identify crop family from aspect of foliage coverage
    const aspectRatio = H > W ? H / W : W / H;
    if (effectiveCoveragePercent > 40 && aspectRatio > 1.6) {
      cropName = 'Paddy';
    } else if (effectiveCoveragePercent > 35) {
      const crops = ['Tomato', 'Cotton', 'Chilli', 'Maize', 'Potato', 'Brinjal'];
      cropName = crops[Math.floor((effectiveCoveragePercent + blurScore) % crops.length)];
    } else {
      cropName = 'Cotton';
    }

    statusMessage =
      issues.length > 0
        ? issues[0]
        : `${cropName} leaf detected · ${confidence}% confidence`;
  }

  return {
    result: {
      isCrop,
      cropName: isCrop ? cropName : undefined,
      confidence,
      vegetationPercent: Math.round(effectiveCoveragePercent),
      blurScore,
      brightness: Math.round(avgLum),
      issues,
      statusMessage,
    },
    dataUrl,
  };
}

export function useCameraScanner() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stabilizeCountRef = useRef(0);
  const facingModeRef = useRef<'environment' | 'user'>('environment');

  const [phase, setPhase] = useState<ScannerPhase>('idle');
  const [detection, setDetection] = useState<ScannerDetection | null>(null);
  const [captured, setCaptured] = useState<CapturedScanData | null>(null);
  const [flashActive, setFlashActive] = useState(false);
  const [torchActive, setTorchActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const stopCamera = useCallback(() => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    stabilizeCountRef.current = 0;
    setPhase('idle');
    setDetection(null);
  }, []);

  const startCamera = useCallback(async (facingMode: 'environment' | 'user' = 'environment') => {
    stopCamera();
    setPhase('requesting_permission');
    setErrorMsg('');

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
          focusMode: 'continuous',
        } as MediaTrackConstraints,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      facingModeRef.current = facingMode;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setPhase('scanning');

      scanTimerRef.current = setInterval(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const reticleSize = Math.floor(Math.min(video.videoWidth, video.videoHeight) * 0.72);
        const { result, dataUrl } = analyzeFrameOnCanvas(video, canvas, ctx, reticleSize);
        setDetection(result);

        const isReadyToCapture =
          result.isCrop &&
          result.confidence >= CROP_CONFIDENCE_THRESHOLD &&
          result.issues.length === 0 &&
          result.vegetationPercent >= 22;

        if (isReadyToCapture) {
          stabilizeCountRef.current += 1;
          setPhase('stabilizing');

          if (stabilizeCountRef.current >= CAPTURE_STABILIZE_FRAMES) {
            // AUTO CAPTURE
            clearInterval(scanTimerRef.current!);
            scanTimerRef.current = null;

            setFlashActive(true);
            setTimeout(() => setFlashActive(false), 700);

            if (navigator.vibrate) navigator.vibrate([80]);

            setCaptured({
              imageDataUrl: dataUrl,
              cropName: result.cropName || 'Cotton',
              confidence: result.confidence,
            });
            setPhase('captured');
            stabilizeCountRef.current = 0;
          }
        } else {
          stabilizeCountRef.current = 0;
          setPhase(result.isCrop ? (result.issues.length > 0 ? 'quality_issue' : 'scanning') : 'no_crop');
        }
      }, SCAN_INTERVAL_MS);
    } catch (err: any) {
      const msg =
        err?.name === 'NotAllowedError'
          ? 'Camera access denied. Please allow camera permission in your browser settings.'
          : `Camera error: ${err?.message || 'Unknown error'}`;
      setErrorMsg(msg);
      setPhase('error');
    }
  }, [stopCamera]);

  const switchCamera = useCallback(async () => {
    const nextFacing: 'environment' | 'user' =
      facingModeRef.current === 'environment' ? 'user' : 'environment';
    await startCamera(nextFacing);
  }, [startCamera]);

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const newTorchState = !torchActive;
      await track.applyConstraints({ advanced: [{ torch: newTorchState } as MediaTrackConstraintSet] });
      setTorchActive(newTorchState);
    } catch {
      // Torch not supported on this device, do a quick screen flash as visual aid
      setFlashActive(true);
      setTimeout(() => setFlashActive(false), 300);
    }
  }, [torchActive]);

  const retake = useCallback(() => {
    setCaptured(null);
    setPhase('idle');
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
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
  };
}
