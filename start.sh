#!/bin/bash

# Installer rclone
curl https://rclone.org/install.sh | bash

# Restaurer depuis Google Drive
bash /restore.sh

# Si pas de monde existant, extraire le monde pré-généré
if [ ! -d "/data/world" ]; then
    echo "[OriginRP] Extraction du monde pré-généré..."
    unzip /world.zip -d /data/
    chmod -R 777 /data/world /data/world_nether /data/world_the_end
    echo "[OriginRP] Monde extrait !"
else
    echo "[OriginRP] Monde existant trouvé, pas d'extraction"
fi

# Lancer les backups toutes les 30min en arrière-plan
while true; do
    sleep 1800
    bash /backup.sh
done &

# Démarrer le serveur Minecraft
exec /start
