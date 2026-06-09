FROM redis:7.2-alpine

WORKDIR /redis

COPY init.sh ./

RUN apk add --no-cache gettext && chmod +x init.sh
