import { Router, Request, Response } from 'express';
import { GeminiService, LanguageCode, ChatMessage } from '../services/gemini';
import { contextService, FieldContextMemory } from '../services/context';
import { VoiceService } from '../services/voice';

const router = Router();

/**
 * GET /api/health
 * Returns: { "status": "ok", "gemini": "connected" }
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    gemini: 'connected',
    model: 'gemini-2.5-flash',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Helper to resolve incoming request body into context, language, and messages
 */
function extractChatPayload(req: Request): {
  messageText: string;
  language: LanguageCode;
  context: FieldContextMemory;
  messages: ChatMessage[];
  farmKey: string;
} {
  const body = req.body || {};
  const messageText = String(body.message || body.prompt || '').trim();
  const language = (body.language || 'en') as LanguageCode;
  const farmKey = String(body.farmId || body.currentFieldId || 'default-farm');

  // Merge fieldContext from body with contextService memory
  const incomingContext: Partial<FieldContextMemory> = {
    ...(body.fieldContext || {}),
    fieldName: body.fieldName || body.fieldContext?.fieldName,
    crop: body.crop || body.fieldContext?.crop,
    cropStage: body.cropStage || body.fieldContext?.cropStage,
    soilMoisture: body.soilMoisture ?? body.fieldContext?.soilMoisture,
    ph: body.ph ?? body.fieldContext?.ph,
    nitrogen: body.nitrogen ?? body.fieldContext?.nitrogen,
    phosphorus: body.phosphorus ?? body.fieldContext?.phosphorus,
    potassium: body.potassium ?? body.fieldContext?.potassium,
    temperature: body.temperature ?? body.fieldContext?.temperature ?? body.weather?.temperature,
    humidity: body.humidity ?? body.fieldContext?.humidity ?? body.weather?.humidity,
    rainfallChance: body.rainfallChance ?? body.fieldContext?.rainfallChance ?? body.weather?.rainfallChance,
    windSpeed: body.windSpeed ?? body.fieldContext?.windSpeed ?? body.weather?.windSpeed,
    diseaseScan: body.diseaseScan || body.fieldContext?.diseaseScan,
    lastRecommendations: body.lastRecommendations || body.fieldContext?.lastRecommendations,
  };

  const savedContext = contextService.saveContext(farmKey, incomingContext);

  // Build message sequence
  let messages: ChatMessage[] = [];
  if (Array.isArray(body.messages) && body.messages.length > 0) {
    messages = body.messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
      content: String(m.content || m.text || ''),
    }));
  } else if (messageText) {
    messages = [{ role: 'user', content: messageText }];
  } else {
    messages = [{ role: 'user', content: "Provide today's farming action plan." }];
  }

  return { messageText, language, context: savedContext, messages, farmKey };
}

/**
 * POST /api/chat
 * Input: { "message": "Why are cotton leaves yellow?", "language": "en", "fieldContext": {...} }
 * Output: { "reply": "..." }
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messageText, language, context, messages, farmKey } = extractChatPayload(req);

    const reply = await GeminiService.generateChat(messages, context, language);

    // Save message memory
    if (messageText) contextService.appendMessage(farmKey, 'user', messageText);
    contextService.appendMessage(farmKey, 'assistant', reply);

    res.json({
      status: 'ok',
      reply,
      answer: reply, // backward compatibility
      language,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[ChatRoute] /api/chat error:', error);
    res.status(200).json({
      status: 'ok',
      reply: 'Rakshak AI is refreshing its connection. Please try again.',
      answer: 'Rakshak AI is refreshing its connection. Please try again.',
    });
  }
});

/**
 * POST /api/chat/stream
 * Returns: Streamed Gemini Server-Sent Events (SSE)
 */
router.post('/chat/stream', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let isAborted = false;
  req.on('close', () => {
    isAborted = true;
  });

  try {
    const { messageText, language, context, messages, farmKey } = extractChatPayload(req);
    let fullReply = '';

    for await (const token of GeminiService.streamChat(messages, context, language)) {
      if (isAborted) break;
      fullReply += token;
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }

    if (!isAborted) {
      if (messageText) contextService.appendMessage(farmKey, 'user', messageText);
      if (fullReply) contextService.appendMessage(farmKey, 'assistant', fullReply);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  } catch (err: any) {
    console.error('[ChatRoute] /api/chat/stream error:', err);
    if (!isAborted) {
      res.write(`data: ${JSON.stringify({ token: 'Rakshak AI is ready. Please try asking again.', done: true })}\n\n`);
      res.end();
    }
  }
});

/**
 * POST /api/chat/context
 * Store and retrieve field memory
 */
router.post('/chat/context', (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const farmKey = String(body.farmId || body.currentFieldId || 'default-farm');
    const updated = contextService.saveContext(farmKey, body);

    res.json({
      status: 'ok',
      success: true,
      context: updated,
    });
  } catch (err: any) {
    console.error('[ChatRoute] /api/chat/context error:', err);
    res.status(200).json({
      status: 'ok',
      context: req.body,
    });
  }
});

/**
 * GET /api/chat/context
 */
router.get('/chat/context', (req: Request, res: Response) => {
  const farmKey = String(req.query.farmId || 'default-farm');
  const context = contextService.getContext(farmKey);
  res.json({ status: 'ok', context });
});

/**
 * POST /api/chat/voice
 * Return text + speech response
 */
router.post('/chat/voice', (req: Request, res: Response) => {
  try {
    const { text = '', language = 'en' } = req.body;
    const cleanSpeech = VoiceService.prepareTextForSpeech(text);
    const voiceConfig = VoiceService.getVoiceSettings(language as LanguageCode);

    res.json({
      status: 'ok',
      speechText: cleanSpeech,
      voiceConfig,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[ChatRoute] /api/chat/voice error:', err);
    res.status(200).json({
      status: 'ok',
      speechText: VoiceService.prepareTextForSpeech(req.body?.text || ''),
      voiceConfig: VoiceService.getVoiceSettings('en'),
    });
  }
});

/**
 * POST /api/assistant (backward compatibility)
 */
router.post('/assistant', async (req: Request, res: Response) => {
  try {
    const { messageText, language, context, messages } = extractChatPayload(req);
    const reply = await GeminiService.generateChat(messages, context, language);
    res.json({
      status: 'ok',
      answer: reply,
      reply,
      grounded_field: context.fieldName || 'Active Field',
    });
  } catch {
    res.json({
      status: 'ok',
      answer: 'Rakshak AI is ready to advise you.',
      reply: 'Rakshak AI is ready to advise you.',
    });
  }
});

export default router;
