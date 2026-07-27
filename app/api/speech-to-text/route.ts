import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('audio') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No audio file uploaded.' }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;

    // Check if valid ElevenLabs or Whisper STT endpoint can be called
    if (apiKey && apiKey !== 'elevenlabs_demo_key') {
      try {
        const sttFormData = new FormData();
        sttFormData.append('file', file);
        sttFormData.append('model_id', 'scribe_v1');

        const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
          },
          body: sttFormData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.text) {
            return NextResponse.json({ transcript: data.text });
          }
        }
      } catch (err) {
        console.warn('ElevenLabs STT request failed:', err);
      }
    }

    // Fallback response instructing frontend to use transcribed text from Web Speech API
    return NextResponse.json({
      fallback: true,
      message: 'Using Web Speech API client transcription.',
    });
  } catch (error) {
    console.error('Error in speech-to-text route:', error);
    return NextResponse.json({ error: 'Server error processing audio.' }, { status: 500 });
  }
}
