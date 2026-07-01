import * as googleTTS from 'google-tts-api';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  const lang = searchParams.get('lang') || 'en';

  if (!text) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }

  try {
    // Generate the URL for the free Google TTS endpoint
    const url = googleTTS.getAudioUrl(text, {
      lang,
      slow: false,
      host: 'https://translate.google.com',
    });

    // Fetch the MP3 audio buffer
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google TTS failed: ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();

    // Proxy it back to the client as an audio stream
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('TTS Proxy Error:', error);
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
  }
}
