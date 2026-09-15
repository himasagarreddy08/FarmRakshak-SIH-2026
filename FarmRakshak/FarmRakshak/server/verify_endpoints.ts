import http from 'http';
import app from './index';

const PORT = 5000;

async function runTests(baseUrl: string, serverInstance?: http.Server) {
  console.log(`\n==============================================`);
  console.log(`🌱 MANDATORY BACKEND ENDPOINT VERIFICATION SUITE`);
  console.log(`Target URL: ${baseUrl}`);
  console.log(`==============================================\n`);

  let allPassed = true;

  // 1. Verify GET /api/health
  try {
    const res = await fetch(`${baseUrl}/api/health`);
    const data = await res.json();
    const passed = res.status === 200 && data.status === 'ok' && data.gemini === 'connected';
    console.log(`[1/5] GET /api/health:`);
    console.log(`      Status: ${res.status} ${res.statusText}`);
    console.log(`      Response:`, JSON.stringify(data));
    console.log(`      Result: ${passed ? '✅ PASSED' : '❌ FAILED'}\n`);
    if (!passed) allPassed = false;
  } catch (e: any) {
    console.error(`[1/5] GET /api/health error:`, e.message);
    allPassed = false;
  }

  // 2. Verify POST /api/chat
  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Why are cotton leaves yellow?',
        language: 'en',
        fieldContext: {
          crop: 'Cotton',
          cropStage: 'Flowering',
          soilMoisture: 30,
          rainfallChance: 25,
        },
      }),
    });
    const data = await res.json();
    const passed = res.status === 200 && typeof data.reply === 'string' && data.reply.length > 20;
    console.log(`[2/5] POST /api/chat:`);
    console.log(`      Status: ${res.status} ${res.statusText}`);
    console.log(`      Reply snippet: "${data.reply?.substring(0, 100).replace(/\n/g, ' ')}..."`);
    console.log(`      Result: ${passed ? '✅ PASSED' : '❌ FAILED'}\n`);
    if (!passed) allPassed = false;
  } catch (e: any) {
    console.error(`[2/5] POST /api/chat error:`, e.message);
    allPassed = false;
  }

  // 3. Verify POST /api/chat/stream
  try {
    const res = await fetch(`${baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Should I irrigate today?',
        language: 'en',
        fieldContext: { crop: 'Cotton', soilMoisture: 28, rainfallChance: 15 },
      }),
    });
    const passedStatus = res.status === 200 && res.headers.get('content-type')?.includes('text/event-stream');
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let streamData = '';
    let chunkCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunkCount++;
      streamData += decoder.decode(value);
    }

    const passedStream = streamData.includes('data:') && chunkCount >= 1;
    console.log(`[3/5] POST /api/chat/stream:`);
    console.log(`      Status: ${res.status} ${res.statusText}`);
    console.log(`      Chunks Received: ${chunkCount}, Total Stream Length: ${streamData.length} chars`);
    console.log(`      Result: ${passedStatus && passedStream ? '✅ PASSED' : '❌ FAILED'}\n`);
    if (!(passedStatus && passedStream)) allPassed = false;
  } catch (e: any) {
    console.error(`[3/5] POST /api/chat/stream error:`, e.message);
    allPassed = false;
  }

  // 4. Verify POST /api/chat/context
  try {
    const res = await fetch(`${baseUrl}/api/chat/context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmId: 'farm-test-01',
        crop: 'Cotton',
        cropStage: 'Boll formation',
        soilMoisture: 33,
        temperature: 31,
      }),
    });
    const data = await res.json();
    const passed = res.status === 200 && data.status === 'ok' && data.context?.crop === 'Cotton';
    console.log(`[4/5] POST /api/chat/context:`);
    console.log(`      Status: ${res.status} ${res.statusText}`);
    console.log(`      Stored Context Crop: "${data.context?.crop}", Stage: "${data.context?.cropStage}"`);
    console.log(`      Result: ${passed ? '✅ PASSED' : '❌ FAILED'}\n`);
    if (!passed) allPassed = false;
  } catch (e: any) {
    console.error(`[4/5] POST /api/chat/context error:`, e.message);
    allPassed = false;
  }

  // 5. Verify POST /api/chat/voice
  try {
    const res = await fetch(`${baseUrl}/api/chat/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '### Warning: Cotton Leaf Spot Detected. Spray Mancozeb 75 WP at 2g per liter.',
        language: 'en',
      }),
    });
    const data = await res.json();
    const passed = res.status === 200 && data.status === 'ok' && typeof data.speechText === 'string' && !data.speechText.includes('###');
    console.log(`[5/5] POST /api/chat/voice:`);
    console.log(`      Status: ${res.status} ${res.statusText}`);
    console.log(`      Sanitized Voice Text: "${data.speechText?.substring(0, 80)}..."`);
    console.log(`      Voice Config Lang: "${data.voiceConfig?.langCode}"`);
    console.log(`      Result: ${passed ? '✅ PASSED' : '❌ FAILED'}\n`);
    if (!passed) allPassed = false;
  } catch (e: any) {
    console.error(`[5/5] POST /api/chat/voice error:`, e.message);
    allPassed = false;
  }

  console.log(`==============================================`);
  if (allPassed) {
    console.log(`🎉 ALL 5 MANDATORY VERIFICATION TESTS PASSED!`);
  } else {
    console.log(`⚠️ ONE OR MORE VERIFICATION TESTS FAILED.`);
  }
  console.log(`==============================================\n`);

  if (serverInstance) {
    serverInstance.close();
  }

  process.exit(allPassed ? 0 : 1);
}

const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`[Rakshak Verification] Server listening on http://localhost:${PORT}`);
  await runTests(`http://localhost:${PORT}`, server);
});
