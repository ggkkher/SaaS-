'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks';
import Button from '@/components/ui/Button';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchSubscriptionInfo();
  }, []);

  const fetchSubscriptionInfo = async () => {
    try {
      const response = await fetch('/api/subscription/info');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionInfo(data);
      }
    } catch (error) {
      console.error('Error fetching subscription info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_dummy',
        }),
      });
      const data = await response.json();
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      }
    } catch (error) {
      console.error('Error upgrading:', error);
    } finally {
      setUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      }
    } catch (error) {
      console.error('Error opening portal:', error);
    }
  };

  if (isLoading || loading) {
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

        {/* Subscription Banner */}
        {subscriptionInfo && (
          <div className={`rounded-lg shadow p-6 mb-12 ${
            subscriptionInfo.tier === 'pro'
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200'
              : 'bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {subscriptionInfo.tier === 'pro' ? '⭐ Pro Plan' : '📌 Kostenlos Plan'}
                </h2>
                <p className="text-gray-600 mb-3">
                  {subscriptionInfo.remainingQuota} von {subscriptionInfo.plan.offersPerMonth} Angeboten verfügbar diesen Monat
                </p>
                <div className="w-64 bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      subscriptionInfo.tier === 'pro' ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                    style={{
                      width: `${(subscriptionInfo.remainingQuota / subscriptionInfo.plan.offersPerMonth) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
              <div className="text-right">
                {subscriptionInfo.tier === 'free' && (
                  <Button
                    variant="primary"
                    onClick={handleUpgrade}
                    disabled={upgrading}
                  >
                    {upgrading ? 'Wird weitergeleitet...' : 'Zu Pro upgraden'}
                  </Button>
                )}
                {subscriptionInfo.tier === 'pro' && (
                  <Button
                    variant="outline"
                    onClick={handleManageSubscription}
                  >
                    Abonnement verwalten
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

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
            <p className="text-3xl font-bold text-primary-light">
              {subscriptionInfo?.offersCreatedThisMonth || 0}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Limit: {subscriptionInfo?.plan.offersPerMonth || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm">Plan</p>
            <p className="text-3xl font-bold text-primary-dark capitalize">
              {subscriptionInfo?.tier || 'free'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm">Verbleibend</p>
            <p className="text-3xl font-bold text-gray-400">
              {subscriptionInfo?.remainingQuota || 0}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
