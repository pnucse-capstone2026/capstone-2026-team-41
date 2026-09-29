#!/bin/sh
# nginx: Railway PORT로 받아서 ZAP(8090)에 Host: localhost 로 전달
# → ZAP DNS rebinding 리다이렉트 완전 우회
PORT=${PORT:-8080}
sed -i "s/PORT_PLACEHOLDER/$PORT/" /etc/nginx/sites-available/default
nginx

# ZAP은 8090 내부 포트로 기동
exec zap.sh -Xmx512m \
  -daemon \
  -host 0.0.0.0 \
  -port 8090 \
  -config api.disablekey=true \
  -config api.addrs.addr.name=.* \
  -config api.addrs.addr.regex=true \
  -config api.addrs.addr.enabled=true
