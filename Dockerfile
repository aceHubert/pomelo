# DOCKER_BUILDKIT=1 docker build -t hubert007/pomelo:0.0.2 -t hubert007/pomelo:latest --target deploy --cache-from hubert007/pomelo:latest --build-arg BUILD_IGNORE=true --build-arg BUILDKIT_INLINE_CACHE=1 .
# docker run -it -d -p -p 3001:3001 -p 3002:3002 -p 3003:3003 -p 3004:3004 -p 3011:3011 --name pomelo-server --rm hubert007/pomelo:0.0.2
# docker network connect --link mysql-default-5.7:mysql mysql_default pomelo-server
# docker network connect --link redis-default-6.2:redis redis_default pomelo-server

# 添加ARG参数，可在docker build时通过 --build-arg BUILD_OPTION="xxx" --build-arg  BUILD_PLATFORM="xxx"传入代码编译命令
# 容器 nodejs 版本
ARG NODE_VERSION="16.14.0-alpine"
# 编译平台架构
ARG BUILD_PLATFORM="linux/amd64"

FROM --platform=${BUILD_PLATFORM} node:${NODE_VERSION} AS builder
ADD . /app
WORKDIR /app
# 添加ARG参数，可在docker build时通过 --build-arg BUILD_OPTION="xxx" 传入代码编译命令
# true: 不编译代码，直接使用缓存；false: 编译代码
ARG BUILD_IGNORE="false"
# 编译选项 yarn ${BUILD_OPTION}
ARG BUILD_OPTION="build:prod"

# build projects
RUN if [ "$BUILD_IGNORE" = "true" ]; then \
        set -x ; echo "Build ignored!"; \
    else \
        set -ex && pwd && ls && yarn install --mode=skip-build && yarn ${BUILD_OPTION} && ls; \
    fi

# install runtime files
FROM --platform=${BUILD_PLATFORM} node:${NODE_VERSION} AS runtime
COPY --from=builder /app/clients/vue-web/dist /app/clients/web/
COPY --from=builder /app/dist/servers /app/servers/
COPY --from=builder /app/package*.json /app/
COPY --from=builder /app/.yarn /app/.yarn/
COPY --from=builder /app/.yarnrc.yml /app/
COPY --from=builder /app/yarn.lock /app/

WORKDIR /app
# 安装 Nodejs 运行时文件
# https://v3.yarnpkg.com/cli/workspaces/focus
RUN yarn workspaces focus --production --all

# copy runtime files
FROM --platform=${BUILD_PLATFORM} node:${NODE_VERSION} AS deploy
COPY --from=runtime /app/servers /app/clients /app/
COPY --from=runtime /app/node_modules /app/node_modules/

# NODE_ENV 环境
ARG RUNTIME_ENV="production"
# PM2 环境, https://pm2.keymetrics.io/docs/usage/application-declaration/
ARG SERVE_ENV="production"
# 运行指定应用
ARG SERVE_APPS=""

WORKDIR /app
ENV NODE_ENV=${RUNTIME_ENV}
ENV SERVE_ENV=${SERVE_ENV}
ENV SERVE_APPS=${SERVE_APPS}

RUN npm install -g pm2
# RUN set -ex && \
#   sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
#   npm config set registry https://registry.npm.taobao.org && \
#   npm install -g pm2

EXPOSE 3001-3004 3011
CMD if [ "$SERVE_APPS" = "" ]; then \
      pm2-runtime start conf/ecosystem.config.js --env $SERVE_ENV; \
    else \
      pm2-runtime start conf/ecosystem.config.js --only "$SERVE_APPS" --env $SERVE_ENV; \
    fi
