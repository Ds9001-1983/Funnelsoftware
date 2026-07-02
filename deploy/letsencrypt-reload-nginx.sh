#!/bin/bash
# Nach jeder erfolgreichen Zertifikats-Erneuerung nginx neu laden, damit die
# neuen Zert-Dateien aktiv werden. Webroot-Renewals (Custom Domains) reloaden
# nginx nicht von selbst — nur der certbot-nginx-Installer täte das.
# Ziel: /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh (chmod +x)
systemctl reload nginx
