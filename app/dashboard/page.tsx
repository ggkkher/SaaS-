'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks';
import Button from '@/components/ui/Button';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Lädt...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Willkommen, {user?.company?.name || 'Garten & Landschaftsbauer'}!
          </h1>
          <p className="text-gray-600">
            Verwalten Sie Ihre Angebote und Nachträge
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">📄 Angebote</h2>
            <p className="text-gray-600 mb-4">
              Erstellen und verwalten Sie professionelle Angebote
            </p>
            <Link href="/offers/new">
              <Button variant="primary" size="md">
                Neues Angebot
              </Button>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">⚙️ Einstellungen</h2>
            <p className="text-gray-600 mb-4">
              Aktualisieren Sie Ihr Unternehmensprofil und Preismodell
            </p>
            <Link href="/profile/company">
              <Button variant="outline" size="md">
                Profil bearbeiten
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm">Angebote diesen Monat</p>
            <p className="text-3xl font-bold text-primary-light">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm">Unterzeichnet</p>
            <p className="text-3xl font-bold text-primary-dark">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm">Abgelaufen</p>
            <p className="text-3xl font-bold text-gray-400">0</p>
          </div>
        </div>
      </div>
    </main>
  );
}
