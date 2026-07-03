'use client';

import { useState, useRef } from 'react';
import { Mic, Square, Loader } from 'lucide-react';
import Button from '@/components/ui/Button';

interface AudioInputProps {
  onTranscribe: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function AudioInput({
  onTranscribe,
  placeholder = 'Text wird transkribiert...',
  disabled = false,
}: AudioInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/wav',
        });

        // Sende Audio zum Server
        await transcribeAudio(audioBlob);

        // Stoppe den Stream
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Fehler beim Starten der Aufnahme:', error);
      alert('Mikrofon-Zugriff nicht gewährt');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transkription fehlgeschlagen');
      }

      const data = await response.json();
      if (data.text) {
        onTranscribe(data.text);
      }
    } catch (error) {
      console.error('Transkriptions-Fehler:', error);
      alert('Transkription fehlgeschlagen. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      {!isRecording ? (
        <Button
          variant="outline"
          size="sm"
          onClick={startRecording}
          disabled={disabled || isTranscribing}
          className="flex items-center gap-2"
        >
          <Mic className="w-4 h-4" />
          {isTranscribing ? 'Wird transkribiert...' : 'Sprechen'}
        </Button>
      ) : (
        <Button
          variant="primary"
          size="sm"
          onClick={stopRecording}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
        >
          <Square className="w-4 h-4" />
          Stopp
        </Button>
      )}

      {isTranscribing && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader className="w-4 h-4 animate-spin" />
          <span>{placeholder}</span>
        </div>
      )}
    </div>
  );
}
