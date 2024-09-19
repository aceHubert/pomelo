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
// identity server client secret
const IDENTITY_SERVER_CLIENT_SECRET = 'identity server client secret';
// infrastructure bff client secret
const INFRASTRUCTURE_BFF_CLIENT_SECRET = 'infrastructure bff client secret';

module.exports = {
  apps: [
    {
      name: 'identity-server',
      cwd: 'identity-server',
      script: 'node dist/main.js',
      autorestart: true,
      env_production: {
        PORT: 3001,
        INFRASTRUCTURE_SERVICE_PORT: 3002,
        ORIGIN,
        GLOBAL_PREFIX_URI: '/oauth2',
        CORS_ORIGIN: CORS_ORIGIN.join('|'),
        IDENTITY_DATABASE_CONNECTION,
        REDIS_URL,
        OIDC_CLIENT_SECRET: IDENTITY_SERVER_CLIENT_SECRET,
      },
      env_fly: {
        PORT: 3001,
        INFRASTRUCTURE_SERVICE_PORT: 3002,
        ORIGIN: 'https://pomelo-server.fly.dev',
        GLOBAL_PREFIX_URI: '/oauth2',
        CORS_ORIGIN: [].join('|'),
        // from fly secrets
        // IDENTITY_DATABASE_CONNECTION,
        // REDIS_URL,
        OIDC_CLIENT_SECRET: process.env.IDENTITY_SERVER_CLIENT_SECRET,
      },
    },
    {
      name: 'infrastructure-service',
      cwd: 'infrastructure-service',
      script: 'node dist/main.js',
      autorestart: true,
      env_production: {
        SWAGGER_DEBUG,
        PORT: 3002,
        CORS_ORIGIN: CORS_ORIGIN.join('|'),
        INFRASTRUCTURE_DATABASE_CONNECTION,
      },
      env_fly: {
        SWAGGER_DEBUG: true,
        PORT: 3002,
        CORS_ORIGIN: [].join('|'),
        // from fly secrets
        // INFRASTRUCTURE_DATABASE_CONNECTION,
      },
    },
    {
      name: 'infrastructure-bff',
      cwd: 'infrastructure-bff',
      script: 'node dist/main.js',
      autorestart: true,
      env_production: {
        SWAGGER_DEBUG,
        GRAPHQL_DEBUG,
        PORT: 3003,
        INFRASTRUCTURE_SERVICE_PORT: 3002,
        GLOBAL_PREFIX_URI: '/infrastructure',
        CORS_ORIGIN: CORS_ORIGIN.join('|'),
        OIDC_ISSUER: ORIGIN + '/oauth2',
        OIDC_CLIENT_SECRET: INFRASTRUCTURE_BFF_CLIENT_SECRET,
      },
      env_fly: {
        SWAGGER_DEBUG: true,
        GRAPHQL_DEBUG: true,
        PORT: 3003,
        INFRASTRUCTURE_SERVICE_PORT: 3002,
        CORS_ORIGIN: [].join('|'),
        OIDC_ISSUER: 'https://pomelo-server.fly.dev/oauth2',
        OIDC_CLIENT_SECRET: process.env.INFRASTRUCTURE_BFF_CLIENT_SECRET,
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
      env_fly: {
        PM2_SERVE_PATH: '.',
        PM2_SERVE_PORT: 3004,
      },
    },
    {
      name: 'client-web',
      cwd: 'client-web',
      script: 'serve',
      env_production: {
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
  ],
};
