import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Angebotssoftware - Garten & Landschaftsbau',
  description: 'Professionelle Angebotserstellung für Garten- und Landschaftsbauer mit AI-Kalkulation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
