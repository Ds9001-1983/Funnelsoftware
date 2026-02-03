import { Link } from "wouter";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Datenschutz() {
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
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Datenschutzerklärung</h1>

            {/* Produkt-Info */}
            <section className="mb-8 p-4 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-purple-800 font-medium">
                Trichterwerk ist ein Produkt von SUPERBRAND.marketing
              </p>
            </section>

            {/* 1. Datenschutz auf einen Blick */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                1. Datenschutz auf einen Blick
              </h2>
              <h3 className="text-lg font-medium text-slate-700 mb-2">Allgemeine Hinweise</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren 
                personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene 
                Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
              </p>
              <h3 className="text-lg font-medium text-slate-700 mb-2">Datenerfassung auf dieser Website</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-2">
                <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong>
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. 
                Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-2">
                <strong>Wie erfassen wir Ihre Daten?</strong>
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. 
                Hierbei kann es sich z.B. um Daten handeln, die Sie in ein Kontaktformular eingeben. 
                Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website 
                durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z.B. Internetbrowser, 
                Betriebssystem oder Uhrzeit des Seitenaufrufs).
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-2">
                <strong>Wofür nutzen wir Ihre Daten?</strong>
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu 
                gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.
              </p>
            </section>

            {/* 2. Verantwortliche Stelle */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                2. Verantwortliche Stelle
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
              </p>
              <div className="text-slate-600 text-sm space-y-1 mb-4">
                <p className="font-semibold text-slate-800">SUPERBRAND.marketing</p>
                <p>Dennis Sasse</p>
                <p>Römerstraße 23</p>
                <p>51674 Wiehl</p>
              </div>
              <div className="space-y-2">
                <a 
                  href="tel:+4915122142057" 
                  className="flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-colors text-sm"
                >
                  <Phone className="h-4 w-4" />
                  <span>015122142057</span>
                </a>
                <a 
                  href="mailto:info@superbrand.marketing" 
                  className="flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-colors text-sm"
                >
                  <Mail className="h-4 w-4" />
                  <span>info@superbrand.marketing</span>
                </a>
              </div>
            </section>

            {/* 3. Hosting */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                3. Hosting
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Wir hosten die Inhalte unserer Website bei folgendem Anbieter:
              </p>
              <h3 className="text-lg font-medium text-slate-700 mb-2">Externes Hosting</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Diese Website wird extern gehostet. Die personenbezogenen Daten, die auf dieser 
                Website erfasst werden, werden auf den Servern des Hosters gespeichert. Hierbei 
                kann es sich v.a. um IP-Adressen, Kontaktanfragen, Meta- und Kommunikationsdaten, 
                Vertragsdaten, Kontaktdaten, Namen, Websitezugriffe und sonstige Daten, die über 
                eine Website generiert werden, handeln.
              </p>
            </section>

            {/* 4. Allgemeine Hinweise und Pflichtinformationen */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                4. Allgemeine Hinweise und Pflichtinformationen
              </h2>
              <h3 className="text-lg font-medium text-slate-700 mb-2">Datenschutz</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. 
                Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den 
                gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
              </p>
              <h3 className="text-lg font-medium text-slate-700 mb-2">Hinweis zur verantwortlichen Stelle</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder 
                gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen 
                Daten (z.B. Namen, E-Mail-Adressen o. Ä.) entscheidet.
              </p>
              <h3 className="text-lg font-medium text-slate-700 mb-2">Speicherdauer</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt 
                wurde, verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die 
                Datenverarbeitung entfällt. Wenn Sie ein berechtigtes Löschersuchen geltend machen 
                oder eine Einwilligung zur Datenverarbeitung widerrufen, werden Ihre Daten gelöscht, 
                sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung Ihrer 
                personenbezogenen Daten haben.
              </p>
              <h3 className="text-lg font-medium text-slate-700 mb-2">Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung 
                möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die 
                Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf 
                unberührt.
              </p>
            </section>

            {/* 5. Datenerfassung auf dieser Website */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                5. Datenerfassung auf dieser Website
              </h2>
              <h3 className="text-lg font-medium text-slate-700 mb-2">Cookies</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Unsere Internetseiten verwenden so genannte „Cookies". Cookies sind kleine 
                Datenpakete und richten auf Ihrem Endgerät keinen Schaden an. Sie werden entweder 
                vorübergehend für die Dauer einer Sitzung (Session-Cookies) oder dauerhaft 
                (permanente Cookies) auf Ihrem Endgerät gespeichert. Session-Cookies werden nach 
                Ende Ihres Besuchs automatisch gelöscht. Permanente Cookies bleiben auf Ihrem 
                Endgerät gespeichert, bis Sie diese selbst löschen oder eine automatische Löschung 
                durch Ihren Webbrowser erfolgt.
              </p>
              <h3 className="text-lg font-medium text-slate-700 mb-2">Server-Log-Dateien</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Der Provider der Seiten erhebt und speichert automatisch Informationen in so 
                genannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. 
                Dies sind:
              </p>
              <ul className="list-disc list-inside text-slate-600 text-sm space-y-1 mb-4 ml-4">
                <li>Browsertyp und Browserversion</li>
                <li>verwendetes Betriebssystem</li>
                <li>Referrer URL</li>
                <li>Hostname des zugreifenden Rechners</li>
                <li>Uhrzeit der Serveranfrage</li>
                <li>IP-Adresse</li>
              </ul>
              <p className="text-slate-600 text-sm leading-relaxed">
                Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen.
              </p>
            </section>

            {/* 6. Ihre Rechte */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                6. Ihre Rechte
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Sie haben jederzeit das Recht:
              </p>
              <ul className="list-disc list-inside text-slate-600 text-sm space-y-2 ml-4">
                <li><strong>Auskunft</strong> über Ihre bei uns gespeicherten Daten zu erhalten (Art. 15 DSGVO)</li>
                <li><strong>Berichtigung</strong> unrichtiger Daten zu verlangen (Art. 16 DSGVO)</li>
                <li><strong>Löschung</strong> Ihrer Daten zu verlangen (Art. 17 DSGVO)</li>
                <li><strong>Einschränkung</strong> der Verarbeitung zu verlangen (Art. 18 DSGVO)</li>
                <li><strong>Datenübertragbarkeit</strong> zu verlangen (Art. 20 DSGVO)</li>
                <li><strong>Widerspruch</strong> gegen die Verarbeitung einzulegen (Art. 21 DSGVO)</li>
                <li>Sich bei einer <strong>Aufsichtsbehörde zu beschweren</strong> (Art. 77 DSGVO)</li>
              </ul>
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
