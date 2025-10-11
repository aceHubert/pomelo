# 启用experimental 特性
# DOCKER_CLI_EXPERIMENTAL=enabled
# 创建一个buildx 构建环境
# docker buildx create --use --name mutli-build
# 查看当前构建环境信息，以及支持的架构
# docker buildx inspect --bootstrap
# 构建镜像
# docker buildx build -t hubert007/pomelo:0.0.3 -t hubert007/pomelo:latest --target deploy --cache-from hubert007/pomelo:latest --build-arg BUILD_IGNORE=true --platform linux/amd64,linux/arm64 --push .
# 运行容器
# docker run -it -d -p 3000:3000 -p 3001:3001 -p 3002:3002 -p 3003:3003 --name pomelo-server --rm hubert007/pomelo:0.0.2
# docker network connect --link mysql-default-5.7:mysql mysql_default pomelo-server
# docker network connect --link redis-default-6.2:redis redis_default pomelo-server

# 添加ARG参数，可在docker build时通过 --build-arg BUILD_OPTION="xxx" --build-arg  BUILD_PLATFORM="xxx"传入代码编译命令
# 容器 nodejs 版本
ARG NODE_VERSION="16.14.0-alpine"

FROM --platform=$BUILDPLATFORM node:${NODE_VERSION} AS base
LABEL maintainer="yi.xiang@live.cn"

FROM base AS builder
ADD . /app
WORKDIR /app
# 添加ARG参数，可在docker build时通过 --build-arg BUILD_OPTION="xxx" 传入代码编译命令
# true: 不编译代码，直接使用缓存；false: 编译代码
ARG BUILD_IGNORE="false"
# 编译选项 ${BUILD_OPTION}
ARG BUILD_OPTION="yarn build"

# build projects
RUN if [ "$BUILD_IGNORE" = "true" ]; then \
        set -x ; echo "Build ignored!"; \
    else \
        set -ex && pwd && ls && yarn install --mode=skip-build && ${BUILD_OPTION} && ls; \
    fi

# install runtime files
FROM base AS runtime
COPY --from=builder /app/clients/web/dist /app/clients/web/
COPY --from=builder /app/dist/servers /app/servers/
COPY --from=builder /app/.yarn /app/.yarn/
COPY --from=builder /app/package*.json /app/ecosystem*.config.js /app/.yarnrc.yml /app/yarn.lock /app/

WORKDIR /app
# 安装 Nodejs 运行时文件
# https://v3.yarnpkg.com/cli/workspaces/focus
RUN yarn workspaces focus --production --all

# copy runtime files
FROM base AS deploy
# NODE_ENV 环境
ARG RUNTIME_ENV="production"
# PM2 环境, https://pm2.keymetrics.io/docs/usage/application-declaration/
ARG SERVE_PM2_ENV="production"
# PM2 配置文件
ARG SERVE_PM2_CONFIG="ecosystem.config.js"
COPY --from=runtime /app/servers /app/clients /app/
COPY --from=runtime /app/node_modules /app/node_modules/
COPY --from=runtime /app/${SERVE_PM2_CONFIG} /app/ecosystem.config.js


WORKDIR /app
ENV NODE_ENV=${RUNTIME_ENV}
ENV SERVE_PM2_ENV=${SERVE_PM2_ENV}

RUN npm install -g pm2
# RUN set -ex && \
#   sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
#   npm config set registry https://registry.npm.taobao.org && \
#   npm install -g pm2

EXPOSE 3000 3001 3002 3003
CMD pm2-runtime start ecosystem.config.js --env $SERVE_PM2_ENV
