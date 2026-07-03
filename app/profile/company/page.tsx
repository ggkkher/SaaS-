'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import FileUpload from '@/components/ui/FileUpload';
import { useAuthStore } from '@/lib/store';

interface CompanyFormData {
  name: string;
  hourlyRate: string;
  profitMargin: string;
  materialCost: string;
  fixedCosts: string;
  taxRate: string;
}

export default function CompanySetupPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [logo, setLogo] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    hourlyRate: '50',
    profitMargin: '20',
    materialCost: '0',
    fixedCosts: '2000',
    taxRate: '0.19',
  });

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const response = await axios.get('/api/company/setup');
        const company = response.data.company;

        setFormData({
          name: company.name,
          hourlyRate: company.hourlyRate.toString(),
          profitMargin: company.profitMargin.toString(),
          materialCost: company.materialCost.toString(),
          fixedCosts: company.fixedCosts.toString(),
          taxRate: company.taxRate.toString(),
        });

        if (company.logoUrl) {
          setLogoPreview(company.logoUrl);
          setLogo(company.logoUrl);
        }
      } catch (err) {
        // Company doesn't exist yet, that's okay for new users
      }
    };

    fetchCompany();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileSelect = (_file: File | null, base64: string | null) => {
    if (base64) {
      setLogo(base64);
      setLogoPreview(base64);
    } else {
      setLogo(null);
      setLogoPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!formData.name.trim()) {
        throw new Error('Firmenname ist erforderlich');
      }

      const response = await axios.post('/api/company/setup', {
        ...formData,
        logo,
      });

      setUser({
        ...user!,
        company: {
          id: response.data.company.id,
          name: response.data.company.name,
          logoUrl: response.data.company.logoUrl,
        },
      });

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Fehler beim Speichern');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Unternehmensprofil
        </h1>
        <p className="text-gray-600 mb-8">
          Richten Sie Ihre Unternehmensdaten und Preismodell ein
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Logo Upload */}
          <FileUpload
            label="Firmenlogo"
            accept="image/*"
            maxSize={5}
            onFileSelect={handleFileSelect}
            preview={logoPreview || undefined}
          />

          {/* Company Name */}
          <Input
            label="Firmenname"
            name="name"
            type="text"
            placeholder="z.B. Grün & Gestalt GmbH"
            value={formData.name}
            onChange={handleInputChange}
            required
          />

          {/* Pricing Section */}
          <div className="border-t border-gray-200 pt-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Preismodell
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Stundensatz (€)"
                name="hourlyRate"
                type="number"
                step="0.01"
                placeholder="50"
                value={formData.hourlyRate}
                onChange={handleInputChange}
                required
              />

              <Input
                label="Gewinnmarge (%)"
                name="profitMargin"
                type="number"
                step="0.1"
                placeholder="20"
                value={formData.profitMargin}
                onChange={handleInputChange}
                required
              />

              <Input
                label="Materialkosten (€)"
                name="materialCost"
                type="number"
                step="0.01"
                placeholder="0"
                value={formData.materialCost}
                onChange={handleInputChange}
              />

              <Input
                label="Fixkosten pro Monat (€)"
                name="fixedCosts"
                type="number"
                step="0.01"
                placeholder="2000"
                value={formData.fixedCosts}
                onChange={handleInputChange}
              />

              <Input
                label="Mehrwertsteuersatz"
                name="taxRate"
                type="number"
                step="0.01"
                min="0"
                max="1"
                placeholder="0.19"
                value={formData.taxRate}
                onChange={handleInputChange}
              />
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Hinweis:</strong> Diese Einstellungen werden zur automatischen Preisberechnung in Angeboten verwendet.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="flex-1"
            >
              Speichern & Weiter
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
