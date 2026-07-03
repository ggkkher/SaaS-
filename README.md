# Angebotssoftware für Garten & Landschaftsbau

Eine moderne SaaS-Plattform für Garten- und Landschaftsbauer zur automatisierten Erstellung, Kalkulation und Verwaltung von professionellen Angeboten und Nachträgen.

## Features

✅ **Angebotserstellung** - Text-Input und Spracheingabe (Deutsch)  
✅ **AI-basierte Kalkulation** - Automatische Preisberechnung  
✅ **Nachträge** - Schnelle Zusatzpositionen auf der Baustelle  
✅ **Digitale Signatur** - Sichere PDF-Unterzeichnung  
✅ **Logo-Branding** - Kundenspezifisches Design  
✅ **Stripe Integration** - Abo-Zahlungen

## Tech-Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js
- **Payments**: Stripe API
- **AI**: OpenAI API (Spracheingabe & Kalkulation)
- **PDF**: PDFKit
- **Email**: Resend

## Getting Started

### Voraussetzungen

- Node.js 18+
- PostgreSQL 14+
- Stripe Account
- OpenAI API Key

### Installation

1. Dependencies installieren:
```bash
npm install
```

2. Umgebungsvariablen einrichten:
```bash
cp .env.example .env.local
# .env.local mit deinen Werten füllen
```

3. Datenbank initialisieren:
```bash
npm run db:push
```

4. Entwicklungsserver starten:
```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser.

## Projektstruktur

```
├── app/                 # Next.js App Router
├── components/          # React Komponenten
├── lib/                 # Utility-Funktionen
├── prisma/              # Datenbank Schema & Migrations
├── public/              # Statische Assets
├── styles/              # Global Styles
└── ...
```

## Abo-Modell

- **Kostenlos**: 5 Angebote/Monat
- **Pro (€50)**: 40 Angebote/Monat

## Roadmap

- [ ] Phase 1: MVP (Auth, Angebote, Nachträge, PDF, Signatur)
- [ ] Phase 2: Spracheingabe, Mobile-Optimierung
- [ ] Phase 3: AI-Features
- [ ] Phase 4: Advanced Features

## Lizenz

MIT
