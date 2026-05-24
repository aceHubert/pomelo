#!/bin/sh
set -eu

: "${NGINX_PORT:=80}"
: "${NGINX_WORKER_PROCESSES:=auto}"
: "${NGINX_KEEPALIVE_TIMEOUT:=65}"
: "${NGINX_CLIENT_MAX_BODY_SIZE:=100M}"

mkdir -p /etc/nginx/conf.d /run/nginx /var/log/nginx /var/lib/nginx/tmp

envsubst '${NGINX_WORKER_PROCESSES} ${NGINX_KEEPALIVE_TIMEOUT} ${NGINX_CLIENT_MAX_BODY_SIZE}' \
  < /app/nginx/nginx.conf.template \
  > /etc/nginx/nginx.conf
envsubst '${NGINX_PORT}' \
  < /app/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
