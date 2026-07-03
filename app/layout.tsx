import type { Metadata } from 'next';
import '@/styles/globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

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
    <html lang="de" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
