import { Link } from "wouter";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AGB() {
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
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              Allgemeine Geschäftsbedingungen
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              Stand: {new Date().toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>

            {/* Disclaimer */}
            <section className="mb-8 p-4 bg-amber-50 rounded-lg border border-amber-200 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900 leading-relaxed">
                <strong>Entwurfsstand.</strong> Diese AGB sind ein inhaltlicher Entwurf und
                ersetzen keine anwaltliche Prüfung. Vor der Anwendung im produktiven
                Vertragsgeschäft werden sie durch einen Rechtsbeistand finalisiert.
                Bei Fragen:{" "}
                <a href="mailto:info@superbrand.marketing" className="underline">
                  info@superbrand.marketing
                </a>
                .
              </div>
            </section>

            {/* Produkt-Info */}
            <section className="mb-8 p-4 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-purple-800 font-medium">
                Trichterwerk ist ein Produkt von SUPERBRAND.marketing
              </p>
            </section>

            {/* § 1 Geltungsbereich */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                § 1 Geltungsbereich
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB") gelten für
                die Nutzung der Software-as-a-Service-Anwendung „Trichterwerk" (nachfolgend
                „Dienst" oder „Software") zwischen der SUPERBRAND.marketing, Inhaber Dennis
                Sasse, Römerstraße 23, 51674 Wiehl (nachfolgend „Anbieter") und dem
                jeweiligen Kunden (nachfolgend „Kunde").
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (2) Der Dienst richtet sich ausschließlich an Unternehmer im Sinne von
                § 14 BGB. Der Kunde bestätigt mit der Registrierung, dass er als Unternehmer
                handelt.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                (3) Abweichende, entgegenstehende oder ergänzende Geschäftsbedingungen
                des Kunden werden nur dann Vertragsbestandteil, wenn der Anbieter ihrer
                Geltung ausdrücklich schriftlich zugestimmt hat.
              </p>
            </section>

            {/* § 2 Vertragsgegenstand & Leistungen */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                § 2 Vertragsgegenstand & Leistungen
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (1) Der Anbieter stellt dem Kunden die Software Trichterwerk zur
                webbasierten Erstellung, Veröffentlichung und Verwaltung von
                Marketing-Funnels, Landingpages und Lead-Formularen zur Nutzung über das
                Internet zur Verfügung.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (2) Der Funktionsumfang richtet sich nach dem gebuchten Tarif. Die
                jeweiligen Leistungsbeschreibungen sind auf der Website des Anbieters
                einsehbar und zum Zeitpunkt des Vertragsschlusses maßgeblich.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                (3) Der Anbieter behält sich vor, den Dienst weiterzuentwickeln, zu
                aktualisieren und einzelne Funktionen zu ergänzen oder zu entfernen, sofern
                der vertraglich vereinbarte Leistungsumfang dadurch nicht wesentlich
                eingeschränkt wird.
              </p>
            </section>

            {/* § 3 Vertragsschluss & Registrierung */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                § 3 Vertragsschluss & Registrierung
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (1) Die Nutzung des Dienstes setzt die Registrierung eines Accounts voraus.
                Der Kunde sichert zu, dass alle angegebenen Daten wahrheitsgemäß und
                vollständig sind und hält diese aktuell.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (2) Der Vertrag kommt mit der Bestätigung der Registrierung durch den
                Anbieter und der Aktivierung des Accounts zustande.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                (3) Der Kunde ist verpflichtet, seine Zugangsdaten geheim zu halten und
                unberechtigte Nutzung unverzüglich dem Anbieter zu melden.
              </p>
            </section>

            {/* § 4 Testzeitraum */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                § 4 Testzeitraum
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (1) Der Anbieter gewährt dem Kunden nach der Registrierung einen
                kostenfreien Testzeitraum von 14 (vierzehn) Kalendertagen mit vollem
                Funktionsumfang des gebuchten Tarifs.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (2) Zur Nutzung des Testzeitraums ist die Hinterlegung einer gültigen
                Zahlungsmethode erforderlich. Die Belastung erfolgt erst nach Ablauf des
                Testzeitraums.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                (3) Kündigt der Kunde vor Ablauf des Testzeitraums, entstehen keine Kosten.
                Die Kündigung erfolgt über das Kundenportal oder per E-Mail an{" "}
                <a
                  href="mailto:info@superbrand.marketing"
                  className="underline text-purple-700"
                >
                  info@superbrand.marketing
                </a>
                .
              </p>
            </section>

            {/* § 5 Vergütung & Zahlungsbedingungen */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                § 5 Vergütung & Zahlungsbedingungen
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (1) Die Vergütung richtet sich nach dem gewählten Tarif und ist der
                aktuellen Preisliste auf der Website des Anbieters zu entnehmen. Alle
                Preise verstehen sich netto zuzüglich der gesetzlichen Umsatzsteuer.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (2) Die Abrechnung erfolgt monatlich im Voraus über den Zahlungsdienstleister
                Stripe Payments Europe, Ltd. Der Kunde kann seine Zahlungsmethode
                (Kreditkarte, SEPA-Lastschrift, PayPal o. a.) im Kundenportal verwalten.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (3) Bei Zahlungsverzug ist der Anbieter berechtigt, den Zugang zum Dienst
                bis zum vollständigen Zahlungseingang zu sperren. Etwaige Schadensersatz-
                und Verzugsansprüche bleiben unberührt.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                (4) Preisanpassungen werden dem Kunden mindestens 30 Tage vor Inkrafttreten
                per E-Mail angekündigt. Der Kunde kann den Vertrag zum Zeitpunkt des
                Wirksamwerdens der Preisanpassung außerordentlich kündigen.
              </p>
            </section>

            {/* § 6 Laufzeit & Kündigung */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                § 6 Laufzeit & Kündigung
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (1) Der Vertrag läuft auf unbestimmte Zeit und kann vom Kunden jederzeit
                zum Ende des jeweiligen Abrechnungszeitraums (monatlich) gekündigt werden.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (2) Die Kündigung erfolgt über das Kundenportal oder per E-Mail in Textform
                an{" "}
                <a
                  href="mailto:info@superbrand.marketing"
                  className="underline text-purple-700"
                >
                  info@superbrand.marketing
                </a>
                .
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                (3) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt
                für beide Seiten unberührt.
              </p>
            </section>

            {/* § 7 Pflichten des Kunden */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                § 7 Pflichten des Kunden
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (1) Der Kunde ist für die von ihm eingestellten Inhalte (Texte, Bilder,
                Videos, Formularinhalte, Empfängerdaten) selbst verantwortlich und sichert
                zu, über die erforderlichen Rechte zu verfügen.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (2) Der Kunde verpflichtet sich, den Dienst nicht für rechtswidrige Zwecke
                zu nutzen, insbesondere nicht für:
              </p>
              <ul className="list-disc list-inside text-slate-600 text-sm space-y-1 mb-3 ml-4">
                <li>unerlaubte Werbung, Spam oder Kettenbriefe,</li>
                <li>Verbreitung rassistischer, pornografischer oder volksverhetzender Inhalte,</li>
                <li>Verletzung von Urheber-, Marken- oder Persönlichkeitsrechten Dritter,</li>
                <li>irreführende oder betrügerische Geschäftspraktiken,</li>
                <li>Versand unerwünschter Kommunikation ohne gültige Einwilligung (DSGVO).</li>
              </ul>
              <p className="text-slate-600 text-sm leading-relaxed">
                (3) Bei Verstoß ist der Anbieter berechtigt, den betroffenen Inhalt zu
                entfernen und den Account des Kunden außerordentlich zu kündigen.
              </p>
            </section>

            {/* § 8 Verfügbarkeit & Support */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                § 8 Verfügbarkeit & Support
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (1) Der Anbieter bemüht sich um eine Verfügbarkeit des Dienstes von 99 %
                im Jahresmittel. Zeiten geplanter Wartungsarbeiten, Ausfälle aufgrund
                höherer Gewalt sowie Ausfälle bei Drittanbietern (z. B. Hosting,
                Zahlungsdienstleister) sind von dieser Quote ausgenommen.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (2) Support erfolgt per E-Mail unter{" "}
                <a
                  href="mailto:info@superbrand.marketing"
                  className="underline text-purple-700"
                >
                  info@superbrand.marketing
                </a>
                . Reaktionszeiten richten sich nach dem gebuchten Tarif.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                (3) Geplante Wartungen werden nach Möglichkeit mit mindestens 24 Stunden
                Vorlauf angekündigt und nach Möglichkeit außerhalb der Kernarbeitszeiten
                (09:00–17:00 Uhr MEZ, Montag bis Freitag) durchgeführt.
              </p>
            </section>

            {/* § 9 Datenschutz */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                § 9 Datenschutz & Auftragsverarbeitung
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (1) Der Anbieter verarbeitet personenbezogene Daten ausschließlich im
                Einklang mit der DSGVO und dem Bundesdatenschutzgesetz. Details regelt die{" "}
                <Link href="/datenschutz" className="underline text-purple-700">
                  Datenschutzerklärung
                </Link>
                .
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (2) Soweit der Kunde im Rahmen der Nutzung des Dienstes personenbezogene
                Daten Dritter (z. B. seiner eigenen Leads) verarbeitet, schließen die
                Parteien einen Auftragsverarbeitungsvertrag (AVV) gemäß Art. 28 DSGVO ab.
                Der AVV wird auf Anfrage durch den Anbieter bereitgestellt.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                (3) Hosting erfolgt in der Europäischen Union. Weitere Auftragsverarbeiter
                (Stripe, E-Mail-Provider) sind im AVV abschließend aufgeführt.
              </p>
            </section>

            {/* § 10 Haftung */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                § 10 Haftung
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (1) Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit
                sowie für Schäden aus der Verletzung des Lebens, des Körpers oder der
                Gesundheit, ferner nach den Vorschriften des Produkthaftungsgesetzes und
                im Umfang einer vom Anbieter übernommenen Garantie.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (2) Für leicht fahrlässig verursachte Schäden haftet der Anbieter nur bei
                der Verletzung wesentlicher Vertragspflichten (Kardinalpflichten) und
                begrenzt auf den vertragstypischen, vorhersehbaren Schaden.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                (3) Im Übrigen ist die Haftung ausgeschlossen. Die Haftung für
                entgangenen Gewinn, ausgebliebene Einsparungen, mittelbare Schäden und
                Folgeschäden ist – außer bei Vorsatz und grober Fahrlässigkeit –
                ausgeschlossen.
              </p>
            </section>

            {/* § 11 Schlussbestimmungen */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                § 11 Schlussbestimmungen
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (1) Es gilt ausschließlich das Recht der Bundesrepublik Deutschland unter
                Ausschluss des UN-Kaufrechts.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (2) Ausschließlicher Gerichtsstand für alle Streitigkeiten aus oder im
                Zusammenhang mit diesem Vertrag ist – soweit gesetzlich zulässig – der
                Sitz des Anbieters.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                (3) Änderungen und Ergänzungen dieser AGB bedürfen der Textform. Das gilt
                auch für die Aufhebung dieses Formerfordernisses.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                (4) Sollten einzelne Bestimmungen dieser AGB unwirksam oder undurchführbar
                sein oder werden, so berührt dies die Wirksamkeit der übrigen Bestimmungen
                nicht. An die Stelle der unwirksamen Bestimmung tritt die gesetzlich
                zulässige Regelung, die dem wirtschaftlichen Zweck der Bestimmung am
                nächsten kommt.
              </p>
            </section>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-slate-200">
              <p className="text-sm text-slate-500 text-center">
                © {new Date().getFullYear()} SUPERBRAND.marketing · Alle Rechte vorbehalten
              </p>
              <p className="text-xs text-slate-400 text-center mt-2">
                Bei Fragen zu diesen AGB wende dich bitte an{" "}
                <a
                  href="mailto:info@superbrand.marketing"
                  className="underline hover:text-slate-600"
                >
                  info@superbrand.marketing
                </a>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
