'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { formatCurrency, calculateOfferTotals } from '@/lib/calculations';
import { Trash2, Plus, Edit2 } from 'lucide-react';

interface Position {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  hours?: number;
  hourlyRate?: number;
  totalNet: number;
  order: number;
}

interface Offer {
  id: string;
  clientName: string;
  clientEmail?: string;
  status: string;
  subtotalNet: number;
  taxAmount: number;
  totalGross: number;
  validUntil: string;
  positions: Position[];
}

export default function OfferDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPositionForm, setShowPositionForm] = useState(false);
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [positionForm, setPositionForm] = useState({
    name: '',
    description: '',
    quantity: '1',
    unit: 'm²',
    unitPrice: '',
    hours: '',
    hourlyRate: '',
  });

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

  const handleAddPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!positionForm.name.trim()) {
      setError('Positionsname erforderlich');
      return;
    }

    if (!positionForm.unitPrice && !positionForm.hours) {
      setError('Einheitspreis oder Stunden erforderlich');
      return;
    }

    try {
      setIsSaving(true);

      if (editingPositionId) {
        await axios.patch(
          `/api/offers/${params.id}/positions/${editingPositionId}`,
          positionForm
        );
      } else {
        await axios.post(`/api/offers/${params.id}/positions`, positionForm);
      }

      setPositionForm({
        name: '',
        description: '',
        quantity: '1',
        unit: 'm²',
        unitPrice: '',
        hours: '',
        hourlyRate: '',
      });
      setEditingPositionId(null);
      setShowPositionForm(false);
      await fetchOffer();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Speichern der Position');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePosition = async (positionId: string) => {
    if (!confirm('Position löschen?')) return;

    try {
      await axios.delete(
        `/api/offers/${params.id}/positions/${positionId}`
      );
      await fetchOffer();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Löschung fehlgeschlagen');
    }
  };

  const handleEditPosition = (position: Position) => {
    setPositionForm({
      name: position.name,
      description: position.description,
      quantity: position.quantity.toString(),
      unit: position.unit,
      unitPrice: position.unitPrice.toString(),
      hours: position.hours?.toString() || '',
      hourlyRate: position.hourlyRate?.toString() || '',
    });
    setEditingPositionId(position.id);
    setShowPositionForm(true);
  };

  const calculateTotals = () => {
    if (!offer) return { subtotalNet: 0, taxAmount: 0, totalGross: 0 };

    const positions = offer.positions.map((p) => ({
      ...p,
      totalNet: p.unitPrice * p.quantity,
    }));

    return calculateOfferTotals(positions, 0.19);
  };

  const totals = calculateTotals();

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Lädt...</p>
      </main>
    );
  }

  if (!offer) {
    return (
      <main className="container mx-auto px-4 py-8">
        <p className="text-center text-red-600">Angebot nicht gefunden</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-8 mb-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Angebot für {offer.clientName}
              </h1>
              {offer.clientEmail && (
                <p className="text-gray-600">{offer.clientEmail}</p>
              )}
            </div>

            {/* Positions Table */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Positionen
              </h2>

              {offer.positions.length === 0 ? (
                <p className="text-gray-600 mb-4">Keine Positionen hinzugefügt</p>
              ) : (
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left">Position</th>
                        <th className="px-4 py-2 text-right">Menge</th>
                        <th className="px-4 py-2 text-right">Einheitspreis</th>
                        <th className="px-4 py-2 text-right">Gesamt (Netto)</th>
                        <th className="px-4 py-2 text-right">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offer.positions.map((position) => (
                        <tr key={position.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{position.name}</p>
                              {position.description && (
                                <p className="text-xs text-gray-500">
                                  {position.description}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {position.quantity} {position.unit}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(position.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {formatCurrency(position.totalNet)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleEditPosition(position)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePosition(position.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
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

              {/* Position Form */}
              {showPositionForm && (
                <form onSubmit={handleAddPosition} className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold mb-4">
                    {editingPositionId ? 'Position bearbeiten' : 'Neue Position'}
                  </h3>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Input
                      label="Position"
                      placeholder="z.B. Rasenanlage"
                      value={positionForm.name}
                      onChange={(e) =>
                        setPositionForm({ ...positionForm, name: e.target.value })
                      }
                    />
                    <Input
                      label="Menge"
                      type="number"
                      step="0.1"
                      value={positionForm.quantity}
                      onChange={(e) =>
                        setPositionForm({
                          ...positionForm,
                          quantity: e.target.value,
                        })
                      }
                    />
                  </div>

                  <Input
                    label="Beschreibung"
                    placeholder="z.B. Ansaat und Düngung"
                    value={positionForm.description}
                    onChange={(e) =>
                      setPositionForm({
                        ...positionForm,
                        description: e.target.value,
                      })
                    }
                  />

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Input
                      label="Einheit"
                      placeholder="m², h, Stück"
                      value={positionForm.unit}
                      onChange={(e) =>
                        setPositionForm({ ...positionForm, unit: e.target.value })
                      }
                    />
                    <Input
                      label="Einheitspreis (€)"
                      type="number"
                      step="0.01"
                      value={positionForm.unitPrice}
                      onChange={(e) =>
                        setPositionForm({
                          ...positionForm,
                          unitPrice: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" variant="primary" size="md" isLoading={isSaving}>
                      {editingPositionId ? 'Speichern' : 'Hinzufügen'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => {
                        setShowPositionForm(false);
                        setEditingPositionId(null);
                        setPositionForm({
                          name: '',
                          description: '',
                          quantity: '1',
                          unit: 'm²',
                          unitPrice: '',
                          hours: '',
                          hourlyRate: '',
                        });
                      }}
                    >
                      Abbrechen
                    </Button>
                  </div>
                </form>
              )}

              {!showPositionForm && (
                <Button
                  onClick={() => setShowPositionForm(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" /> Position hinzufügen
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-24">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Zusammenfassung
            </h3>

            <div className="space-y-3 border-b pb-4 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Netto:</span>
                <span className="font-semibold">{formatCurrency(totals.subtotalNet)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">MwSt (19%):</span>
                <span className="font-semibold">{formatCurrency(totals.taxAmount)}</span>
              </div>
            </div>

            <div className="flex justify-between mb-6">
              <span className="text-lg font-bold">Brutto:</span>
              <span className="text-2xl font-bold text-primary-light">
                {formatCurrency(totals.totalGross)}
              </span>
            </div>

            <div className="text-sm text-gray-600 mb-6">
              <p>Gültig bis: {new Date(offer.validUntil).toLocaleDateString('de-DE')}</p>
              <p>Status: {offer.status}</p>
            </div>

            <Button variant="primary" size="lg" className="w-full mb-3">
              Als PDF exportieren
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
