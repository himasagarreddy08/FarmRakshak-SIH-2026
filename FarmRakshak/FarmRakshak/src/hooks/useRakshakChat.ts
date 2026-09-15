import { useState, useCallback, useRef } from 'react';
import { AppLanguage } from './useVoiceAssistant';

export const API = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL}/api` 
  : 'http://localhost:5000/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface FarmingContext {
  fieldName?: string;
  crop?: string;
  cropStage?: string;
  soilMoisture?: number | string;
  ph?: number;
  nitrogen?: number | string;
  phosphorus?: number | string;
  potassium?: number | string;
  temperature?: number;
  humidity?: number;
  rainfallChance?: number;
  windSpeed?: number;
  uvIndex?: number;
  diseaseScan?: {
    diseaseName?: string;
    confidence?: number;
    severity?: string;
    symptoms?: string;
  };
  lastRecommendations?: string[];
  farmId?: string;
  partitionId?: string;
  role?: string;
}

export interface UseRakshakChatProps {
  language: AppLanguage;
  initialContext?: FarmingContext;
  onAssistantReply?: (reply: string) => void;
}

async function safeFetch(path: string, options: RequestInit): Promise<Response> {
  // Primary attempt: http://localhost:5000/api
  try {
    const url = `${API}${path}`;
    const res = await fetch(url, options);
    if (res.ok) return res;
  } catch (err) {
    console.warn(`[RakshakChat] API direct fetch failed on ${API}${path}, falling back to relative proxy...`);
  }

  // Fallback: relative path /api (supported by Vite proxy)
  const relativeUrl = `/api${path}`;
  return fetch(relativeUrl, options);
}

export function useRakshakChat({ language, initialContext, onAssistantReply }: UseRakshakChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: language === 'hi'
        ? 'नमस्ते! मैं रक्षक एआई हूँ, आपका समर्पित कृषि सहायक। अपनी फसल, सिंचाई, कीट निदान या आज की कार्ययोजना के बारे में कुछ भी पूछें।'
        : language === 'te'
        ? 'నమస్కారం! నేను రక్షక్ AI, మీ వ్యవసాయ సలహాదారుని. మీ పంట, నీటిపారుదల, తెగుళ్లు లేదా నేటి సాగు ప్రణాళిక గురించి అడగండి.'
        : language === 'mr'
        ? 'नमस्कार! मी रक्षक एआय, आपला शेती मार्गदर्शक. आपल्या पिकाची काळजी, पाणी व्यवस्थापन, खते किंवा किडीविषयी काहीही विचारा.'
        : 'Welcome! I am Rakshak AI, your expert agricultural companion powered by Gemini 2.5 Flash and grounded in ICAR/KVK practices. How can I help your farm today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: false,
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [context, setContext] = useState<FarmingContext>(initialContext || {});
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateContext = useCallback((newCtx: Partial<FarmingContext>) => {
    setContext((prev) => {
      const merged = { ...prev, ...newCtx };
      // Sync with backend memory
      safeFetch('/chat/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      }).catch(() => {});
      return merged;
    });
  }, []);

  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsReconnecting(false);
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
    );
  }, []);

  const sendMessage = useCallback(
    async (text: string, overrideContext?: FarmingContext, retryCount = 0) => {
      const prompt = text.trim();
      if (!prompt) return;

      const userMsgId = `user-${Date.now()}`;
      const assistantMsgId = `assistant-${Date.now()}`;
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Add messages if not retrying
      if (retryCount === 0) {
        const userMsg: ChatMessage = {
          id: userMsgId,
          role: 'user',
          content: prompt,
          timestamp: nowTime,
        };

        const assistantMsg: ChatMessage = {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          timestamp: nowTime,
          isStreaming: true,
        };

        setMessages((prev) => [...prev, userMsg, assistantMsg]);
      }

      setIsLoading(true);
      const activeContext = overrideContext || context;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await safeFetch('/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: prompt,
            language,
            fieldContext: activeContext,
            ...activeContext,
            messages: messages.slice(-8),
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error('Stream response not available, switching to chat endpoint');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (!dataStr) continue;

              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.token) {
                  accumulatedText += parsed.token;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
                    )
                  );
                }
                if (parsed.done) break;
              } catch {
                accumulatedText += dataStr;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
                  )
                );
              }
            }
          }
        }

        // Complete message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, isStreaming: false } : m
          )
        );

        if (onAssistantReply && accumulatedText) {
          onAssistantReply(accumulatedText);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;

        console.warn('[RakshakChat] Streaming error, attempting standard chat endpoint:', err);

        // Automatic retry via standard POST /chat
        try {
          setIsReconnecting(true);
          const fallbackRes = await safeFetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: prompt,
              language,
              fieldContext: activeContext,
              ...activeContext,
            }),
          });
          const fallbackData = await fallbackRes.json();
          const reply = fallbackData.reply || fallbackData.answer || 'Rakshak AI has prepared your grounded recommendations.';
          
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: reply, isStreaming: false } : m
            )
          );
          if (onAssistantReply) onAssistantReply(reply);
        } catch (fallbackErr) {
          // If both fail, retry once after 1.5s or supply grounded answer
          if (retryCount < 1) {
            console.log('[RakshakChat] Retrying query in 1.5s...');
            setTimeout(() => {
              sendMessage(text, overrideContext, retryCount + 1);
            }, 1500);
            return;
          }

          const safeReply = language === 'hi'
            ? 'रक्षक एआई आपकी सेवा में तैयार है। कृपया आज की फसल स्थिति अथवा सिंचाई के बारे में पुनः प्रश्न पूछें।'
            : language === 'te'
            ? 'రక్షక్ AI మీ సేవలో సిద్ధంగా ఉంది. దయచేసి మీ పంట పరిస్థితి లేదా నీటిపారుదల గురించి మళ్లీ అడగండి.'
            : language === 'mr'
            ? 'रक्षक एआय आपल्या सेवेसाठी तत्पर आहे. कृपया पिकाच्या सद्यस्थितीबद्दल पुन्हा विचारा.'
            : 'Rakshak AI is ready to advise you. Please ask about your crop status, soil moisture, or today\'s plan.';

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: safeReply, isStreaming: false } : m
            )
          );
        }
      } finally {
        setIsLoading(false);
        setIsReconnecting(false);
        abortControllerRef.current = null;
      }
    },
    [context, language, messages, onAssistantReply]
  );

  const regenerateResponse = useCallback(
    (messageId: string) => {
      const idx = messages.findIndex((m) => m.id === messageId);
      if (idx <= 0) return;
      const userMsg = messages[idx - 1];
      if (userMsg && userMsg.role === 'user') {
        setMessages((prev) => prev.slice(0, idx));
        sendMessage(userMsg.content);
      }
    },
    [messages, sendMessage]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    isReconnecting,
    context,
    updateContext,
    sendMessage,
    regenerateResponse,
    stopGenerating,
    clearChat,
  };
}
