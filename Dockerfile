# DOCKER_BUILDKIT=1 docker build -t pomelo:0.0.2 --target deploy --cache-from pomelo:0.0.1 --build-arg BUILD_IGNORE=true --build-arg BUILDKIT_INLINE_CACHE=1 .
# docker run -it -d -p 3001:3001 -p 3002:3002 -p 3003:3003 -p 3011:3011 -p 3012:3012 -e ENV_FILE=.env.local --name pomelo-dev --rm pomelo:0.0.2

# 添加ARG参数，可在docker build时通过 --build-arg BUILD_OPTION="xxx" 传入代码编译命令
ARG NODE_VERSION="16.14.0-alpine"
# true: 不编译代码，直接使用缓存；false: 编译代码
ARG BUILD_IGNORE="false"
# 编译选项 yarn build:${BUILD_OPTION}
ARG BUILD_OPTION="servers"
# 运行环境
ARG RUNTIME_ENV="production"
# 运行指定应用
ARG RUNTIME_APPS="identity-server,identity-api,infrastructure-api,client-admin,client-web"

FROM node:${NODE_VERSION} AS builder
ADD . /app
WORKDIR /app
# 添加ARG参数，可在docker build时通过 --build-arg BUILD_OPTION="xxx" 传入代码编译命令
ARG BUILD_IGNORE
ARG BUILD_OPTION

# 编译 Nodejs 文件
RUN if [ "$BUILD_IGNORE" = "true" ]; then \
        set -x ; echo "Build ignored!"; \
    else \
        set -ex && pwd && ls && yarn install --mode=skip-build && yarn build:${BUILD_OPTION} && ls; \
    fi

FROM node:${NODE_VERSION} AS runtime
COPY --from=builder /app/packages /app/packages/
COPY --from=builder /app/servers /app/servers/
COPY --from=builder /app/clients/vue-admin/dist /app/clients/admin/
COPY --from=builder /app/clients/vue-web/dist /app/clients/web/
COPY --from=builder /app/ecosystem.config.js /app/
COPY --from=builder /app/package*.json /app/
COPY --from=builder /app/.yarn /app/.yarn/
COPY --from=builder /app/.yarnrc.yml /app/
COPY --from=builder /app/yarn.lock /app/
RUN find /app/packages/*/babel.config.js \
        /app/packages/*/builder.config.ts \
        /app/packages/*/Gruntfile.js \
        /app/packages/*/tsconfig.json \
        /app/packages/*/tsconfig.*.json \
        /app/servers/*/tsconfig.json \
        /app/servers/*/tsconfig.*.json \
        -type f | xargs rm -rf && \
    rm -rf /app/packages/antdv-layout-pro \
        /app/packages/pomelo-shared-client \
        /app/packages/pomelo-theme \
        /app/packages/*/src \
        /app/servers/*/src \
        /app/servers/identity-server/public/style/less

ARG RUNTIME_ENV

WORKDIR /app
ENV NODE_ENV=${RUNTIME_ENV}
# 安装 Nodejs 运行时文件
# https://v3.yarnpkg.com/cli/workspaces/focus
RUN yarn workspaces focus --production --all

FROM node:${NODE_VERSION} AS deploy
COPY --from=runtime /app/packages /app/packages/
COPY --from=runtime /app/servers /app/servers/
COPY --from=runtime /app/clients /app/clients/
COPY --from=runtime /app/node_modules /app/node_modules/
COPY --from=runtime /app/ecosystem.config.js /app/
COPY --from=runtime /app/package*.json /app/

ARG RUNTIME_ENV
ARG RUNTIME_APPS

WORKDIR /app
ENV NODE_ENV=${RUNTIME_ENV}
ENV RUNTIME_APPS=${RUNTIME_APPS}

RUN npm install -g pm2
# RUN set -ex && \
#   sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
#   npm config set registry https://registry.npm.taobao.org && \
#   npm install -g pm2

EXPOSE 3001-3003 3011-3012
CMD pm2-runtime start ecosystem.config.js --only ${RUNTIME_APPS}
