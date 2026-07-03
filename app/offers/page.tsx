'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import Button from '@/components/ui/Button';
import { Trash2, Eye } from 'lucide-react';
import { formatCurrency, calculateDays } from '@/lib/calculations';

interface Offer {
  id: string;
  clientName: string;
  clientEmail?: string;
  subtotalNet: number;
  totalGross: number;
  status: string;
  createdAt: string;
  validUntil: string;
  parentOfferId?: string;
  amendmentNumber?: number;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/offers');
      setOffers(response.data.offers);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden der Angebote');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sind Sie sicher, dass Sie dieses Angebot löschen möchten?')) {
      return;
    }

    try {
      await axios.delete(`/api/offers/${id}`);
      setOffers(offers.filter((o) => o.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Löschung fehlgeschlagen');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      signed: 'bg-green-100 text-green-800',
      accepted: 'bg-primary-light text-white',
    };

    const labels: Record<string, string> = {
      draft: 'Entwurf',
      sent: 'Gesendet',
      signed: 'Unterzeichnet',
      accepted: 'Akzeptiert',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || colors.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Lädt...</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Angebote</h1>
          <p className="text-gray-600">
            {offers.length} Angebot{offers.length !== 1 ? 'e' : ''} insgesamt
          </p>
        </div>
        <Link href="/offers/new">
          <Button variant="primary" size="lg">
            ➕ Neues Angebot
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {offers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 mb-4">Noch keine Angebote erstellt</p>
          <Link href="/offers/new">
            <Button variant="primary">Erstes Angebot erstellen</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Kunde
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Betrag
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Gültig bis
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {offers.map((offer) => (
                <tr key={offer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {offer.amendmentNumber && offer.parentOfferId ? (
                          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                            📋 {offer.amendmentNumber}. Nachtrag
                          </span>
                        ) : null}
                        {offer.clientName}
                      </p>
                      {offer.clientEmail && (
                        <p className="text-sm text-gray-600">{offer.clientEmail}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(offer.totalGross)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(offer.status)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">
                      {new Date(offer.validUntil).toLocaleDateString('de-DE')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {calculateDays(new Date(offer.validUntil))} Tage gültig
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/offers/${offer.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <button
                        onClick={() => handleDelete(offer.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
