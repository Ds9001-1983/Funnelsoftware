import { Link } from "wouter";
import { usePageMeta } from "@/hooks/use-document-title";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STAND = "11. Juni 2026";

/**
 * Vertrag zur Auftragsverarbeitung (Art. 28 DSGVO) für Trichterwerk-Kunden,
 * die über ihre Funnels personenbezogene Daten Dritter (Leads) erheben —
 * inkl. öffentlicher Subunternehmer-Liste.
 */
export default function AVV() {
  usePageMeta({
    title: "Auftragsverarbeitungsvertrag (AVV)",
    description: "Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO für Trichterwerk-Kunden, inkl. Subunternehmer-Liste.",
    canonical: "/avv",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
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

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <Card className="shadow-lg">
          <CardContent className="p-8 md:p-12">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Vertrag zur Auftragsverarbeitung (AVV)
            </h1>
            <p className="text-sm text-slate-500 mb-8">
              nach Art. 28 DSGVO · Stand: {STAND}
            </p>

            <section className="mb-8 p-4 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-purple-800 text-sm leading-relaxed">
                Dieser Auftragsverarbeitungsvertrag ist Bestandteil der
                Nutzungsbedingungen von Trichterwerk und gilt automatisch für alle
                Kunden, die über ihre Funnels personenbezogene Daten Dritter
                erheben. Mit der Registrierung und Nutzung des Dienstes kommt der
                AVV in der jeweils aktuellen Fassung zustande.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">1. Parteien und Gegenstand</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                <strong>Auftragnehmer (Auftragsverarbeiter):</strong> SUPERBRAND.marketing,
                Dennis Sasse, Römerstraße 23, 51674 Wiehl („Trichterwerk").
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                <strong>Auftraggeber (Verantwortlicher):</strong> Der jeweilige Kunde,
                der über sein Trichterwerk-Konto Funnels betreibt und darüber
                personenbezogene Daten Dritter erhebt.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                Gegenstand des Vertrags ist die Verarbeitung personenbezogener Daten,
                die der Auftraggeber über seine mit Trichterwerk erstellten Funnels
                erhebt (insbesondere Lead-Daten), durch den Auftragnehmer im Rahmen
                der Bereitstellung der SaaS-Plattform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">2. Art, Zweck und Dauer der Verarbeitung</h2>
              <ul className="list-disc list-inside text-slate-600 text-sm space-y-2 ml-4 mb-4">
                <li><strong>Art:</strong> Speicherung, Anzeige, Export und Löschung von Formulardaten; Versand von Benachrichtigungen; optional Übermittlung an vom Auftraggeber konfigurierte Drittsysteme (Webhooks, Meta Conversions API).</li>
                <li><strong>Zweck:</strong> Bereitstellung der Funnel- und Lead-Verwaltungsfunktionen der Plattform.</li>
                <li><strong>Dauer:</strong> Für die Dauer des Nutzungsvertrags. Mit Löschung des Kontos werden die Auftragsdaten gelöscht, soweit keine gesetzlichen Aufbewahrungspflichten bestehen.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">3. Kategorien betroffener Personen und Daten</h2>
              <ul className="list-disc list-inside text-slate-600 text-sm space-y-2 ml-4">
                <li><strong>Betroffene:</strong> Besucher und Interessenten (Leads) der Funnel-Seiten des Auftraggebers.</li>
                <li><strong>Datenkategorien:</strong> Kontaktdaten (Name, E-Mail-Adresse, Telefonnummer, Firma), Formularantworten/Freitexte, technische Daten (IP-Adresse, User-Agent, Zeitstempel), Einwilligungsstatus.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">4. Pflichten des Auftragnehmers</h2>
              <ul className="list-disc list-inside text-slate-600 text-sm space-y-2 ml-4">
                <li>Verarbeitung ausschließlich auf dokumentierte Weisung des Auftraggebers (die Nutzung der Plattform-Funktionen gilt als Weisung).</li>
                <li>Vertraulichkeitsverpflichtung aller mit der Verarbeitung befassten Personen.</li>
                <li>Technische und organisatorische Maßnahmen nach Art. 32 DSGVO (u.a. TLS-Transportverschlüsselung, Passwort-Hashing, Zugriffskontrollen, tägliche Backups, Server-Standort Deutschland).</li>
                <li>Unterstützung des Auftraggebers bei Betroffenenrechten (Art. 12–23 DSGVO) und bei Pflichten nach Art. 32–36 DSGVO.</li>
                <li>Meldung von Verletzungen des Schutzes personenbezogener Daten ohne unangemessene Verzögerung.</li>
                <li>Löschung oder Rückgabe aller Auftragsdaten nach Ende des Vertrags.</li>
                <li>Nachweis der Einhaltung dieser Pflichten und Ermöglichung von Überprüfungen.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">5. Subunternehmer (Art. 28 Abs. 2 DSGVO)</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Der Auftraggeber erteilt die allgemeine Genehmigung zum Einsatz der
                folgenden Subunternehmer. Über beabsichtigte Änderungen informiert der
                Auftragnehmer auf dieser Seite; der Auftraggeber kann Änderungen aus
                wichtigem Grund widersprechen.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600 border border-slate-200">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-3 py-2 border-b">Unternehmen</th>
                      <th className="px-3 py-2 border-b">Zweck</th>
                      <th className="px-3 py-2 border-b">Standort</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-3 py-2 border-b">Hetzner Online GmbH</td>
                      <td className="px-3 py-2 border-b">Server-Hosting</td>
                      <td className="px-3 py-2 border-b">Deutschland</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 border-b">Alfahosting GmbH</td>
                      <td className="px-3 py-2 border-b">E-Mail-Versand (SMTP)</td>
                      <td className="px-3 py-2 border-b">Deutschland</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 border-b">Stripe Payments Europe, Ltd.</td>
                      <td className="px-3 py-2 border-b">Zahlungsabwicklung (nur Kontodaten des Auftraggebers, keine Lead-Daten)</td>
                      <td className="px-3 py-2 border-b">Irland / USA (DPF-zertifiziert)</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 border-b">Meta Platforms Ireland Ltd.</td>
                      <td className="px-3 py-2 border-b">Conversions API — nur wenn vom Auftraggeber aktiviert und nur mit Einwilligung des Besuchers</td>
                      <td className="px-3 py-2 border-b">Irland / USA (DPF-zertifiziert)</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2">Google Ireland Ltd.</td>
                      <td className="px-3 py-2">Tag Manager — nur wenn vom Auftraggeber eingebunden und nur mit Einwilligung des Besuchers</td>
                      <td className="px-3 py-2">Irland / USA (DPF-zertifiziert)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">6. Pflichten des Auftraggebers</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Der Auftraggeber ist Verantwortlicher im Sinne der DSGVO und stellt
                insbesondere sicher, dass seine Funnels die Informationspflichten
                (Art. 13 DSGVO, Impressum) erfüllen, erforderliche Einwilligungen
                eingeholt werden und die Erhebung der Daten rechtmäßig ist.
                Trichterwerk stellt hierfür Felder für Impressum- und
                Datenschutz-Links in den Funnel-Einstellungen bereit.
              </p>
            </section>

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
