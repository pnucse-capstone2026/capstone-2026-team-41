FROM ghcr.io/zaproxy/zaproxy:stable

USER root
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

COPY nginx.conf /etc/nginx/sites-available/default

COPY --chmod=755 start-zap.sh /start-zap.sh

ENTRYPOINT ["/start-zap.sh"]

EXPOSE 8080
