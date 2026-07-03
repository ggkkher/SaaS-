'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Button from '@/components/ui/Button';

interface Offer {
  id: string;
  clientName: string;
  status: string;
  totalGross: number;
  subtotalNet: number;
  taxAmount: number;
  signedAt?: string;
  createdAt: string;
  positions: Array<{ id: string; name: string }>;
}

export default function PortalPage({ params }: { params: { shareToken: string } }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOffers();
  }, [params.shareToken]);

  const fetchOffers = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/portal/${params.shareToken}`);
      setOffers(response.data.offers);
    } catch (err: any) {
      setError(
        err.response?.data?.error || 'Angebote konnten nicht geladen werden'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: string } = {
      draft: 'bg-gray-200 text-gray-800',
      sent: 'bg-blue-200 text-blue-800',
      signed: 'bg-green-200 text-green-800',
      accepted: 'bg-emerald-200 text-emerald-800',
    };
    return statusMap[status] || statusMap.draft;
  };

  const getStatusText = (status: string) => {
    const textMap: { [key: string]: string } = {
      draft: 'Entwurf',
      sent: 'Versendet',
      signed: 'Unterzeichnet',
      accepted: 'Akzeptiert',
    };
    return textMap[status] || status;
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

  if (offers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Keine Angebote gefunden</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ihre Angebote</h1>
          <p className="text-gray-600 mt-2">
            Übersicht aller Angebote und deren Status
          </p>
        </div>

        <div className="space-y-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {offer.clientName}
                      </h3>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                          offer.status
                        )}`}
                      >
                        {getStatusText(offer.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Erstellt:{' '}
                      {new Date(offer.createdAt).toLocaleDateString('de-DE')}
                    </p>
                    {offer.signedAt && (
                      <p className="text-sm text-green-600">
                        Unterzeichnet:{' '}
                        {new Date(offer.signedAt).toLocaleDateString('de-DE')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      €{offer.totalGross.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {offer.positions.length} Position
                      {offer.positions.length !== 1 ? 'en' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/portal/${params.shareToken}/offers/${offer.id}`}>
                    <Button variant="primary" size="sm">
                      Details ansehen
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
