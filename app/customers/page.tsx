'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Trash2, Edit2, Mail, Phone } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  tags: string;
  offerCount: number;
  lastOfferDate?: string;
  totalSpent: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    tags: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/customers');
      setCustomers(response.data.customers);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden der Kunden');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Kundenname erforderlich');
      return;
    }

    try {
      setIsSaving(true);

      if (editingId) {
        await axios.patch(`/api/customers/${editingId}`, formData);
      } else {
        await axios.post('/api/customers', formData);
      }

      setFormData({ name: '', email: '', phone: '', notes: '', tags: '' });
      setEditingId(null);
      setShowForm(false);
      setError('');
      await fetchCustomers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Kunden wirklich löschen?')) return;

    try {
      await axios.delete(`/api/customers/${id}`);
      setCustomers(customers.filter((c) => c.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Löschung fehlgeschlagen');
    }
  };

  const handleEdit = (customer: Customer) => {
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      notes: customer.notes || '',
      tags: customer.tags,
    });
    setEditingId(customer.id);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kunden</h1>
          <p className="text-gray-600">
            {customers.length} Kunde{customers.length !== 1 ? 'n' : ''}
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => {
            setFormData({ name: '', email: '', phone: '', notes: '', tags: '' });
            setEditingId(null);
            setShowForm(true);
          }}
        >
          ➕ Neuer Kunde
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
            {editingId ? 'Kunden bearbeiten' : 'Neuen Kunden hinzufügen'}
          </h2>

          <form onSubmit={handleAddCustomer}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Müller GmbH"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="mueller@example.de"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+49 123 456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="VIP, Regulär, etc."
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notizen
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="z.B. Großer Garten, regelmäßige Aufträge..."
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

      {/* Customers List */}
      {customers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 mb-4">Noch keine Kunden erstellt</p>
          <Button
            variant="primary"
            onClick={() => {
              setFormData({ name: '', email: '', phone: '', notes: '', tags: '' });
              setEditingId(null);
              setShowForm(true);
            }}
          >
            Erstes Kundenerfassen
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Kontakt
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Angebote
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                  Gesamtumsatz
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      {customer.tags && (
                        <div className="mt-2 flex gap-1 flex-wrap">
                          {customer.tags.split(',').map((tag) => (
                            <span
                              key={tag}
                              className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {customer.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{customer.offerCount}</p>
                      {customer.lastOfferDate && (
                        <p className="text-gray-500">
                          {new Date(customer.lastOfferDate).toLocaleDateString('de-DE')}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(customer.totalSpent)}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(customer)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
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
