import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, voiceId, voiceName } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text prompt is required.' }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const targetVoiceId = voiceId || '21m00Tcm4TlvDq8ikWAM'; // Default Rachel

    console.info(`[Voice AI Backend] Voice ID received: ${targetVoiceId} | Voice Name: ${voiceName || 'Default'} | ElevenLabs Request URL: https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}`);

    // Clean text by stripping markdown symbols
    const cleanText = text
      .replace(/[\#\*\_\`]/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .slice(0, 1000);

    if (!apiKey || apiKey === 'elevenlabs_demo_key') {
      return NextResponse.json({
        fallback: true,
        voiceId: targetVoiceId,
        voiceName: voiceName || 'Default',
        message: 'ElevenLabs API key not configured. Using Web Speech API fallback.',
        cleanText,
      });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      console.warn(`[Voice AI Backend] ElevenLabs API error (${response.status}) for voice: ${targetVoiceId}`);
      return NextResponse.json({
        fallback: true,
        voiceId: targetVoiceId,
        voiceName: voiceName || 'Default',
        message: `ElevenLabs API error ${response.status}. Falling back to browser speech.`,
        cleanText,
      });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('[Voice AI Backend] Error in text-to-speech route:', error);
    return NextResponse.json({
      fallback: true,
      message: 'Server error generating speech.',
    }, { status: 500 });
  }
}
