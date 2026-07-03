'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Link from 'next/link';

interface Position {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalNet: number;
}

interface Offer {
  id: string;
  clientName: string;
  clientEmail?: string;
  status: string;
  signatureUrl?: string;
  totalGross: number;
  subtotalNet: number;
  taxAmount: number;
  signedAt?: string;
  createdAt: string;
  positions: Position[];
  company: { name: string; logoUrl?: string };
}

export default function PortalOfferDetailPage({
  params,
}: {
  params: { shareToken: string; offerId: string };
}) {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [signaturePNG, setSignaturePNG] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [showSignatureForm, setShowSignatureForm] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchOffer();
  }, [params.shareToken, params.offerId]);

  const fetchOffer = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `/api/portal/${params.shareToken}/offers/${params.offerId}`
      );
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
  };

  const submitSignature = async () => {
    if (!signaturePNG) {
      alert('Bitte unterschreiben Sie zuerst');
      return;
    }

    if (!offer) return;

    try {
      setIsSigning(true);
      await axios.post(
        `/api/portal/${params.shareToken}/offers/${params.offerId}/sign`,
        { signatureUrl: signaturePNG }
      );

      alert(
        'Unterschrift erfolgreich gespeichert! Vielen Dank für Ihre Unterschrift.'
      );
      fetchOffer();
      setShowSignatureForm(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Fehler beim Speichern der Unterschrift');
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
          <p className="text-red-600 font-medium mb-2">Fehler</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Angebot nicht gefunden</p>
      </div>
    );
  }

  const isSigned = offer.status === 'signed' || offer.signatureUrl;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/portal/${params.shareToken}`}>
            <button className="text-emerald-600 hover:text-emerald-700 font-medium mb-4">
              ← Zurück zur Übersicht
            </button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Angebot für {offer.clientName}
              </h1>
              <p className="text-gray-600">
                von {offer.company.name}
              </p>
            </div>
            {isSigned && (
              <div className="text-right">
                <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
                  ✓ Unterzeichnet
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Offer Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-600">Erstellt</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(offer.createdAt).toLocaleDateString('de-DE')}
              </p>
            </div>
            {offer.signedAt && (
              <div>
                <p className="text-sm text-gray-600">Unterzeichnet</p>
                <p className="text-lg font-semibold text-green-600">
                  {new Date(offer.signedAt).toLocaleDateString('de-DE')}
                </p>
              </div>
            )}
          </div>

          {/* Positions Table */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Positionen</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Position
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      Menge
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      Einheitspreis
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      Gesamt
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {offer.positions.map((pos) => (
                    <tr key={pos.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{pos.name}</p>
                        <p className="text-sm text-gray-600">{pos.description}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {pos.quantity} {pos.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        €{pos.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        €{pos.totalNet.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="border-t border-gray-200 pt-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="text-gray-600">Netto</p>
                <p className="font-semibold text-gray-900">
                  €{offer.subtotalNet.toFixed(2)}
                </p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-600">MwSt (19%)</p>
                <p className="font-semibold text-gray-900">
                  €{offer.taxAmount.toFixed(2)}
                </p>
              </div>
              <div className="flex justify-between text-lg mt-4 pt-4 border-t border-gray-200">
                <p className="font-bold text-gray-900">Gesamt</p>
                <p className="font-bold text-emerald-600">
                  €{offer.totalGross.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Section */}
        {!isSigned ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🖊️ Unterschrift erforderlich
            </h3>
            <p className="text-gray-600 mb-6">
              Bitte unterschreiben Sie dieses Angebot, um es zu akzeptieren.
            </p>

            {!showSignatureForm ? (
              <Button onClick={() => setShowSignatureForm(true)} variant="primary">
                Unterschreiben
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Ihre Unterschrift
                  </label>
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={150}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full border border-gray-300 rounded-lg bg-white cursor-crosshair"
                  />
                </div>

                {signaturePNG && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Vorschau:</p>
                    <img
                      src={signaturePNG}
                      alt="Signature preview"
                      className="max-w-xs border border-gray-300 rounded"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={saveSignature}
                    variant="secondary"
                    size="sm"
                  >
                    Speichern
                  </Button>
                  <Button
                    onClick={clearSignature}
                    variant="outline"
                    size="sm"
                  >
                    Löschen
                  </Button>
                </div>

                {signaturePNG && (
                  <Button
                    onClick={submitSignature}
                    variant="primary"
                    size="sm"
                    disabled={isSigning}
                  >
                    {isSigning ? 'Speichert...' : 'Unterschrift einreichen'}
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="text-center">
              <div className="text-4xl mb-2">✓</div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Danke für Ihre Unterschrift!
              </h3>
              <p className="text-green-700">
                Dieses Angebot wurde unterzeichnet und akzeptiert.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <a href={`/api/offers/${offer.id}/pdf`} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary">
              📄 PDF herunterladen
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
