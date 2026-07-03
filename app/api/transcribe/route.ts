import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/whisper-client';

export async function POST(request: NextRequest) {
  try {
    // Hole Audio-Daten aus dem Request
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Keine Audio-Datei bereitgestellt' },
        { status: 400 }
      );
    }

    // Konvertiere File zu Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    // Transkribiere mit Whisper
    const text = await transcribeAudio(audioBuffer);

    return NextResponse.json(
      { text, success: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: error.message || 'Transkription fehlgeschlagen' },
      { status: 500 }
    );
  }
}
