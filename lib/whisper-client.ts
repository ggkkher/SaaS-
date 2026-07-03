import fs from 'fs';

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.startsWith('sk_test')) {
    throw new Error('OpenAI API key nicht konfiguriert');
  }

  try {
    // Erstelle FormData für Multipart-Upload
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/wav' });
    formData.append('file', blob, 'audio.wav');
    formData.append('model', 'whisper-1');
    formData.append('language', 'de'); // German language

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Whisper API error:', error);
      throw new Error(`Whisper API error: ${response.status}`);
    }

    const result = await response.json() as { text: string };
    return result.text;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}

export async function transcribeAudioFromFile(filePath: string): Promise<string> {
  const audioBuffer = fs.readFileSync(filePath);
  return transcribeAudio(audioBuffer);
}
