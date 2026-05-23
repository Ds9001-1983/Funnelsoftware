# Custom Domains — Setup-Anleitung

Kunden können ihre Funnels statt unter `trichterwerk.de/f/<uuid>` auch unter einer eigenen Domain ausliefern (z. B. `funnel.deine-firma.de`).

Dieser erste Wurf ist bewusst einfach gehalten: **CNAME + TXT-Verifikation, manuelles SSL via Let's-Encrypt**. Vollautomatisches On-Demand-TLS (z. B. via Caddy) ist ein optionaler Folgeschritt.

---

## 1. Im Trichterwerk-Editor

Im Funnel-Editor → **Einstellungen → Eigene Domain**:

1. Hostname eintragen (z. B. `funnel.deine-firma.de`) und „Hinzufügen".
2. Der Editor zeigt einen **Verifikations-Token** an.

## 2. Beim DNS-Anbieter des Kunden

Zwei Records anlegen:

| Typ   | Name                              | Wert                                 |
|-------|-----------------------------------|---------------------------------------|
| CNAME | `funnel`                          | `trichterwerk.de`                     |
| TXT   | `_trichterwerk-verify.funnel`     | `<Token aus dem Editor>`              |

DNS-Propagation: meist < 5 Minuten, kann aber bis zu 24 h dauern.

## 3. Im Editor verifizieren

Zurück im Editor → „Jetzt verifizieren". Der Server prüft den TXT-Record per DNS-Lookup. Bei Erfolg wird die Domain auf `verified` gesetzt.

## 4. Auf dem Server (nginx + certbot)

Sobald die Domain verifiziert ist, muss der Server die Domain bedienen — **das geschieht aktuell noch manuell**:

```bash
# certbot-Zertifikat für die neue Domain ausstellen
sudo certbot certonly --nginx -d funnel.deine-firma.de

# nginx-Server-Block ergänzen
sudo tee /etc/nginx/sites-available/funnel.deine-firma.de.conf <<'EOF'
server {
  listen 443 ssl http2;
  server_name funnel.deine-firma.de;

  ssl_certificate     /etc/letsencrypt/live/funnel.deine-firma.de/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/funnel.deine-firma.de/privkey.pem;

  # An die laufende Trichterwerk-App weiterleiten
  location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

server {
  listen 80;
  server_name funnel.deine-firma.de;
  return 301 https://$host$request_uri;
}
EOF

sudo ln -s /etc/nginx/sites-available/funnel.deine-firma.de.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Die SPA erkennt anhand des `Host`-Headers (`window.location.hostname`), dass es sich um eine Custom-Domain handelt, ruft `/api/public/funnel-by-host` auf und routet automatisch zur `/f/<uuid>`-Ansicht.

## Folgeschritt: vollautomatisches SSL

Für viele Custom-Domains ohne manuelles certbot-Aufrufen:

- **Caddy** als Reverse-Proxy davor — `on_demand_tls` mit `ask`-Endpoint, der gegen `/api/public/funnel-by-host` prüft, ob die Domain verifiziert ist. Caddy holt Let's-Encrypt-Zertifikate dann automatisch beim ersten Aufruf.
- Alternativ: nginx + Lua/cert-manager-Sidecar.

Beides ist deutlich mehr Setup — Empfehlung: erst aktivieren, sobald mehrere zahlende Kunden Custom Domains nutzen.

## DSGVO-Hinweis

Wenn der Kunde die Domain nutzt, läuft Traffic erst durch dessen DNS und dann durch deinen Server. Datenschutzerklärung & AVV sollten das abdecken (subprocessor-Klausel: Trichterwerk hostet den Funnel; SUPERBRAND.marketing als Betreiber).
