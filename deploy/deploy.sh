#!/bin/bash
#
# FunnelFlow Deployment Script
# Führe dieses Script auf dem Server aus um die App zu deployen
#
# Verwendung: bash deploy.sh
#

set -e

# Konfiguration
APP_DIR="/var/www/funnelflow"
APP_USER="funnelflow"
REPO_URL="https://github.com/DEIN-USERNAME/Funnelsoftware.git"  # ANPASSEN!
BRANCH="main"  # oder dein Branch

# Farben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  FunnelFlow Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

cd ${APP_DIR}

# Falls Repo noch nicht geklont
if [ ! -d ".git" ]; then
    echo -e "\n${YELLOW}Repository klonen...${NC}"
    sudo -u ${APP_USER} git clone ${REPO_URL} .
else
    echo -e "\n${YELLOW}Updates pullen...${NC}"
    sudo -u ${APP_USER} git fetch origin
    sudo -u ${APP_USER} git reset --hard origin/${BRANCH}
fi

echo -e "\n${YELLOW}Dependencies installieren...${NC}"
sudo -u ${APP_USER} npm ci

echo -e "\n${YELLOW}App bauen...${NC}"
sudo -u ${APP_USER} npm run build

echo -e "\n${YELLOW}Datenbank migrieren...${NC}"
sudo -u ${APP_USER} npx drizzle-kit push

echo -e "\n${YELLOW}PM2 Prozess starten/neustarten...${NC}"
# PM2 ecosystem file erstellen
cat > ${APP_DIR}/ecosystem.config.js <<'EOF'
module.exports = {
  apps: [{
    name: 'funnelflow',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
EOF
chown ${APP_USER}:${APP_USER} ${APP_DIR}/ecosystem.config.js

# Als App-User PM2 starten
sudo -u ${APP_USER} bash -c "cd ${APP_DIR} && pm2 delete funnelflow 2>/dev/null || true && pm2 start ecosystem.config.js"

# PM2 beim Boot starten
sudo -u ${APP_USER} pm2 save
env PATH=$PATH:/usr/bin pm2 startup systemd -u ${APP_USER} --hp /home/${APP_USER}

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment erfolgreich!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Status prüfen: ${YELLOW}sudo -u ${APP_USER} pm2 status${NC}"
echo -e "Logs ansehen:  ${YELLOW}sudo -u ${APP_USER} pm2 logs funnelflow${NC}"
echo ""
