'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });

      setUser({
        id: response.data.user.id,
        email: response.data.user.email,
        company: response.data.user.company,
      });

      router.push(response.data.user.company ? '/dashboard' : '/profile/company');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Anmeldung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-light to-primary-dark flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Anmelden
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="E-Mail-Adresse"
            type="email"
            placeholder="dein@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Passwort"
            type="password"
            placeholder="Dein Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full mb-4"
          >
            Anmelden
          </Button>
        </form>

        <div className="text-center">
          <p className="text-gray-600">
            Noch kein Konto?{' '}
            <Link href="/register" className="text-primary-light hover:text-primary-dark font-semibold">
              Hier registrieren
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
