# Plattform-Statistik: Widerspruch, Pseudonyme und Aufbewahrung

Stand: 31.10.2026. Technische Umsetzung, noch nicht veröffentlicht.

## Erfassung

Die eigene Reichweitenmessung bleibt getrennt von Kunden-Funnels und von Meta.
Der Server verarbeitet IP und User-Agent flüchtig mit HMAC-SHA256. Ein zufälliger
32-Byte-Schlüssel liegt nur im Prozessspeicher. Beim ersten Ereignis eines neuen
UTC-Tages wird der alte Buffer überschrieben und ein neuer Schlüssel erzeugt.
Neustarts erzeugen ebenfalls einen neuen Schlüssel. Es gibt weder einen Bezug zu
SESSION_SECRET noch eine Speicherung/Übertragung des Schlüssels. Mehrere Prozesse
haben getrennte Schlüssel und können deshalb zusätzliche Tageskennungen zählen.
Keine Zusage vollständiger Anonymität: zeitliche Zusammenhänge und Zusatzwissen
können weiterhin relevant sein; alte Daten verwendeten das frühere Verfahren.

Pfad-Whitelist und feste Aktionscodes begrenzen neue Nutzdaten. Freie Referrer und
UTM-Werte werden auch bei direkten Requests verworfen. Quellen-/Kampagnenberichte
enthalten dadurch nur noch gegebenenfalls vorhandene Altwerte. Zahlungen und
Abo-Starts erhalten pro Ereignis eine zufällige Kennung ohne Konto-ID-Ableitung.
Sie zählen Ereignisse, nicht eindeutige Käufer; der Report ist keine verknüpfte
Besucherreise. Abrechnungs- und Vertragsdaten bleiben unabhängig davon erhalten.

## Widerspruch

`/datenschutz` enthält eine sofort wirksame Browserwahl. Nur bei Widerspruch wird
`tw_platform_optout=1` gesetzt: host-only, Path=/, SameSite=Lax, HTTPS zusätzlich
Secure, maximal 365 Tage, kein Besucheridentifikator. Aufhebung löscht das Cookie.
Die Messung setzt selbst keine Besucherkennung im Endgerät. DNT=1 und Sec-GPC=1
werden serverseitig beachtet; der Client berücksichtigt zusätzlich die zugehörigen
Navigator-Signale. Cookiesperren führen im aktuellen Tab zu einer RAM-Sperre und
einem sichtbaren Hinweis. Registrierung überträgt diese Sperre zusätzlich in
X-Platform-Optout. Browserbeacons sowie Registrierungsstatistik beachten den
Widerspruch. Unverbundene Zahlungszähler sind keine Besucherereignisse.

Ein anderer Browser/Host und gelöschte Präferenzcookies benötigen einen erneuten
Widerspruch. Bereits gespeicherte Daten werden durch den Schalter nicht gelöscht.
Individuelle Auskunfts-/Löschanfragen bleiben über die Betreiberkontaktdaten möglich.
Das ist getrennt von der Cookie-Auswahl für freiwillige Marketing-Einwilligungen.

## Begrenzung und Freigabe

Betreiberentscheidung vom 31.10.2026: **90 Tage** für Einzelereignisse der
eigenen Plattform-Statistik. Das deckt den längsten vorhandenen Auswertungszeitraum
von 90 Tagen ab. Konfiguration: `PLATFORM_ANALYTICS_RETENTION_DAYS=90`.
Es gibt weiterhin keinen automatisch angenommenen Standardwert.
Ohne `PLATFORM_ANALYTICS_RETENTION_DAYS` werden keine neuen Aufträge erstellt.
Die öffentliche Status-API und Datenschutzerklärung zeigen die tatsächlich
konfigurierte Tagesfrist oder ausdrücklich die noch fehlende Aktivierung.

Vor Aktivierung eine rein lesende Vorschau mit expliziter Datenbankverbindung:

```sh
npx tsx scripts/platform-retention-preview.ts 90
```

`DATABASE_URL` muss zuvor gesetzt sein; das Werkzeug lädt keine `.env`.
Es gibt nur Anzahl, Stichtag und höchste betroffene ID aus, keine Besucherwerte.
Frist und Zweck dokumentieren, Vorschau prüfen, dann die bestätigte Tagesfrist
als Umgebungsvariable konfigurieren. Gültig: 1–36500 ganze Tage. Eine ungültige
Angabe führt zu einem Fehler und nicht zu einer stillen Ersatzfrist.

Der Worker beauftragt höchstens einen Bereich pro UTC-Tag. Ein Bereich umfasst
`timestamp <= before` **und** `id <= maxId`. Später hinzugekommene oder jüngere
Ereignisse bleiben geschützt. Maximal 500 Datensätze werden je Minutenlauf
entfernt. Kunden-Funnels, Leads, Kundenstatistiken und Medien werden nicht berührt.
Nach Änderung/Entfernung der Frist bleiben bereits dauerhaft beauftragte Bereiche
verbindlich. Ausführung wartet auf die externe Bestätigung genau ihres Journalkopfs.
Bei Offline-Lücken oder Rückstau kann die physische Löschung später erfolgen.

## Veröffentlichung und Wiederherstellung

1. Externen Mac-Parser `scripts/erasure-journal-backup.mjs` zuerst kompatibel
   aktualisieren und Quellenvergleich/Bestätigung prüfen. Alten Parser und
   Konfiguration privat sichern; bestehende Einstellungen erhalten.
2. Anwendung/Migration veröffentlichen. Die Migration ändert ausschließlich
   den Standard neuer Statistikzeitstempel auf UTC; Altwerte bleiben unverändert.
3. Rein lesende produktive Vorschau der gewählten Frist prüfen. Erst nach
   bewusster Betreiberentscheidung die Umgebungsvariable aktivieren.
4. Ohne produktive Test-Löschungen: Health, ausgelieferte Datenschutzerklärung,
   Status-API, Bestandszahlen und externe Bestätigung prüfen.

Neuer Journaltyp `platform_before` enthält ausschließlich UTC-Stichtag und
höchste ID. Der eigenständige Mac-Parser validiert beide Grenzen strikt. Ein
SQL-Rollback entfernt keinen bereits geschriebenen Auftrag. Offline-Replay
entfernt die betroffenen Statistikereignisse auch aus alten Backups wiederholt.
Vor Wiederinbetriebnahme gelten weiterhin aktueller Quellenvergleich und
vollständiger Offline-Replay. Frist/Umgebung vor Wiederanlauf gesondert prüfen.
Alte Anwendungsversionen verstehen den neuen Journaltyp nicht: nach ersten
Aufträgen ist kein unvorbereiteter Rollback auf diese Versionen möglich.

Backup-Fristen sind eigenständig; das Journal enthält keine Besucherkennungen.
Die bestehende R11-Betriebsanleitung gilt ergänzend.

## Interessenabwägung zur Betreiberprüfung

Zweck: Nutzbarkeit und Abbrüche auf eigenen öffentlichen Seiten beurteilen.
Interesse: Fehler in der Registrierung erkennen und Seiten verbessern.
Die Abwägung umfasst auch Registrierungsdaten, während Konto- und Kundeninhalte
nicht in diese Statistik übernommen werden. Berichte sind nur für Admins sichtbar.

Eingriff: kurzzeitige Verarbeitung von IP und User-Agent, pseudonyme Zuordnung
innerhalb eines Tages/Prozesses und Zeitstempel einzelner Aktionen. Auch ohne
Tracking-Cookie ist das kein Nachweis fehlenden Personenbezugs. Risiken bestehen
insbesondere durch Zeitkorrelation und Zugriff auf weitere betriebliche Daten.

Mildere Mittel: reine Seitenzähler erlauben keine Abschätzung wiederholter Aufrufe
und Formularabbrüche pro Tageskennung. Dies begründet die technische Wahl, ersetzt
aber nicht die Betreiberentscheidung, ob dieser Zusatznutzen erforderlich ist.
Eine ausschließlich einwilligungsbasierte Messung ist eine weitere Alternative.

Schutz: flüchtige Schlüssel, eingeschränkte Felder, keine freien Quellenparameter,
sofortiger Widerspruch, DNT/GPC, begrenzter Adminzugriff und bestätigte Löschung.
Die vom Betreiber gewählte Frist beträgt 90 Tage, passend zum längsten
angebotenen Vergleichszeitraum. Die fachliche Erforderlichkeitsprüfung bleibt
von dieser technischen und betrieblichen Festlegung zu unterscheiden.
Technik allein bestätigt weder diese Abwägung noch die Einordnung des gesamten
Messverfahrens nach § 25 TDDDG. Keine pauschale Rechtskonformitätszusage.

Primärquellen zur fachlichen Prüfung, abgerufen am 31.10.2026:
- [EDSA: Anonymisierung/Pseudonymisierung](https://www.edpb.europa.eu/topics/ai-and-technology/anonymisation-pseudonymisation_de)
- [LfD Niedersachsen: Betroffenenrechte](https://www.lfd.niedersachsen.de/dsgvo/betroffenenrechte/betroffenenrechte-216147.html)
