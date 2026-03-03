import { Link } from "wouter";
import { ArrowLeft, Mail, Phone, MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Impressum() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Startseite
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <Card className="shadow-lg">
          <CardContent className="p-8 md:p-12">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Impressum</h1>

            {/* Produkt-Info */}
            <section className="mb-8 p-4 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-purple-800 font-medium">
                Trichterwerk ist ein Produkt von SUPERBRAND.marketing
              </p>
            </section>

            {/* Angaben gemäß § 5 TMG */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Angaben gemäß § 5 TMG
              </h2>
              <div className="text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">SUPERBRAND.marketing</p>
                <p>Dennis Sasse</p>
                <p>Römerstraße 23</p>
                <p>51674 Wiehl</p>
              </div>
            </section>

            {/* Vertreten durch */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Vertreten durch
              </h2>
              <p className="text-slate-600">Dennis Sasse</p>
            </section>

            {/* Kontakt */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Kontakt
              </h2>
              <div className="space-y-3">
                <a 
                  href="tel:+4915122142057" 
                  className="flex items-center gap-3 text-slate-600 hover:text-purple-600 transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  <span>015122142057</span>
                </a>
                <a 
                  href="mailto:info@superbrand.marketing" 
                  className="flex items-center gap-3 text-slate-600 hover:text-purple-600 transition-colors"
                >
                  <Mail className="h-5 w-5" />
                  <span>info@superbrand.marketing</span>
                </a>
                <a 
                  href="https://wa.me/4915122142057" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-slate-600 hover:text-green-600 transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>WhatsApp: 015122142057</span>
                </a>
              </div>
            </section>

            {/* Umsatzsteuer-ID */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Umsatzsteuer-ID
              </h2>
              <p className="text-slate-600">
                Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
              </p>
              <p className="text-slate-800 font-mono mt-2">DE237745140</p>
            </section>

            {/* Verantwortlich für den Inhalt */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
              </h2>
              <div className="text-slate-600 space-y-1">
                <p>Dennis Sasse</p>
                <p>Römerstraße 23</p>
                <p>51674 Wiehl</p>
              </div>
            </section>

            {/* EU-Streitschlichtung */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                EU-Streitschlichtung
              </h2>
              <p className="text-slate-600 mb-3">
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
              </p>
              <a 
                href="https://ec.europa.eu/consumers/odr/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                https://ec.europa.eu/consumers/odr/
              </a>
              <p className="text-slate-600 mt-3">
                Unsere E-Mail-Adresse finden Sie oben im Impressum.
              </p>
            </section>

            {/* Verbraucherstreitbeilegung */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Verbraucherstreitbeilegung / Universalschlichtungsstelle
              </h2>
              <p className="text-slate-600">
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren 
                vor einer Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>

            {/* Haftungsausschluss */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Haftung für Inhalte
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen 
                Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind 
                wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte 
                fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine 
                rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung 
                der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon 
                unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der 
                Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von 
                entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
              </p>
            </section>

            {/* Haftung für Links */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Haftung für Links
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir 
                keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine 
                Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige 
                Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden 
                zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige 
                Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente 
                inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte 
                einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen 
                werden wir derartige Links umgehend entfernen.
              </p>
            </section>

            {/* Urheberrecht */}
            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Urheberrecht
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten 
                unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, 
                Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes 
                bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. 
                Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen 
                Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber 
                erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden 
                Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine 
                Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden 
                Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte 
                umgehend entfernen.
              </p>
            </section>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-slate-200">
              <p className="text-sm text-slate-500 text-center">
                © {new Date().getFullYear()} SUPERBRAND.marketing · Alle Rechte vorbehalten
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
