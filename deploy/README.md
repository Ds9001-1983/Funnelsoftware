# FunnelFlow Deployment Guide

## Voraussetzungen

- Hetzner CX23 (oder ähnlich) mit Ubuntu 24.04
- Domain mit Zugriff auf DNS-Einstellungen
- SSH-Zugang zum Server

---

## Schritt 1: SSH-Key erstellen (auf deinem Mac)

```bash
# SSH-Key generieren
ssh-keygen -t ed25519 -C "deine-email@example.com"

# Public Key anzeigen und bei Hetzner einfügen
cat ~/.ssh/id_ed25519.pub
```

---

## Schritt 2: Server bei Hetzner erstellen

1. Gehe zu [Hetzner Cloud Console](https://console.hetzner.cloud)
2. Neues Projekt erstellen
3. Server hinzufügen:
   - **Standort:** Falkenstein oder Nürnberg
   - **Image:** Ubuntu 24.04
   - **Typ:** CX23 (2 vCPU, 4GB RAM)
   - **SSH-Key:** Deinen Public Key auswählen
4. Server erstellen und IP-Adresse notieren

---

## Schritt 3: DNS konfigurieren

Bei deinem Domain-Anbieter:

```
Typ: A
Name: funnels (oder @ für Hauptdomain)
Wert: DEINE_SERVER_IP
TTL: 300
```

Warte 5-10 Minuten bis DNS propagiert ist.

---

## Schritt 4: Mit Server verbinden

```bash
ssh root@DEINE_SERVER_IP
```

---

## Schritt 5: Setup-Script ausführen

```bash
# Script herunterladen
curl -O https://raw.githubusercontent.com/DEIN-USERNAME/Funnelsoftware/main/deploy/setup-server.sh

# Ausführen
bash setup-server.sh
```

Das Script fragt nach:
- **Domain:** z.B. `funnels.deinedomain.de`
- **E-Mail:** Für SSL-Zertifikat
- **DB-Passwort:** Sicheres Passwort für PostgreSQL
- **Session Secret:** Mind. 32 zufällige Zeichen

---

## Schritt 6: SSL-Zertifikat holen

```bash
certbot --nginx -d funnels.deinedomain.de -m deine@email.de --agree-tos
```

---

## Schritt 7: App deployen

```bash
# Deploy-Script herunterladen
curl -O https://raw.githubusercontent.com/DEIN-USERNAME/Funnelsoftware/main/deploy/deploy.sh

# Repository-URL anpassen (Zeile 12)
nano deploy.sh

# Ausführen
bash deploy.sh
```

---

## Fertig! 🎉

Deine App läuft jetzt unter `https://funnels.deinedomain.de`

---

## Nützliche Befehle

```bash
# App-Status
sudo -u funnelflow pm2 status

# Logs ansehen
sudo -u funnelflow pm2 logs funnelflow

# App neustarten
sudo -u funnelflow pm2 restart funnelflow

# Neu deployen (nach Code-Änderungen)
bash deploy.sh

# Nginx Status
systemctl status nginx

# PostgreSQL Status
systemctl status postgresql
```

---

## Troubleshooting

### App startet nicht
```bash
# Logs prüfen
sudo -u funnelflow pm2 logs funnelflow --lines 50

# Environment prüfen
cat /var/www/funnelflow/.env
```

### Datenbank-Verbindung fehlgeschlagen
```bash
# PostgreSQL Status
systemctl status postgresql

# Manuell testen
sudo -u postgres psql -d funnelflow -c "SELECT 1;"
```

### SSL-Zertifikat erneuern
```bash
# Automatisch (Cron ist bereits eingerichtet)
certbot renew --dry-run

# Manuell
certbot renew
```

### Server-Ressourcen prüfen
```bash
htop          # CPU/RAM
df -h         # Festplatte
free -m       # Speicher
```

---

## Backup

### Datenbank-Backup erstellen
```bash
sudo -u postgres pg_dump funnelflow > backup_$(date +%Y%m%d).sql
```

### Backup wiederherstellen
```bash
sudo -u postgres psql funnelflow < backup_20240115.sql
```

---

## Updates

### System-Updates
```bash
apt update && apt upgrade -y
```

### Node.js Updates
```bash
npm install -g npm@latest
```

### App-Updates
```bash
cd /var/www/funnelflow
bash /root/deploy.sh
```
