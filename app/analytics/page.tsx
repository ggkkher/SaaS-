'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/calculations';

interface TrendData {
  month: string;
  revenue: number;
  offerCount: number;
  signedOffers: number;
}

interface Analytics {
  trends: TrendData[];
  stats: {
    totalRevenue: number;
    totalOffers: number;
    signedOffers: number;
    conversionRate: number;
    averageOfferValue: number;
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/analytics/revenue-trends');
      setAnalytics(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden der Analysen');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Lädt...</p>
      </main>
    );
  }

  if (!analytics) {
    return (
      <main className="container mx-auto px-4 py-8">
        <p className="text-center text-red-600">{error || 'Keine Daten verfügbar'}</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📈 Analytics</h1>
        <p className="text-gray-600">Überblick über deine Geschäftsleistung</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Gesamtumsatz</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(analytics.stats.totalRevenue)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Gesamtangebote</p>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.stats.totalOffers}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Unterschrieben</p>
          <p className="text-2xl font-bold text-primary-light">
            {analytics.stats.signedOffers}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Konversionsrate</p>
          <p className="text-2xl font-bold text-primary-light">
            {analytics.stats.conversionRate}%
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Ø Angebotswert</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(analytics.stats.averageOfferValue)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Umsatz-Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#4CAF50"
                strokeWidth={2}
                name="Umsatz (€)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Offer Count */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Angebote pro Monat</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="offerCount" fill="#3B82F6" name="Gesamt-Angebote" />
              <Bar dataKey="signedOffers" fill="#10B981" name="Unterschrieben" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table View */}
      <div className="bg-white rounded-lg shadow mt-8 overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Monatliche Details</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Monat</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-900">Umsatz</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-900">
                  Angebote
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-900">
                  Unterschrieben
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-900">
                  Konversion
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {analytics.trends.map((month) => (
                <tr key={month.month} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{month.month}</td>
                  <td className="px-6 py-4 text-right text-gray-900">
                    {formatCurrency(month.revenue)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900">
                    {month.offerCount}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900">
                    {month.signedOffers}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900">
                    {month.offerCount > 0
                      ? Math.round((month.signedOffers / month.offerCount) * 100)
                      : 0}
                    %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
