# OriginRP Server
FROM itzg/minecraft-server:java17

ENV EULA=TRUE
ENV TYPE=PAPER
ENV VERSION=1.12.2
ENV MEMORY=512m

COPY rclone.conf /rclone.conf
COPY backup.sh /backup.sh
COPY restore.sh /restore.sh
COPY start.sh /start.sh

RUN chmod +x /backup.sh /restore.sh /start.sh

# Créer le dossier plugins et copier les JARs
RUN mkdir -p /plugins
COPY plugins/ /plugins/

EXPOSE 25565

ENTRYPOINT ["/start.sh"]
