'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Trash2, Copy } from 'lucide-react';

interface TemplatePosition {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  order: number;
}

interface OfferTemplate {
  id: string;
  name: string;
  description?: string;
  positions: TemplatePosition[];
  createdAt: string;
}

export default function OfferTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<OfferTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingFromTemplate, setCreatingFromTemplate] = useState<string | null>(null);

  const [createFormData, setCreateFormData] = useState({
    clientName: '',
    clientEmail: '',
    customerId: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/offer-templates');
      setTemplates(response.data.templates);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden der Templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOfferFromTemplate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createFormData.clientName.trim()) {
      setError('Kundenname erforderlich');
      return;
    }

    if (!creatingFromTemplate) {
      setError('Kein Template ausgewählt');
      return;
    }

    try {
      setError('');
      const response = await axios.post(
        `/api/offer-templates/${creatingFromTemplate}/create-offer`,
        createFormData
      );

      // Redirect to the new offer
      router.push(`/offers/${response.data.offer.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Erstellen des Angebots');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Template wirklich löschen?')) return;

    try {
      await axios.delete(`/api/offer-templates/${id}`);
      setTemplates(templates.filter((t) => t.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Löschung fehlgeschlagen');
    }
  };

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Lädt...</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Angebots-Templates</h1>
          <p className="text-gray-600">
            {templates.length} Template{templates.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => router.push('/offers/new')}
        >
          ➕ Neues Angebot
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Create Offer from Template Modal */}
      {showCreateModal && creatingFromTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Angebot erstellen</h2>

            <form onSubmit={handleCreateOfferFromTemplate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kundenname *
                </label>
                <Input
                  value={createFormData.clientName}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, clientName: e.target.value })
                  }
                  placeholder="z.B. Müller GmbH"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={createFormData.clientEmail}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, clientEmail: e.target.value })
                  }
                  placeholder="mueller@example.de"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" variant="primary" className="flex-1">
                  Erstellen
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreatingFromTemplate(null);
                    setCreateFormData({ clientName: '', clientEmail: '', customerId: '' });
                  }}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 mb-4">Noch keine Templates erstellt</p>
          <p className="text-sm text-gray-500 mb-6">
            Erstelle ein Angebot und speichere es als Template für schnelle Wiederverwendung
          </p>
          <Button
            variant="primary"
            onClick={() => router.push('/offers/new')}
          >
            Neues Angebot erstellen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                {template.description && (
                  <p className="text-sm text-gray-600">{template.description}</p>
                )}
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  {template.positions.length} Position{template.positions.length !== 1 ? 'en' : ''}
                </p>
                <ul className="space-y-1">
                  {template.positions.slice(0, 3).map((pos) => (
                    <li key={pos.id} className="text-xs text-gray-600">
                      • {pos.name} ({pos.quantity} {pos.unit})
                    </li>
                  ))}
                  {template.positions.length > 3 && (
                    <li className="text-xs text-gray-500">... und {template.positions.length - 3} mehr</li>
                  )}
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCreatingFromTemplate(template.id);
                    setShowCreateModal(true);
                  }}
                  className="flex-1 px-4 py-2 bg-primary-light hover:bg-primary-dark text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" /> Verwenden
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
