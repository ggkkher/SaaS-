'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, MailOpen, MailCheck } from 'lucide-react';

interface EmailTrackingData {
  hasTracking: boolean;
  latestTracking: {
    email: string;
    sentAt: string;
    openedAt: string | null;
    linkClicks: number;
  } | null;
}

interface EmailTrackingStatusProps {
  offerId: string;
}

export default function EmailTrackingStatus({
  offerId,
}: EmailTrackingStatusProps) {
  const [tracking, setTracking] = useState<EmailTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrackingStatus();
  }, [offerId]);

  const fetchTrackingStatus = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/offers/${offerId}/email-tracking`);
      setTracking(response.data);
    } catch (error) {
      console.error('Failed to fetch tracking status:', error);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !tracking?.hasTracking) {
    return null;
  }

  const { latestTracking } = tracking;

  if (!latestTracking) {
    return null;
  }

  const sentDate = new Date(latestTracking.sentAt).toLocaleString('de-DE');
  const openedDate = latestTracking.openedAt
    ? new Date(latestTracking.openedAt).toLocaleString('de-DE')
    : null;

  return (
    <div className="bg-white rounded-lg shadow p-4 mt-4">
      <div className="flex items-start gap-3">
        {latestTracking.openedAt ? (
          <MailOpen className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
        ) : (
          <Mail className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Email-Status</h3>
          <p className="text-sm text-gray-600 mt-1">
            📧 Gesendet an: {latestTracking.email}
          </p>
          <p className="text-sm text-gray-600">
            📤 Versendungszeit: {sentDate}
          </p>
          {latestTracking.openedAt ? (
            <>
              <p className="text-sm text-green-700 font-medium mt-2 flex items-center gap-1">
                <MailCheck className="w-4 h-4" />
                Geöffnet am: {openedDate}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500 mt-2">
              Email noch nicht geöffnet
            </p>
          )}
          {latestTracking.linkClicks > 0 && (
            <p className="text-sm text-blue-700 mt-2">
              🔗 {latestTracking.linkClicks} Link-Klicks
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
