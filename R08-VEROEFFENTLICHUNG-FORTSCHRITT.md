# R08 – Rechtslinks vor der Funnel-Veröffentlichung

Stand: 29. Oktober 2026. Umsetzung im Branch `fix/funnel-publication-legal-links`.

## Verhalten

- Jede neue Veröffentlichung und Aktualisierung eines Live-Stands verlangt eine vollständige Impressum- und Datenschutzerklärung-URL. Die gemeinsame Prüfung im Server gilt auch für direkte API-Aufrufe und ältere Schreibprotokolle; Fehlercode `LEGAL_LINKS_REQUIRED`.
- Zulässig sind absolute HTTP-/HTTPS-Adressen ohne Zugangsdaten, Leerzeichen oder Backslashes. Relative Pfade, reine Anker und andere Protokolle reichen nicht aus. Damit beziehen sich die Links auf Plattform- und Kundendomains auf dasselbe Ziel.
- Unvollständige Entwürfe lassen sich mit dem aktuellen Editor speichern. Die Veröffentlichung wird atomar vor jeder Änderung an Revision, Versionszähler und Live-Verweis abgelehnt. Ältere Clients veröffentlichen beim Speichern eines Live-Funnels implizit und müssen deshalb ebenfalls vollständige Links liefern.
- Der Editor zeigt fehlende Links an. Der Veröffentlichungsdialog erklärt die fehlenden Angaben, bietet den Wechsel zu den Einstellungen und zeigt bei vollständigen Adressen Links zum Prüfen der beiden Seiten.
- Bestehende Live-Funnels werden weder verändert noch offline genommen. Ihre nächste Veröffentlichung unterliegt der neuen Prüfung.
- Gelöschte Live-Funnels mit unvollständigen Rechtslinks werden als Entwurf wiederhergestellt. Maßgeblich ist ihr früherer veröffentlichter Snapshot, nicht ein neuerer, noch unveröffentlichter Entwurf. Ein passender Hinweis erscheint nach der Wiederherstellung.
- Der im Veröffentlichungsdialog eingegebene URL-Pfad bleibt bei Autosave-Rückmeldungen erhalten. Verspätete Verfügbarkeitsprüfungen überschreiben kein neueres Prüfergebnis.
- Historische Inhaltsversionen werden weiterhin ausschließlich als Entwurf wiederhergestellt. Auch deren erneute Veröffentlichung muss die Prüfung bestehen.

## Grenzen und fachliche Einordnung

Diese Produktprüfung stellt das Vorhandensein verwendbarer Webadressen sicher. Sie prüft weder Erreichbarkeit noch Betreiberidentität, Inhalt oder Aktualität der fremden Rechtstexte. Der Kunde muss die im Dialog verlinkten Seiten kontrollieren und seine konkreten Verarbeitungen, bei Bewerbungen insbesondere Arbeitgeber und Zweck, korrekt beschreiben. Es werden keine fremden Seiten serverseitig abgerufen und keine Kundenlinks automatisch durch Plattformtexte ersetzt.

Die ursprüngliche Prüfliste nennt daneben die inhaltliche Prüfung bestehender Kunden-Funnels. Diese bleibt offen; der technische Schutz allein ist keine vollständige rechtliche Abnahme von R08. Rechtsgrundlagen: [§ 5 DDG](https://www.gesetze-im-internet.de/ddg/__5.html) und [Art. 13 DSGVO](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32016R0679).

Keine Datenmigration und keine Änderung vorhandener Kundeninhalte erforderlich. Der mobile Besucher-Footer wird mitgeprüft; der bestehende Editor bleibt auf Desktop/Tablet beschränkt.

## Validierung

Neue Tests decken URL-Formate, fehlende Einzelangaben, beide Schreibprotokolle, unveränderte Live-Snapshots bei abgewiesener Veröffentlichung, historische Entwürfe und Wiederherstellung gelöschter Funnels ab. Browsertests prüfen Korrektur im Editor, Veröffentlichung sowie Footer bei 390 und 1440 Pixeln und die Auflösung einer verifizierten Kundendomain. Bestehende Veröffentlichungstests verwenden ausdrückliche synthetische Rechtslinks.

Nachweise und Screenshots liegen privat unter `~/TrichterwerkBackups/reviews/publication-legal-2026-10-29/`. Lokal sind Typprüfung, Produktionsbuild, 530 Unit-/Komponententests, 155 Datenbank-/Migrationstests und die 56 Browserfälle geprüft. Die Browserfälle laufen in getrennten Projekten, damit synthetische Registrierungen das echte Anfragelimit nicht gemeinsam erschöpfen. Der Veröffentlichungsstand wird nach Abschluss ergänzt.
