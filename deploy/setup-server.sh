#!/bin/bash
#
# FunnelFlow Server Setup Script für Ubuntu 24.04 (Hetzner CX23)
# Führe dieses Script als root auf dem neuen Server aus
#
# Verwendung: bash setup-server.sh
#

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  FunnelFlow Server Setup${NC}"
echo -e "${GREEN}========================================${NC}"

# Variablen - DIESE ANPASSEN!
read -p "Domain (z.B. funnels.example.com): " DOMAIN
read -p "E-Mail für SSL-Zertifikat: " EMAIL
read -p "PostgreSQL Passwort: " -s DB_PASSWORD
echo ""
read -p "Session Secret (mind. 32 Zeichen): " -s SESSION_SECRET
echo ""

APP_USER="funnelflow"
APP_DIR="/var/www/funnelflow"
DB_NAME="funnelflow"
DB_USER="funnelflow"

echo -e "\n${YELLOW}[1/8] System aktualisieren...${NC}"
apt update && apt upgrade -y

echo -e "\n${YELLOW}[2/8] Basis-Pakete installieren...${NC}"
apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx ufw

echo -e "\n${YELLOW}[3/8] Node.js 20 LTS installieren...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2

echo -e "\n${YELLOW}[4/8] PostgreSQL 16 installieren...${NC}"
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
apt update
apt install -y postgresql-16

echo -e "\n${YELLOW}[5/8] Datenbank einrichten...${NC}"
sudo -u postgres psql <<EOF
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\c ${DB_NAME}
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF

echo -e "\n${YELLOW}[6/8] App-Benutzer und Verzeichnis erstellen...${NC}"
useradd -m -s /bin/bash ${APP_USER} || true
mkdir -p ${APP_DIR}
chown -R ${APP_USER}:${APP_USER} ${APP_DIR}

echo -e "\n${YELLOW}[7/8] Firewall konfigurieren...${NC}"
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

echo -e "\n${YELLOW}[8/8] Nginx konfigurieren...${NC}"
cat > /etc/nginx/sites-available/funnelflow <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

ln -sf /etc/nginx/sites-available/funnelflow /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Environment-Datei erstellen
cat > ${APP_DIR}/.env <<EOF
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}
SESSION_SECRET=${SESSION_SECRET}
NODE_ENV=production
PORT=5000
EOF
chown ${APP_USER}:${APP_USER} ${APP_DIR}/.env
chmod 600 ${APP_DIR}/.env

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Basis-Setup abgeschlossen!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Nächste Schritte:"
echo -e "1. DNS A-Record für ${DOMAIN} auf Server-IP setzen"
echo -e "2. SSL-Zertifikat holen: ${YELLOW}certbot --nginx -d ${DOMAIN} -m ${EMAIL} --agree-tos${NC}"
echo -e "3. App deployen mit: ${YELLOW}bash deploy.sh${NC}"
echo ""
echo -e "Database URL: postgresql://${DB_USER}:****@localhost:5432/${DB_NAME}"
echo -e "App-Verzeichnis: ${APP_DIR}"
echo ""
