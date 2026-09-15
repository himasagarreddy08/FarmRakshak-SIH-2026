import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';

export interface ImageQualityReport {
  isQualityAcceptable: boolean;
  blurScore: number;
  isBlurry: boolean;
  brightness: number;
  isLightingGood: boolean;
  vegetationPercent: number;
  coveragePercent: number;
  width: number;
  height: number;
  issues: string[];
}

export interface DecodedImage {
  width: number;
  height: number;
  data: Uint8Array | Buffer;
}

export class ImageQualityService {
  /**
   * Decode base64 data URL or raw buffer into raw RGBA pixel data
   */
  public static decodeImage(imageInput: string | Buffer): DecodedImage | null {
    try {
      let buffer: Buffer;

      if (typeof imageInput === 'string') {
        const matches = imageInput.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const base64Data = matches ? matches[2] : imageInput;
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        buffer = imageInput;
      }

      // Check header bytes for PNG vs JPEG
      if (buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
        const png = PNG.sync.read(buffer);
        return {
          width: png.width,
          height: png.height,
          data: png.data,
        };
      }

      // Default to JPEG decoder
      const decodedJpeg = jpeg.decode(buffer, { useTArray: true, formatAsRGBA: true });
      return {
        width: decodedJpeg.width,
        height: decodedJpeg.height,
        data: decodedJpeg.data,
      };
    } catch (err: any) {
      console.warn('[ImageQualityService] Error decoding image buffer:', err?.message || err);
      return null;
    }
  }

  /**
   * Evaluate image quality across focus/sharpness, illumination, vegetation presence, and coverage
   */
  public static evaluate(imageInput: string | Buffer): ImageQualityReport {
    const decoded = this.decodeImage(imageInput);
    if (!decoded) {
      return {
        isQualityAcceptable: false,
        blurScore: 0,
        isBlurry: true,
        brightness: 0,
        isLightingGood: false,
        vegetationPercent: 0,
        coveragePercent: 0,
        width: 0,
        height: 0,
        issues: ['Corrupted or unreadable image file format.'],
      };
    }

    const { width, height, data } = decoded;
    const totalPixels = width * height;
    const issues: string[] = [];

    let totalLuminance = 0;
    let greenVegetationPixels = 0;

    // Subsample step for speed on large images
    const step = Math.max(1, Math.floor(Math.sqrt(totalPixels / 60000)));
    let sampledPixels = 0;

    // Center zone bounds (where leaf must be focused)
    const minX = Math.floor(width * 0.15);
    const maxX = Math.floor(width * 0.85);
    const minY = Math.floor(height * 0.15);
    const maxY = Math.floor(height * 0.85);

    let centerSampledPixels = 0;
    let centerGreenPixels = 0;

    // Blur calculation: High-frequency horizontal gradient power (Laplacian proxy)
    let gradientSum = 0;
    let gradientCount = 0;

    for (let y = 1; y < height - 1; y += step) {
      for (let x = 1; x < width - 1; x += step) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Perceived luminance (ITU-R BT.601)
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLuminance += lum;
        sampledPixels++;

        // Excess Green Index (ExG): 2*G - R - B
        // Foliage chlorophyll & chlorosis spectrum
        const exg = 2 * g - r - b;
        const isFoliage = (exg > 15 && g > 65) || (g > 85 && g > r * 0.9 && g > b * 1.15);
        if (isFoliage) {
          greenVegetationPixels++;
        }

        // Center reticle evaluation
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          centerSampledPixels++;
          if (isFoliage) {
            centerGreenPixels++;
          }
        }

        // Gradient sharpness calculation
        const rightIdx = (y * width + (x + 1)) * 4;
        const downIdx = ((y + 1) * width + x) * 4;
        const rightLum = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];
        const downLum = 0.299 * data[downIdx] + 0.587 * data[downIdx + 1] + 0.114 * data[downIdx + 2];

        const gradX = Math.abs(lum - rightLum);
        const gradY = Math.abs(lum - downLum);
        gradientSum += gradX * gradX + gradY * gradY;
        gradientCount++;
      }
    }

    const avgLuminance = sampledPixels > 0 ? totalLuminance / sampledPixels : 0;
    const vegetationPercent = sampledPixels > 0 ? Math.round((greenVegetationPixels / sampledPixels) * 100) : 0;
    const centerVegetationPercent = centerSampledPixels > 0 ? Math.round((centerGreenPixels / centerSampledPixels) * 100) : 0;

    // Variance / gradient metric (0-100 normalized)
    const rawVariance = gradientCount > 0 ? gradientSum / gradientCount : 0;
    const blurScore = Math.min(100, Math.round(Math.sqrt(rawVariance) * 2.5));

    // Quality evaluations
    const isLightingGood = avgLuminance >= 40 && avgLuminance <= 235;
    if (avgLuminance < 40) {
      issues.push('Improve lighting: Scene is too dark.');
    } else if (avgLuminance > 235) {
      issues.push('Improve lighting: Scene has extreme glare or overexposure.');
    }

    const isBlurry = blurScore < 20;
    if (isBlurry) {
      issues.push('Hold camera steady: High motion blur detected.');
    }

    const coveragePercent = Math.max(vegetationPercent, centerVegetationPercent);
    if (coveragePercent < 15) {
      issues.push('Move closer: Crop leaf occupies too small an area of the scan zone.');
    }

    const isQualityAcceptable = isLightingGood && !isBlurry && coveragePercent >= 15;

    return {
      isQualityAcceptable,
      blurScore,
      isBlurry,
      brightness: Math.round(avgLuminance),
      isLightingGood,
      vegetationPercent,
      coveragePercent,
      width,
      height,
      issues,
    };
  }
}

export default ImageQualityService;
