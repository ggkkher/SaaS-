'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Button from '@/components/ui/Button';

interface Offer {
  id: string;
  clientName: string;
  clientEmail?: string;
  status: string;
  totalGross: number;
  positions: Array<{
    id: string;
    name: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalNet: number;
  }>;
}

export default function OfferSignPage({ params }: { params: { id: string } }) {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [signaturePNG, setSignaturePNG] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchOffer();
  }, []);

  const fetchOffer = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/offers/${params.id}`);
      setOffer(response.data.offer);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Angebot konnte nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setSignaturePNG(null);
  };

  const saveSignature = async () => {
    if (!canvasRef.current) return;

    const signatureData = canvasRef.current.toDataURL('image/png');
    setSignaturePNG(signatureData);

    // Hier könnte man auch speichern, für MVP einfach anzeigen
    setError('');
  };

  const submitSignature = async () => {
    if (!signaturePNG) {
      setError('Bitte unterschreiben Sie zuerst');
      return;
    }

    try {
      setIsSigning(true);
      await axios.patch(`/api/offers/${params.id}`, {
        status: 'signed',
        signatureUrl: signaturePNG,
      });

      // Sende Bestätigungs-Email
      try {
        await axios.post(`/api/offers/${params.id}/send-confirmation-email`);
      } catch (emailErr) {
        console.error('Fehler beim Email-Versand:', emailErr);
        // Nicht als Fehler anzeigen - Unterschrift wurde gespeichert
      }

      setError('');
      alert(
        'Unterschrift erfolgreich gespeichert! Vielen Dank für Ihre Unterschrift.'
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Speichern der Unterschrift');
    } finally {
      setIsSigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Lädt...</p>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">Angebot nicht gefunden</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Angebot unterzeichnen
          </h1>
          <p className="text-gray-600 mb-8">
            Bitte unterzeichnen Sie dieses Angebot digital
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Angebots-Info */}
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h2 className="font-semibold text-gray-900 mb-2">Angebots-Zusammenfassung</h2>
            <p className="text-gray-700 mb-2">
              <strong>Kunde:</strong> {offer.clientName}
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Betrag:</strong> €{offer.totalGross.toFixed(2)}
            </p>

            <div className="border-t pt-4">
              <p className="font-semibold text-gray-900 mb-2">Positionen:</p>
              <ul className="text-sm space-y-1">
                {offer.positions.map((pos) => (
                  <li key={pos.id} className="text-gray-600">
                    • {pos.name} ({pos.quantity} {pos.unit})
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Signature Canvas */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Ihre Unterschrift
            </label>
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full border border-gray-200 rounded bg-white cursor-crosshair"
              />
            </div>

            <div className="flex gap-3 mt-4">
              <Button
                onClick={saveSignature}
                variant="primary"
                size="md"
                className="flex-1"
              >
                Unterschrift speichern
              </Button>
              <Button
                onClick={clearSignature}
                variant="outline"
                size="md"
                className="flex-1"
              >
                Löschen
              </Button>
            </div>
          </div>

          {/* Preview */}
          {signaturePNG && (
            <div className="mb-8">
              <p className="text-sm font-medium text-gray-700 mb-2">Vorschau:</p>
              <img
                src={signaturePNG}
                alt="Signature Preview"
                className="max-w-xs h-auto border border-gray-300 rounded"
              />
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              onClick={submitSignature}
              variant="primary"
              size="lg"
              isLoading={isSigning}
              disabled={!signaturePNG}
              className="flex-1"
            >
              Unterschrift bestätigen & Angebot akzeptieren
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
