/**
 * Server-side Model Validation API
 *
 * POST /api/validation/test
 *
 * Runs validation tests against models using server-side API keys.
 * Used by the backroom validation dashboard.
 *
 * Request body:
 * {
 *   models: { provider, model, label, type }[]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';
import WebSocket from 'ws';

type Provider = 'openai' | 'anthropic' | 'openrouter' | 'gemini';

interface ModelToTest {
  provider: Provider;
  model: string;
  label: string;
  type: string;
}

interface TestResult {
  provider: Provider;
  model: string;
  modelLabel: string;
  status: 'success' | 'failed' | 'untested';
  type: string;
  timestamp: number;
  latency?: number;
  error?: string;
}

// Get API keys from environment
function getApiKey(provider: Provider): string | undefined {
  switch (provider) {
    case 'openai':
      return process.env.OPENAI_API_KEY;
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY;
    case 'gemini':
      return process.env.GEMINI_API_KEY;
    case 'openrouter':
      return process.env.OPENROUTER_API_KEY;
    default:
      return undefined;
  }
}

/**
 * Generate a minimal valid WAV audio file programmatically
 * Creates a 0.1 second mono 16-bit PCM at 16kHz (valid for Whisper)
 */
function generateTestAudio(): Buffer {
  const sampleRate = 16000;
  const duration = 0.1; // 100ms
  const numSamples = Math.floor(sampleRate * duration);
  const bytesPerSample = 2; // 16-bit
  const numChannels = 1; // mono

  const dataSize = numSamples * bytesPerSample * numChannels;
  const fileSize = 44 + dataSize; // WAV header is 44 bytes

  const buffer = Buffer.alloc(fileSize);
  let offset = 0;

  // RIFF header
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(fileSize - 8, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;

  // fmt chunk
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4; // chunk size
  buffer.writeUInt16LE(1, offset); offset += 2; // PCM format
  buffer.writeUInt16LE(numChannels, offset); offset += 2;
  buffer.writeUInt32LE(sampleRate, offset); offset += 4;
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, offset); offset += 4; // byte rate
  buffer.writeUInt16LE(numChannels * bytesPerSample, offset); offset += 2; // block align
  buffer.writeUInt16LE(bytesPerSample * 8, offset); offset += 2; // bits per sample

  // data chunk
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;

  // Generate silence (zeros) - Whisper will just return empty transcription
  // The samples are already zero from Buffer.alloc

  return buffer;
}

/**
 * Test a realtime model via WebSocket connection
 * Opens connection, waits for acknowledgment or error, then closes
 */
function testRealtimeWebSocket(apiKey: string, model: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`;

    const ws = new WebSocket(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    });

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('WebSocket connection timeout'));
    }, 10000); // 10 second timeout

    ws.on('open', () => {
      // Connection successful - model is valid
      clearTimeout(timeout);
      ws.close();
      resolve();
    });

    ws.on('message', () => {
      // Any message means connection is working
      clearTimeout(timeout);
      ws.close();
      resolve();
    });

    ws.on('error', (error: Error) => {
      clearTimeout(timeout);
      reject(new Error(`WebSocket error: ${error.message}`));
    });

    ws.on('close', (code: number, reason: Buffer) => {
      clearTimeout(timeout);
      if (code !== 1000 && code !== 1005) {
        reject(new Error(`WebSocket closed: ${code} ${reason.toString()}`));
      }
    });
  });
}

// Test a single model
async function testModel(model: ModelToTest): Promise<TestResult> {
  const startTime = Date.now();
  const apiKey = getApiKey(model.provider);

  if (!apiKey) {
    return {
      provider: model.provider,
      model: model.model,
      modelLabel: model.label,
      status: 'failed',
      type: model.type,
      timestamp: startTime,
      error: 'No API key configured',
    };
  }

  try {
    switch (model.provider) {
      case 'openai':
        await testOpenAI(apiKey, model.model, model.type);
        break;
      case 'anthropic':
        await testAnthropic(apiKey, model.model);
        break;
      case 'gemini':
        await testGemini(apiKey, model.model);
        break;
      case 'openrouter':
        await testOpenRouter(apiKey, model.model);
        break;
    }

    return {
      provider: model.provider,
      model: model.model,
      modelLabel: model.label,
      status: 'success',
      type: model.type,
      timestamp: startTime,
      latency: Date.now() - startTime,
    };
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';

    // Check if this is an "untestable" error (model exists but can't be fully tested)
    const isUntested = errorMessage.includes('untestable') ||
                       errorMessage.includes('model exists but');

    return {
      provider: model.provider,
      model: model.model,
      modelLabel: model.label,
      status: isUntested ? 'untested' : 'failed',
      type: model.type,
      timestamp: startTime,
      latency: Date.now() - startTime,
      error: errorMessage,
    };
  }
}

async function testOpenAI(apiKey: string, model: string, type: string): Promise<'success' | 'untested'> {
  const openai = new OpenAI({ apiKey });
  const typeLower = type?.toLowerCase() || '';

  if (typeLower === 'image') {
    // Test image models by generating a small image
    await openai.images.generate({
      model,
      prompt: 'A single white pixel',
      size: '1024x1024', // DALL-E 3 minimum size
    });
    return 'success';
  }

  if (typeLower === 'realtime') {
    // Test realtime models via WebSocket connection
    await testRealtimeWebSocket(apiKey, model);
    return 'success';
  }

  if (typeLower === 'embedding') {
    // Test embedding models with the embeddings endpoint
    await openai.embeddings.create({
      model,
      input: 'test',
    });
    return 'success';
  }

  if (typeLower === 'tts') {
    // Test TTS models with the audio speech endpoint
    await openai.audio.speech.create({
      model,
      voice: 'alloy',
      input: 'Hi',
    });
    return 'success';
  }

  if (typeLower === 'audio') {
    // Test audio transcription models with generated audio
    const audioBuffer = generateTestAudio();
    const audioFile = await toFile(audioBuffer, 'test.wav', { type: 'audio/wav' });
    await openai.audio.transcriptions.create({
      model,
      file: audioFile,
    });
    return 'success';
  }

  if (
    typeLower === 'responses' ||
    typeLower === 'response' ||
    model.startsWith('o1-') ||
    model.startsWith('o3-')
  ) {
    // For reasoning models (o1, o3), use the responses API
    await openai.responses.create({
      model,
      input: 'Hi',
    });
    return 'success';
  }

  // Default: chat models
  await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: 'Hi' }],
  });
  return 'success';
}

async function testAnthropic(apiKey: string, model: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }
}

async function testGemini(apiKey: string, model: string) {
  const modelLower = model.toLowerCase();

  // Embedding models use a different endpoint
  if (modelLower.includes('embedding')) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { parts: [{ text: 'test' }] },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }
    return;
  }

  // Image generation models (Imagen)
  if (modelLower.includes('imagen')) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: 'A white pixel' }],
          parameters: { sampleCount: 1 },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }
    return;
  }

  // TTS models require audio response modality
  if (modelLower.includes('tts')) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hi' }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }
    return;
  }

  // Default: text/chat models
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hi' }] }],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }
}

async function testOpenRouter(apiKey: string, model: string) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Hi' }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { models } = body as { models: ModelToTest[] };

    if (!models || !Array.isArray(models)) {
      return NextResponse.json(
        { error: 'Invalid request: models array required' },
        { status: 400 }
      );
    }

    // Run tests sequentially to avoid rate limits
    const results: TestResult[] = [];
    for (const model of models) {
      const result = await testModel(model);
      results.push(result);
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('[validation/test] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Validation failed' },
      { status: 500 }
    );
  }
}
