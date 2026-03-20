# OriginRP Server
FROM itzg/minecraft-server:java8-jdk

ENV EULA=TRUE
ENV TYPE=PAPER
ENV VERSION=1.12.2
ENV MEMORY=512m

COPY rclone.conf /rclone.conf
COPY backup.sh /backup.sh
COPY restore.sh /restore.sh
COPY start.sh /start.sh

RUN chmod +x /backup.sh /restore.sh /start.sh
RUN ls -la /plugins/

EXPOSE 25565

ENTRYPOINT ["/start.sh"]
