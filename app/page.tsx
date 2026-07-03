import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-light to-primary-dark">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-6">
            Angebotssoftware für Garten & Landschaftsbau
          </h1>
          <p className="text-xl mb-8 opacity-90">
            Erstellen Sie professionelle Angebote in Sekunden mit AI-Kalkulation
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="bg-white text-primary-dark px-8 py-3 rounded-lg font-semibold hover:bg-primary-gray transition"
            >
              Anmelden
            </Link>
            <Link
              href="/register"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-dark transition"
            >
              Kostenlos registrieren
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-6 text-left">
              <h3 className="text-xl font-bold mb-2">✓ Spracheingabe</h3>
              <p className="opacity-90">Deutsch-Spracheingabe für schnelle Erfassung auf der Baustelle</p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-6 text-left">
              <h3 className="text-xl font-bold mb-2">✓ AI-Kalkulation</h3>
              <p className="opacity-90">Automatische Preisberechnung mit deinen Vorgaben</p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-6 text-left">
              <h3 className="text-xl font-bold mb-2">✓ Nachträge</h3>
              <p className="opacity-90">Schnelle Zusatzpositionen direkt auf der Baustelle</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
