'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function NewOfferPage() {
  const router = useRouter();
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!clientName.trim()) {
        throw new Error('Kundennamen erforderlich');
      }

      const response = await axios.post('/api/offers', {
        clientName,
        clientEmail: clientEmail || null,
      });

      router.push(`/offers/${response.data.offer.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Fehler beim Erstellen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Neues Angebot erstellen
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Kundennamen"
            type="text"
            placeholder="z.B. Max Mustermann"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
          />

          <Input
            label="E-Mail-Adresse (optional)"
            type="email"
            placeholder="kunde@email.com"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
          />

          <div className="flex gap-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="flex-1"
            >
              Angebot erstellen
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.back()}
              className="flex-1"
            >
              Abbrechen
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
