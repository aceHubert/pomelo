#!/bin/sh
set -eu

# WARNING overcommit_memory is set to 0! Background save may fail under low memory condition.
# To fix this issue add 'vm.overcommit_memory = 1' to /etc/sysctl.conf and then reboot
# or run the command 'sysctl vm.overcommit_memory=1' for this to take effect.
# The overcommit_memory has 3 options.
# 0, the system kernel check if there is enough memory to be allocated to the process or not, 
# if not enough, it will return errors to the process.
# 1, the system kernel is allowed to allocate the whole memory to the process
# no matter what the status of memory is.
# 2, the system kernel is allowed to allocate a memory whose size could be bigger than
# the sum of the size of physical memory and the size of exchange workspace to the process.
sysctl vm.overcommit_memory=1

: "${REDIS_USER:=default}"
: "${REDIS_PORT:=6379}"
: "${REDIS_DB:=0}"
: "${REDIS_PASSWORD:?REDIS_PASSWORD is required}"
: "${REDIS_SENTINEL_PORT:=26379}"
: "${REDIS_SENTINEL_MASTER_NAME:=mymaster}"
: "${REDIS_SENTINEL_MASTER_HOST:=127.0.0.1}"
: "${REDIS_SENTINEL_QUORUM:=2}"

config_file=/usr/local/etc/redis/redis.conf
template_file=/usr/local/etc/redis/redis.conf.template
sentinel_config_file=/usr/local/etc/redis/redis-sentinel.conf
sentinel_template_file=/usr/local/etc/redis/redis-sentinel.conf.template

if [ -f "$template_file" ]; then
  envsubst '${REDIS_PORT} ${REDIS_USER} ${REDIS_PASSWORD}' \
    < "$template_file" \
    > "$config_file"
elif [ ! -f "$config_file" ]; then
  echo "Redis config file is missing: $config_file" >&2
  exit 1
fi

if [ -f "$sentinel_template_file" ]; then
  envsubst '${REDIS_SENTINEL_PORT} ${REDIS_SENTINEL_MASTER_NAME} ${REDIS_SENTINEL_MASTER_HOST} ${REDIS_SENTINEL_QUORUM} ${REDIS_PORT} ${REDIS_USER} ${REDIS_PASSWORD}' \
    < "$sentinel_template_file" \
    > "$sentinel_config_file"
fi

# Start redis server
redis-server "$config_file" --loglevel warning --bind 0.0.0.0
