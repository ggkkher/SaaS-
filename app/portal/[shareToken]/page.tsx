'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { formatCurrency } from '@/lib/calculations';
import { ArrowRight, Lock } from 'lucide-react';
import Link from 'next/link';

interface Offer {
  id: string;
  clientName: string;
  status: string;
  subtotalNet: number;
  taxAmount: number;
  totalGross: number;
  createdAt: string;
  validUntil: string;
  signatureUrl?: string;
}

interface ShareData {
  clientEmail?: string;
  offers: Offer[];
}

export default function PortalListPage({ params }: { params: { shareToken: string } }) {
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPortalData();
  }, [params.shareToken]);

  const fetchPortalData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `/api/portal/${params.shareToken}/offers`
      );
      setShareData(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          'Fehler beim Laden der Angebote'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="container mx-auto max-w-4xl py-8">
          <p className="text-center text-gray-600">Lädt...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="container mx-auto max-w-4xl py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-semibold">❌ Fehler</p>
            <p className="text-red-600 text-sm mt-2">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!shareData) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="container mx-auto max-w-4xl py-8">
          <p className="text-center text-gray-600">Keine Angebote gefunden</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🌿</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ihre Angebote
          </h1>
          <p className="text-gray-600">
            Sehen Sie sich Ihre Angebote an, unterschreiben Sie diese oder laden Sie diese herunter
          </p>
        </div>

        {/* Offers List */}
        <div className="space-y-4">
          {shareData.offers.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">Noch keine Angebote verfügbar</p>
            </div>
          ) : (
            shareData.offers.map((offer) => {
              const statusLabels: { [key: string]: string } = {
                draft: '📝 Entwurf',
                sent: '📧 Versendet',
                signed: '✅ Unterschrieben',
                accepted: '✅ Akzeptiert',
              };

              const statusColors: { [key: string]: string } = {
                draft: 'bg-gray-100 text-gray-700',
                sent: 'bg-blue-100 text-blue-700',
                signed: 'bg-green-100 text-green-700',
                accepted: 'bg-green-100 text-green-700',
              };

              return (
                <div
                  key={offer.id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Angebot #{offer.id.substring(0, 8).toUpperCase()}
                      </h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          Erstellt: {new Date(offer.createdAt).toLocaleDateString('de-DE')}
                        </p>
                        <p>
                          Gültig bis: {new Date(offer.validUntil).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium w-fit md:ml-auto ${
                          statusColors[offer.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {statusLabels[offer.status] || offer.status}
                      </span>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(offer.totalGross)}
                      </div>
                      <p className="text-xs text-gray-500">
                        Inkl. MwSt ({formatCurrency(offer.taxAmount)})
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex flex-col md:flex-row gap-2">
                    <Link
                      href={`/portal/${params.shareToken}/offers/${offer.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                    >
                      Details ansehen <ArrowRight className="w-4 h-4" />
                    </Link>
                    <a
                      href={`/api/portal/${params.shareToken}/offers/${offer.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition"
                    >
                      📥 PDF
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>
            <Lock className="w-4 h-4 inline mr-2" />
            Sicherheit: Diese Seite ist mit einem privaten Link geschützt
          </p>
        </div>
      </div>
    </main>
  );
}
