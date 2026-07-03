'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import AudioInput from '@/components/ui/AudioInput';
import { formatCurrency, calculateOfferTotals } from '@/lib/calculations';
import { getPortalUrl } from '@/lib/share-tokens';
import { Trash2, Plus, Edit2, X, Copy, Check } from 'lucide-react';

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

interface PositionTemplate {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  hours?: number;
  hourlyRate?: number;
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
  parentOfferId?: string;
  amendmentType?: string;
  amendmentNumber?: number;
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
  const [amendments, setAmendments] = useState<Offer[]>([]);
  const [isCreatingAmendment, setIsCreatingAmendment] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isGettingAISuggestion, setIsGettingAISuggestion] = useState(false);
  const [aiSuggestion, setAISuggestion] = useState<{
    suggestedPrice: number;
    reasoning: string;
  } | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [positionTemplates, setPositionTemplates] = useState<PositionTemplate[]>([]);

  useEffect(() => {
    fetchOffer();
    fetchPositionTemplates();
  }, []);

  const fetchOffer = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/offers/${params.id}`);
      setOffer(response.data.offer);

      // Fetch amendments if this is not a nachtrag
      if (!response.data.offer.parentOfferId) {
        fetchAmendments();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Angebot konnte nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAmendments = async () => {
    try {
      const response = await axios.get(`/api/offers/${params.id}/amendments`);
      setAmendments(response.data.amendments);
    } catch (err: any) {
      console.error('Error fetching amendments:', err);
    }
  };

  const fetchPositionTemplates = async () => {
    try {
      const response = await axios.get('/api/position-templates');
      setPositionTemplates(response.data.templates);
    } catch (err: any) {
      console.error('Error fetching position templates:', err);
    }
  };

  const handleAddTemplatePosition = async (template: PositionTemplate) => {
    try {
      setIsSaving(true);
      await axios.post(`/api/offers/${params.id}/positions`, {
        name: template.name,
        description: template.description,
        quantity: template.quantity,
        unit: template.unit,
        unitPrice: template.unitPrice || '',
        hours: template.hours || '',
        hourlyRate: template.hourlyRate || '',
      });
      await fetchOffer();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Hinzufügen der Position');
    } finally {
      setIsSaving(false);
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

  const handleCreateAmendment = async () => {
    if (!offer || offer.parentOfferId || offer.amendmentType === 'amendment') {
      setError('Nachträge können nur für Angebote ohne Parent erstellt werden');
      return;
    }

    try {
      setIsCreatingAmendment(true);
      const response = await axios.post(`/api/offers/${params.id}/amendments`);
      router.push(`/offers/${response.data.amendment.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Nachtrag konnte nicht erstellt werden');
      setIsCreatingAmendment(false);
    }
  };

  const handleSendEmail = async () => {
    if (!offer || !offer.clientEmail) {
      setError('Keine E-Mail-Adresse für den Kunden vorhanden');
      return;
    }

    try {
      setIsSendingEmail(true);
      await axios.post(`/api/offers/${params.id}/send-email`);
      setError('');
      alert('E-Mail erfolgreich versendet!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'E-Mail konnte nicht versendet werden');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleGenerateShareToken = async () => {
    try {
      setIsGenerating(true);
      const response = await axios.post(`/api/offers/${params.id}/share-token`);
      setShareToken(response.data.token);
      setShowShareModal(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Generieren des Share-Links');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!shareToken) return;
    const portalUrl = `${window.location.origin}${getPortalUrl(shareToken, params.id)}`;
    navigator.clipboard.writeText(portalUrl);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };

  const getAISuggestion = async () => {
    if (!positionForm.name) {
      setError('Bitte geben Sie zuerst einen Positionsnamen ein');
      return;
    }

    try {
      setIsGettingAISuggestion(true);
      const response = await axios.post('/api/ai/suggest-price', {
        name: positionForm.name,
        description: positionForm.description,
        quantity: positionForm.quantity,
        unit: positionForm.unit,
        hourlyRate: positionForm.hourlyRate,
        hours: positionForm.hours,
      });

      setAISuggestion(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'AI-Vorschlag konnte nicht berechnet werden');
    } finally {
      setIsGettingAISuggestion(false);
    }
  };

  const applyAISuggestion = () => {
    if (aiSuggestion) {
      setPositionForm({
        ...positionForm,
        unitPrice: aiSuggestion.suggestedPrice.toFixed(2),
      });
      setAISuggestion(null);
    }
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
              {offer.parentOfferId && offer.amendmentNumber && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>📋 {offer.amendmentNumber}. Nachtrag</strong> zu Angebot{' '}
                    <button
                      onClick={() => router.push(`/offers/${offer.parentOfferId}`)}
                      className="text-blue-600 hover:underline"
                    >
                      #{offer.parentOfferId.substring(0, 8).toUpperCase()}
                    </button>
                  </p>
                </div>
              )}

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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Position
                      </label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="z.B. Rasenanlage"
                          value={positionForm.name}
                          onChange={(e) =>
                            setPositionForm({ ...positionForm, name: e.target.value })
                          }
                          className="flex-1"
                        />
                        <AudioInput
                          onTranscribe={(text) =>
                            setPositionForm({ ...positionForm, name: text })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Menge
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          value={positionForm.quantity}
                          onChange={(e) =>
                            setPositionForm({
                              ...positionForm,
                              quantity: e.target.value,
                            })
                          }
                          className="flex-1"
                        />
                        <AudioInput
                          onTranscribe={(text) => {
                            const num = parseFloat(text.replace(/,/g, '.'));
                            if (!isNaN(num)) {
                              setPositionForm({
                                ...positionForm,
                                quantity: num.toString(),
                              });
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beschreibung
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="z.B. Ansaat und Düngung"
                        value={positionForm.description}
                        onChange={(e) =>
                          setPositionForm({
                            ...positionForm,
                            description: e.target.value,
                          })
                        }
                        className="flex-1"
                      />
                      <AudioInput
                        onTranscribe={(text) =>
                          setPositionForm({
                            ...positionForm,
                            description: text,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Einheit
                      </label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="m², h, Stück"
                          value={positionForm.unit}
                          onChange={(e) =>
                            setPositionForm({ ...positionForm, unit: e.target.value })
                          }
                          className="flex-1"
                        />
                        <AudioInput
                          onTranscribe={(text) =>
                            setPositionForm({ ...positionForm, unit: text })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Einheitspreis (€)
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={positionForm.unitPrice}
                          onChange={(e) =>
                            setPositionForm({
                              ...positionForm,
                              unitPrice: e.target.value,
                            })
                          }
                          className="flex-1"
                        />
                        <AudioInput
                          onTranscribe={(text) => {
                            const num = parseFloat(text.replace(/,/g, '.'));
                            if (!isNaN(num)) {
                              setPositionForm({
                                ...positionForm,
                                unitPrice: num.toString(),
                              });
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={getAISuggestion}
                          isLoading={isGettingAISuggestion}
                          title="AI-Preisvorschlag basierend auf Position und Firma Kosten"
                        >
                          💡 AI
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* AI Suggestion */}
                  {aiSuggestion && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-sm font-semibold text-blue-900 mb-2">
                        💡 AI Preisvorschlag
                      </p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-700">
                          Empfohlener Preis: € {aiSuggestion.suggestedPrice.toFixed(2)}
                        </span>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={applyAISuggestion}
                        >
                          ✓ Übernehmen
                        </Button>
                      </div>
                      <p className="text-xs text-blue-600">
                        {aiSuggestion.reasoning}
                      </p>
                    </div>
                  )}

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

              {/* Quick Positions */}
              {positionTemplates.length > 0 && !showPositionForm && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-semibold text-green-900 mb-3">
                    ⚡ Schnell-Positionen (Vorlagen)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {positionTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleAddTemplatePosition(template)}
                        disabled={isSaving}
                        className="px-3 py-2 bg-green-100 hover:bg-green-200 disabled:bg-gray-100 text-green-900 text-sm font-medium rounded-lg transition"
                        title={template.description}
                      >
                        + {template.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-green-700 mt-2">
                    💡 <Link href="/position-templates" className="underline">Verwalte deine Vorlagen</Link>
                  </p>
                </div>
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

            {/* Amendments Section */}
            {!offer.parentOfferId && (
              <div className="border-t pt-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Nachträge ({amendments.length})
                  </h2>
                  <Button
                    onClick={handleCreateAmendment}
                    variant="primary"
                    size="sm"
                    isLoading={isCreatingAmendment}
                  >
                    ➕ Nachtrag hinzufügen
                  </Button>
                </div>

                {amendments.length === 0 ? (
                  <p className="text-gray-600">Noch keine Nachträge erstellt</p>
                ) : (
                  <div className="space-y-2">
                    {amendments.map((amendment) => (
                      <div
                        key={amendment.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {amendment.amendmentNumber}. Nachtrag
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(amendment.totalGross)} • Status: {amendment.status}
                          </p>
                        </div>
                        <Link href={`/offers/${amendment.id}`}>
                          <Button variant="outline" size="sm">
                            Öffnen
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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

            <Button
              onClick={() => window.open(`/api/offers/${offer.id}/pdf`, '_blank')}
              variant="primary"
              size="lg"
              className="w-full mb-3"
            >
              📥 PDF herunterladen
            </Button>

            <Button
              onClick={() => window.open(`/offers/${offer.id}/sign`, '_blank')}
              variant="outline"
              size="lg"
              className="w-full mb-3"
            >
              ✍️ Unterschrifts-Link
            </Button>

            <Button
              onClick={handleSendEmail}
              variant="primary"
              size="lg"
              className="w-full mb-3 bg-blue-600 hover:bg-blue-700"
              isLoading={isSendingEmail}
              disabled={!offer.clientEmail}
            >
              📧 Per Email versenden
            </Button>

            <Button
              onClick={handleGenerateShareToken}
              variant="secondary"
              size="lg"
              className="w-full mb-3"
              disabled={isGenerating}
            >
              {isGenerating ? '⏳ Generiert...' : '📤 Teilen'}
            </Button>

            {!offer.clientEmail && (
              <p className="text-sm text-gray-500 text-center">
                Bitte Kunden-Email hinzufügen
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && shareToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Angebot teilen</h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Kunden können das Angebot über diesen Link online ansehen und unterschreiben:
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${getPortalUrl(shareToken, params.id)}`}
                    className="flex-1 text-sm bg-white border border-gray-300 rounded px-3 py-2 font-mono text-gray-700"
                  />
                  <button
                    onClick={handleCopyToClipboard}
                    className="p-2 text-gray-600 hover:bg-white rounded transition"
                  >
                    {copiedToClipboard ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>💡 Tipp:</strong> Dieser Link wird automatisch in der E-Mail hinzugefügt, wenn Sie das Angebot versenden.
                </p>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  QR-Code für Handy-Zugriff:
                </h3>
                <div className="flex justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}${getPortalUrl(shareToken, params.id)}`)}`}
                    alt="QR Code"
                    className="w-40 h-40 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <button
                onClick={() => setShowShareModal(false)}
                className="w-full bg-primary-light text-white py-2 rounded-lg hover:bg-primary-dark transition"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
