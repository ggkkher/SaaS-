'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuthStore } from '@/lib/store';
import Button from '@/components/ui/Button';
import { Menu, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center text-white font-bold">
              🌿
            </div>
            <span className="font-bold text-gray-900">Angebote</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-gray-700 hover:text-primary-light transition">
              Dashboard
            </Link>
            <Link href="/offers" className="text-gray-700 hover:text-primary-light transition">
              Angebote
            </Link>
            <Link href="/profile/company" className="text-gray-700 hover:text-primary-light transition">
              Profil
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Abmelden</span>
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-gray-50">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              <Link
                href="/dashboard"
                className="py-2 px-4 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Dashboard
              </Link>
              <Link
                href="/offers"
                className="py-2 px-4 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Angebote
              </Link>
              <Link
                href="/profile/company"
                className="py-2 px-4 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Profil
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      {children}
    </div>
  );
}
