# DOCKER_BUILDKIT=1 docker build -t hubert007/pomelo:0.0.1 -t hubert007/pomelo:latest --target deploy --cache-from hubert007/pomelo:latest --build-arg BUILD_IGNORE=true --build-arg BUILDKIT_INLINE_CACHE=1 .
# docker run -it -d -p 3001:3001 -p 3002:3002 -p 3003:3003 -p 3011:3011 -p 3012:3012 -e ENV_FILE=.env.local --name pomelo-server --rm hubert007/pomelo:0.0.1

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
ARG BUILD_OPTION="build"

# 编译 Nodejs 文件
RUN if [ "$BUILD_IGNORE" = "true" ]; then \
        set -x ; echo "Build ignored!"; \
    else \
        set -ex && pwd && ls && yarn install --mode=skip-build && yarn ${BUILD_OPTION} && ls; \
    fi

FROM --platform=${BUILD_PLATFORM} node:${NODE_VERSION} AS runtime
COPY --from=builder /app/packages /app/packages/
COPY --from=builder /app/servers /app/servers/
COPY --from=builder /app/clients/vue-admin/dist /app/clients/client-admin/
COPY --from=builder /app/clients/vue-web/dist /app/clients/client-web/
COPY --from=builder /app/ecosystem.config.js /app/
COPY --from=builder /app/nginx.conf /app/
COPY --from=builder /app/package*.json /app/
COPY --from=builder /app/.yarn /app/.yarn/
COPY --from=builder /app/.yarnrc.yml /app/
COPY --from=builder /app/yarn.lock /app/

# 删除不必要的文件(安装依赖前，减小 node_modules 文件大小)
RUN rm -rf /app/packages/antdv-layout-pro \
        /app/packages/pomelo-shared-client \
        /app/packages/pomelo-theme \
        /app/packages/*/src \
        /app/servers/*/src

WORKDIR /app
# 安装 Nodejs 运行时文件
# https://v3.yarnpkg.com/cli/workspaces/focus
RUN yarn workspaces focus --production --all

# 删除不必要的文件(安装依赖后，依赖文件)
RUN find /app/packages/*/babel.config.js \
        /app/packages/*/builder.config.ts \
        /app/packages/*/Gruntfile.js \
        /app/packages/*/tsconfig.json \
        /app/packages/*/tsconfig.*.json \
        /app/servers/*/package.json \
        /app/servers/*/tsconfig.json \
        /app/servers/*/tsconfig.*.json \
        -type f | xargs rm -rf

FROM --platform=${BUILD_PLATFORM} node:${NODE_VERSION} AS deploy
COPY --from=runtime /app/servers /app/clients /app/ecosystem.config.js /app/nginx.conf /app/
COPY --from=runtime /app/packages /app/packages/
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

EXPOSE 3001-3004 3011-3012
CMD if [ "$SERVE_APPS" = "" ]; then \
      pm2-runtime start ecosystem.config.js --env $SERVE_ENV; \
    else \
      pm2-runtime start ecosystem.config.js --only "$SERVE_APPS" --env $SERVE_ENV; \
    fi
