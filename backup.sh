#!/bin/bash

echo "[Backup] Démarrage du backup..."

# Remplacer le token par la variable d'environnement
sed -i "s/RCLONE_GDRIVE_TOKEN_PLACEHOLDER/$RCLONE_GDRIVE_TOKEN/" /rclone.conf

# Upload vers Google Drive
rclone sync /data gdrive:OriginRP-Backup/$GDRIVE_FOLDER_ID \
  --config /rclone.conf \
  --exclude "*.lock" \
  --log-level INFO

echo "[Backup] Backup terminé !"
