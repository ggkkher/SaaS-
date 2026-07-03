'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Trash2, Edit2 } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';

interface PositionTemplate {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  hours?: number;
  hourlyRate?: number;
  createdAt: string;
}

export default function PositionTemplatesPage() {
  const [templates, setTemplates] = useState<PositionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '1',
    unit: 'm²',
    unitPrice: '',
    hours: '',
    hourlyRate: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/position-templates');
      setTemplates(response.data.templates);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden der Vorlagen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Positionsname erforderlich');
      return;
    }

    if (!formData.unitPrice && !formData.hours) {
      setError('Einheitspreis oder Stunden erforderlich');
      return;
    }

    try {
      setIsSaving(true);

      if (editingId) {
        await axios.patch(`/api/position-templates/${editingId}`, formData);
      } else {
        await axios.post('/api/position-templates', formData);
      }

      setFormData({
        name: '',
        description: '',
        quantity: '1',
        unit: 'm²',
        unitPrice: '',
        hours: '',
        hourlyRate: '',
      });
      setEditingId(null);
      setShowForm(false);
      setError('');
      await fetchTemplates();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Vorlage wirklich löschen?')) return;

    try {
      await axios.delete(`/api/position-templates/${id}`);
      setTemplates(templates.filter((t) => t.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Löschung fehlgeschlagen');
    }
  };

  const handleEdit = (template: PositionTemplate) => {
    setFormData({
      name: template.name,
      description: template.description,
      quantity: template.quantity.toString(),
      unit: template.unit,
      unitPrice: template.unitPrice?.toString() || '',
      hours: template.hours?.toString() || '',
      hourlyRate: template.hourlyRate?.toString() || '',
    });
    setEditingId(template.id);
    setShowForm(true);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Positionen-Vorlagen</h1>
          <p className="text-gray-600">
            {templates.length} Vorlage{templates.length !== 1 ? 'n' : ''}
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => {
            setFormData({
              name: '',
              description: '',
              quantity: '1',
              unit: 'm²',
              unitPrice: '',
              hours: '',
              hourlyRate: '',
            });
            setEditingId(null);
            setShowForm(true);
          }}
        >
          ➕ Neue Vorlage
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? 'Vorlage bearbeiten' : 'Neue Vorlage hinzufügen'}
          </h2>

          <form onSubmit={handleSaveTemplate}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Positionsname *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Rasenmähen"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Menge
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Einheit
                </label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="m², h, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Einheitspreis
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  placeholder="50.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stunden
                </label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  placeholder="Stunden (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stundensatz (€/h)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  placeholder="65.00"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beschreibung
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Zusätzliche Details..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={isSaving}>
                {isSaving ? 'Speichert...' : 'Speichern'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Abbrechen
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 mb-4">Noch keine Vorlagen erstellt</p>
          <Button
            variant="primary"
            onClick={() => {
              setFormData({
                name: '',
                description: '',
                quantity: '1',
                unit: 'm²',
                unitPrice: '',
                hours: '',
                hourlyRate: '',
              });
              setEditingId(null);
              setShowForm(true);
            }}
          >
            Erste Vorlage erstellen
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Positionsname
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Menge
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Preis/Satz
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{template.name}</p>
                      {template.description && (
                        <p className="text-sm text-gray-500">{template.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900">
                      {template.quantity} {template.unit}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {template.unitPrice && (
                        <p className="text-gray-900">{formatCurrency(template.unitPrice)}/{template.unit}</p>
                      )}
                      {template.hourlyRate && (
                        <p className="text-gray-900">{formatCurrency(template.hourlyRate)}/h</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
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
