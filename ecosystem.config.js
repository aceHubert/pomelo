// show swagger documentation
const SWAGGER_DEBUG = false;
// show graphql playground
const GRAPHQL_DEBUG = false;
// origin
const ORIGIN = 'https://example.com';
// cors origin
const CORS_ORIGIN = [];
// infrastructure database connection
const INFRASTRUCTURE_DATABASE_CONNECTION = 'mysql://user:password@host:port/database';
// identity database connection
const IDENTITY_DATABASE_CONNECTION = 'mysql://user:password@host:port/database';
// redis connection
const REDIS_URL = 'redis://host:port/db';

module.exports = {
  apps: [
    {
      name: 'identity-server',
      cwd: 'identity-server',
      script: 'node dist/main.js',
      autorestart: true,
      env_production: {
        PORT: 3001,
        GLOBAL_PREFIX_URI: '/oauth',
        CORS_ORIGIN: CORS_ORIGIN.join('|'),
        INFRASTRUCTURE_DATABASE_CONNECTION,
        IDENTITY_DATABASE_CONNECTION,
        REDIS_URL,
        OIDC_CLIENT_SECRET: 'client-secret',
        OIDC_ISSUER: ORIGIN + '/oauth',
        ADMIN_URL: ORIGIN + '/admin',
        WEB_URL: ORIGIN,
      },
      env_local: {
        ENV_FILE: '.env.local',
        DEBUG: true,
        PORT: 3001,
        CORS: true,
      },
      env_fly: {
        ENV_FILE: '.env.fly',
        PORT: 3001,
        CORS_ORIGIN: ['https://pomelo-server.fly.dev:3011', 'https://pomelo-server.fly.dev:3012'].join('|'),
        // from fly secrets
        // INFRASTRUCTURE_DATABASE_CONNECTION,
        // IDENTITY_DATABASE_CONNECTION,
        // REDIS_URL,
        OIDC_CLIENT_SECRET: 'client-secret',
      },
    },
    {
      name: 'identity-api',
      cwd: 'identity-api',
      script: 'node dist/main.js',
      autorestart: true,
      env_production: {
        SWAGGER_DEBUG,
        GRAPHQL_DEBUG,
        PORT: 3002,
        GLOBAL_PREFIX_URI: '/identity',
        CORS_ORIGIN: CORS_ORIGIN.join('|'),
        IDENTITY_DATABASE_CONNECTION,
        OIDC_CLIENT_SECRET: 'ZjZiMmM2MzMtNGY5ZS00YjdhLThmMmEtOWE0YjRlOWIwYjliLlg2YWd3OFJvRUM',
        OIDC_ISSUER: ORIGIN + '/oauth',
        OIDC_ORIGIN: ORIGIN + '/identity',
      },
      env_local: {
        ENV_FILE: '.env.local',
        DEBUG: true,
        PORT: 3002,
        CORS: true,
      },
      env_fly: {
        ENV_FILE: '.env.fly',
        SWAGGER_DEBUG: true,
        GRAPHQL_DEBUG: true,
        PORT: 3002,
        CORS_ORIGIN: ['https://pomelo-server.fly.dev:3011', 'https://pomelo-server.fly.dev:3012'].join('|'),
        // from fly secrets
        // INFRASTRUCTURE_DATABASE_CONNECTION,
        // IDENTITY_DATABASE_CONNECTION,
        // REDIS_URL,
        OIDC_CLIENT_SECRET: 'client-secret',
      },
    },
    {
      name: 'infrastructure-api',
      cwd: 'infrastructure-api',
      script: 'node dist/main.js',
      autorestart: true,
      env_production: {
        SWAGGER_DEBUG,
        GRAPHQL_DEBUG,
        PORT: 3003,
        GLOBAL_PREFIX_URI: '/infrastructure',
        CORS_ORIGIN: CORS_ORIGIN.join('|'),
        INFRASTRUCTURE_DATABASE_CONNECTION,
        OIDC_CLIENT_SECRET: 'client-secret',
        OIDC_ISSUER: ORIGIN + '/oauth',
        OIDC_ORIGIN: ORIGIN + '/infrastructure',
      },
      env_local: {
        ENV_FILE: '.env.local',
        DEBUG: true,
        PORT: 3003,
        CORS: true,
      },
      env_fly: {
        ENV_FILE: '.env.fly',
        SWAGGER_DEBUG: true,
        GRAPHQL_DEBUG: true,
        PORT: 3003,
        CORS_ORIGIN: ['https://pomelo-server.fly.dev:3011', 'https://pomelo-server.fly.dev:3012'].join('|'),
        // from fly secrets
        // INFRASTRUCTURE_DATABASE_CONNECTION,
        // IDENTITY_DATABASE_CONNECTION,
        // REDIS_URL,
        OIDC_CLIENT_SECRET: 'client-secret',
      },
    },
    {
      name: 'static-content',
      cwd: 'content',
      script: 'serve',
      env_production: {
        PM2_SERVE_PATH: '.',
        PM2_SERVE_PORT: 3004,
      },
      env_local: {
        PM2_SERVE_PATH: '.',
        PM2_SERVE_PORT: 3004,
      },
      env_fly: {
        PM2_SERVE_PATH: '.',
        PM2_SERVE_PORT: 3004,
      },
    },
    {
      name: 'client-admin',
      cwd: 'client-admin',
      script: 'serve',
      env_production: {
        PM2_SERVE_PATH: '.',
        PM2_SERVE_PORT: 3011,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html',
      },
      env_local: {
        PM2_SERVE_PATH: '.',
        PM2_SERVE_PORT: 3011,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html',
      },
      env_fly: {
        PM2_SERVE_PATH: '.',
        PM2_SERVE_PORT: 3011,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html',
      },
    },
    {
      name: 'client-web',
      cwd: 'client-web',
      script: 'serve',
      env_production: {
        PM2_SERVE_PATH: '.',
        PM2_SERVE_PORT: 3012,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html',
      },
      env_local: {
        PM2_SERVE_PATH: '.',
        PM2_SERVE_PORT: 3012,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html',
      },
      env_fly: {
        PM2_SERVE_PATH: '.',
        PM2_SERVE_PORT: 3012,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html',
      },
    },
  ],
};
