import { Link } from "wouter";
import { usePageMeta } from "@/hooks/use-document-title";
import { ArrowLeft, Mail, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Impressum() {
  usePageMeta({
    title: "Impressum",
    description: "Impressum und Anbieterkennzeichnung von Trichterwerk — ein Produkt von SUPERBRAND.marketing.",
    canonical: "/impressum",
  });

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

            {/* Angaben gemäß § 5 DDG */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Angaben gemäß § 5 DDG
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
                Redaktionell verantwortlich
              </h2>
              <div className="text-slate-600 space-y-1">
                <p>Dennis Sasse</p>
                <p>Römerstraße 23</p>
                <p>51674 Wiehl</p>
              </div>
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
                Für eigene Inhalte sind wir nach den allgemeinen Gesetzen verantwortlich.
                Hinweise auf mögliche Rechtsverletzungen können Sie an die oben genannte
                E-Mail-Adresse richten. Bitte nennen Sie die konkrete Internetadresse und
                erläutern Sie den beanstandeten Inhalt. Wir prüfen Hinweise und treffen
                die erforderlichen Maßnahmen nach den geltenden gesetzlichen Vorgaben.
              </p>
            </section>

            {/* Haftung für Links */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Haftung für Links
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Für Inhalte verlinkter Websites sind deren jeweilige Betreiber verantwortlich.
                Wenn Sie auf einer verlinkten Seite einen möglichen Rechtsverstoß feststellen,
                können Sie uns über die oben genannten Kontaktdaten informieren. Wir prüfen
                den Hinweis und entfernen rechtswidrige Verlinkungen, soweit erforderlich.
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
