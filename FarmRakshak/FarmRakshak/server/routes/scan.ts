import { Router, Request, Response } from 'express';
import CropDetectorService from '../services/cropDetector';
import ImageQualityService from '../services/imageQuality';
import DiseaseClassifierService, { LanguageCode } from '../services/diseaseClassifier';

const router = Router();

router.post('/scan', async (req: Request, res: Response) => {
  try {
    const { image, language = 'en', cropHint } = req.body as {
      image: string;
      language?: LanguageCode;
      cropHint?: string;
    };

    if (!image) {
      res.status(400).json({
        success: false,
        error: 'No image provided. Please capture a crop leaf photo.',
      });
      return;
    }

    const lang: LanguageCode = (['en', 'hi', 'te', 'mr'].includes(language) ? language : 'en') as LanguageCode;

    // ─── Stage 1: Crop Detection ──────────────────────────────────────────────
    const cropResult = CropDetectorService.detect(image, cropHint);

    if (!cropResult.isCrop) {
      res.status(422).json({
        success: false,
        stage: 'crop_detection',
        error: cropResult.rejectionReason || 'No crop detected. Please point the camera at a crop leaf.',
        detectedType: cropResult.detectedType,
      });
      return;
    }

    // ─── Stage 2: Image Quality Check ─────────────────────────────────────────
    const quality = ImageQualityService.evaluate(image);

    if (!quality.isQualityAcceptable && quality.issues.length > 0) {
      res.status(422).json({
        success: false,
        stage: 'quality_check',
        error: quality.issues[0],
        quality: {
          blurScore: quality.blurScore,
          brightness: quality.brightness,
          vegetationPercent: quality.vegetationPercent,
          issues: quality.issues,
        },
      });
      return;
    }

    // ─── Stage 4: Disease Classification ──────────────────────────────────────
    const cropName = cropResult.cropName || 'Cotton';
    const diseaseProfile = await DiseaseClassifierService.classify(
      cropName,
      image,
      quality.vegetationPercent,
      lang
    );

    // ─── Build Structured Response ─────────────────────────────────────────────
    res.status(200).json({
      success: true,
      crop: diseaseProfile.cropName,
      disease: diseaseProfile.diseaseName,
      isHealthy: diseaseProfile.isHealthy,
      confidence: diseaseProfile.confidence,
      severity: diseaseProfile.severity,
      symptoms: diseaseProfile.symptoms,
      treatment: diseaseProfile.treatment,
      organicSolution: diseaseProfile.organicSolution,
      chemicalRecommendation: diseaseProfile.chemicalRecommendation,
      icarRecommendation: diseaseProfile.icarRecommendation,
      fertilizerAdvice: diseaseProfile.fertilizerAdvice,
      irrigationAdvice: diseaseProfile.irrigationAdvice,
      weatherWarning: diseaseProfile.weatherWarning,
      quality: {
        blurScore: quality.blurScore,
        brightness: quality.brightness,
        vegetationPercent: quality.vegetationPercent,
      },
      detectionMeta: {
        cropLeafClass: cropResult.cropLeafClass,
        cropConfidence: cropResult.confidence,
        boundingBox: cropResult.boundingBox,
      },
    });
  } catch (err: any) {
    console.error('[ScanRouter] Scan error:', err?.message || err);
    res.status(500).json({
      success: false,
      error: 'Scan processing failed. Please retry with a clear crop leaf photo.',
    });
  }
});

export default router;
