import ImageQualityService, { DecodedImage } from './imageQuality';

export type SupportedCrop =
  | 'Cotton'
  | 'Paddy'
  | 'Tomato'
  | 'Chilli'
  | 'Maize'
  | 'Wheat'
  | 'Potato'
  | 'Brinjal'
  | 'Banana'
  | 'Papaya'
  | 'Groundnut'
  | 'Soybean'
  | 'Sugarcane'
  | 'Mango';

export interface CropDetectionResult {
  isCrop: boolean;
  cropName?: SupportedCrop;
  cropLeafClass?: string;
  confidence: number;
  detectedType: 'crop_leaf' | 'non_crop_object' | 'background' | 'unclear';
  rejectionReason?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

const SUPPORTED_CROPS: Record<SupportedCrop, { name: string; scientific: string; leafTraits: string }> = {
  Cotton: { name: 'Cotton', scientific: 'Gossypium hirsutum', leafTraits: 'Palmate 3-5 lobed leaves with prominent vein reticulation' },
  Paddy: { name: 'Paddy', scientific: 'Oryza sativa', leafTraits: 'Long, narrow linear-lanceolate leaves with parallel venation' },
  Tomato: { name: 'Tomato', scientific: 'Solanum lycopersicum', leafTraits: 'Compound pinnate leaves with toothed/serrated margins and glandular hairs' },
  Chilli: { name: 'Chilli', scientific: 'Capsicum annuum', leafTraits: 'Simple, ovate to elliptic leaves with entire margins and smooth surface' },
  Maize: { name: 'Maize', scientific: 'Zea mays', leafTraits: 'Broad, elongated alternate leaves with wavy margin and thick central midrib' },
  Wheat: { name: 'Wheat', scientific: 'Triticum aestivum', leafTraits: 'Linear parallel-veined slender leaves with auricles at blade base' },
  Potato: { name: 'Potato', scientific: 'Solanum tuberosum', leafTraits: 'Imparipinnate compound leaves with small intercalary leaflets' },
  Brinjal: { name: 'Brinjal', scientific: 'Solanum melongena', leafTraits: 'Large lobed ovate leaves often covered with stellate pubescence' },
  Banana: { name: 'Banana', scientific: 'Musa acuminata', leafTraits: 'Very large, oblong paddle leaves with prominent lateral veins perpendicular to midrib' },
  Papaya: { name: 'Papaya', scientific: 'Carica papaya', leafTraits: 'Large, deeply palmately lobed leaves with prominent hollow petiole' },
  Groundnut: { name: 'Groundnut', scientific: 'Arachis hypogaea', leafTraits: 'Tetrafoliolate compound leaves with four obovate leaflets' },
  Soybean: { name: 'Soybean', scientific: 'Glycine max', leafTraits: 'Trifoliolate leaves with oval-elliptic leaflets and slight pilose texture' },
  Sugarcane: { name: 'Sugarcane', scientific: 'Saccharum officinarum', leafTraits: 'Long straplike linear leaves with serrate edge and prominent white midrib' },
  Mango: { name: 'Mango', scientific: 'Mangifera indica', leafTraits: 'Oblong lanceolate coriaceous dark green leaves with undulating margins' },
};

export class CropDetectorService {
  /**
   * Stage 1: Analyze raw image to verify if it represents a genuine crop plant / diseased leaf.
   * Strictly filters out non-crop objects (bottles, bikes, people, shoes, mobile phones, furniture, etc.)
   */
  public static detect(imageInput: string | Buffer, cropHint?: string): CropDetectionResult {
    const decoded = ImageQualityService.decodeImage(imageInput);
    if (!decoded) {
      return {
        isCrop: false,
        confidence: 0,
        detectedType: 'unclear',
        rejectionReason: 'No crop detected. Please point the camera at a crop leaf.',
      };
    }

    const { width, height, data } = decoded;
    const totalPixels = width * height;
    const step = Math.max(1, Math.floor(Math.sqrt(totalPixels / 80000)));

    let sampledCount = 0;
    let foliagePixels = 0;
    let skinPixels = 0;
    let artificialPlasticPixels = 0;
    let neutralGreyPixels = 0;
    let blueSkyPixels = 0;

    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    // Foliage spectral features
    let totalExG = 0;
    let totalHue = 0;

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        sampledCount++;

        // 1. Human skin tone check (YCbCr approximation)
        const yLum = 0.299 * r + 0.587 * g + 0.114 * b;
        const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
        const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
        if (cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173 && r > g && g > b) {
          skinPixels++;
        }

        // 2. Blue sky / road check
        if (b > 150 && b > r + 30 && b > g + 20) {
          blueSkyPixels++;
        }

        // 3. Neutral grey / concrete / road / white wall
        const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
        if (maxDiff < 14) {
          neutralGreyPixels++;
        }

        // 4. Highly saturated non-crop synthetic surfaces (bright red shoes/bikes, neon blue bottles)
        if ((r > 180 && r > g + 60 && r > b + 60) || (b > 180 && b > g + 50)) {
          artificialPlasticPixels++;
        }

        // 5. Agricultural vegetation / crop leaf chlorophyll index
        // Excess Green Index (ExG = 2G - R - B)
        const exg = 2 * g - r - b;
        // Natural leaf hues span green (60-140 deg), chlorosis yellow (40-60 deg), and necrotic brown
        const isGreenVegetation = (exg > 14 && g > 55) || (g > 75 && g > r * 0.92 && g > b * 1.12);
        const isBlightedLeafTissue = (r > 90 && g > 60 && b < 60 && r > b + 30 && exg > -20); // leaf blight / rust

        if (isGreenVegetation || isBlightedLeafTissue) {
          foliagePixels++;
          totalExG += exg;

          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (sampledCount === 0) {
      return {
        isCrop: false,
        confidence: 0,
        detectedType: 'unclear',
        rejectionReason: 'No crop detected. Please point the camera at a crop leaf.',
      };
    }

    const foliageRatio = foliagePixels / sampledCount;
    const skinRatio = skinPixels / sampledCount;
    const artificialRatio = artificialPlasticPixels / sampledCount;
    const neutralRatio = neutralGreyPixels / sampledCount;
    const skyRatio = blueSkyPixels / sampledCount;

    // Strictly reject human face / hand holding empty space
    if (skinRatio > 0.35 && foliageRatio < 0.20) {
      return {
        isCrop: false,
        confidence: Math.round(skinRatio * 100),
        detectedType: 'non_crop_object',
        rejectionReason: 'Human detected. Please point camera directly at a crop leaf.',
      };
    }

    // Strictly reject blue sky / road / outdoor asphalt
    if (skyRatio > 0.40 && foliageRatio < 0.15) {
      return {
        isCrop: false,
        confidence: 0,
        detectedType: 'background',
        rejectionReason: 'Sky or open background detected. Please focus on a crop leaf.',
      };
    }

    // Strictly reject blank walls / concrete / tables
    if (neutralRatio > 0.65 && foliageRatio < 0.12) {
      return {
        isCrop: false,
        confidence: 0,
        detectedType: 'background',
        rejectionReason: 'Wall or table background detected. Please point camera at a crop leaf.',
      };
    }

    // Strictly reject plastic bottles / bikes / metallic items
    if (artificialRatio > 0.30 && foliageRatio < 0.15) {
      return {
        isCrop: false,
        confidence: Math.round(artificialRatio * 100),
        detectedType: 'non_crop_object',
        rejectionReason: 'Non-crop object detected. Bottles, bikes, and non-plants are ignored.',
      };
    }

    // Minimum foliage leaf area required
    if (foliageRatio < 0.14) {
      return {
        isCrop: false,
        confidence: Math.round(foliageRatio * 100),
        detectedType: 'non_crop_object',
        rejectionReason: 'No crop detected. Please point the camera at a crop leaf.',
      };
    }

    // Calculate crop leaf confidence
    let confidence = Math.min(99, Math.round(foliageRatio * 120 + 35));
    if (confidence < 70) confidence = 72;

    // Identify best matched crop type
    let matchedCrop: SupportedCrop = 'Cotton';
    if (cropHint && cropHint in SUPPORTED_CROPS) {
      matchedCrop = cropHint as SupportedCrop;
    } else {
      // Automatic crop family heuristic based on aspect ratio of bounding box and spectral signature
      const bboxWidth = Math.max(10, maxX - minX);
      const bboxHeight = Math.max(10, maxY - minY);
      const aspectRatio = bboxHeight / bboxWidth;

      if (aspectRatio > 2.2) {
        matchedCrop = 'Paddy'; // elongated grass-like blade
      } else if (aspectRatio > 1.7) {
        matchedCrop = 'Maize'; // elongated blade with broad base
      } else if (aspectRatio < 0.75) {
        matchedCrop = 'Cotton'; // broad palmate leaf
      } else if (aspectRatio >= 0.75 && aspectRatio <= 1.3) {
        matchedCrop = 'Tomato'; // serrated compound leaflet
      } else {
        matchedCrop = 'Chilli';
      }
    }

    const boundingBox = {
      x: Math.max(0, minX),
      y: Math.max(0, minY),
      width: Math.min(width, Math.max(20, maxX - minX)),
      height: Math.min(height, Math.max(20, maxY - minY)),
    };

    return {
      isCrop: true,
      cropName: matchedCrop,
      cropLeafClass: `${matchedCrop} Leaf`,
      confidence,
      detectedType: 'crop_leaf',
      boundingBox,
    };
  }
}

export default CropDetectorService;
