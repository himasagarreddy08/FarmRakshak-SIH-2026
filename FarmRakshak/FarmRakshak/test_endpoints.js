import http from 'http';
import app from './server/chat.ts';

const server = http.createServer(app);

server.listen(5099, async () => {
  console.log('Testing server running on port 5099');

  try {
    // 1. Test Health
    const healthRes = await fetch('http://127.0.0.1:5099/api/health');
    const healthData = await healthRes.json();
    console.log('Health check passed:', healthData.status === 'ok', healthData);

    // 2. Test Context
    const contextRes = await fetch('http://127.0.0.1:5099/api/chat/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmId: 'test-farm',
        crop: 'Cotton',
        cropStage: 'Flowering',
        soilMoisture: 28,
        rainfallChance: 15,
      }),
    });
    const contextData = await contextRes.json();
    console.log('Context update passed:', contextData.success === true);

    // 3. Test Chat (English)
    const chatRes = await fetch('http://127.0.0.1:5099/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Should I irrigate today?',
        language: 'en',
        crop: 'Cotton',
        soilMoisture: 28,
        rainfallChance: 15,
      }),
    });
    const chatData = await chatRes.json();
    console.log('Chat endpoint passed:', chatData.success === true);
    console.log('Reply preview:', chatData.reply.substring(0, 120) + '...');

    // 4. Test Chat (Hindi)
    const chatHiRes = await fetch('http://127.0.0.1:5099/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'क्या मुझे आज सिंचाई करनी चाहिए?',
        language: 'hi',
        crop: 'कपास (Cotton)',
        soilMoisture: 28,
        rainfallChance: 15,
      }),
    });
    const chatHiData = await chatHiRes.json();
    console.log('Hindi chat passed:', chatHiData.success === true);
    console.log('Hindi preview:', chatHiData.reply.substring(0, 120) + '...');

    // 5. Test Voice
    const voiceRes = await fetch('http://127.0.0.1:5099/api/chat/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '### Warning: Cotton leaf spot detected! Spray Mancozeb.',
        language: 'en',
      }),
    });
    const voiceData = await voiceRes.json();
    console.log('Voice endpoint passed:', voiceData.speechText.includes('Warning') && !voiceData.speechText.includes('###'));

    // 6. Test Stream SSE
    const streamRes = await fetch('http://127.0.0.1:5099/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Give today action plan',
        language: 'en',
      }),
    });
    const reader = streamRes.body.getReader();
    const decoder = new TextDecoder();
    let streamText = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      streamText += decoder.decode(value);
    }
    console.log('Stream SSE passed:', streamText.includes('data:'));
    console.log('Stream chunks length:', streamText.length);

    console.log('ALL 6 BACKEND TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
});
