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
// identity api client secret
const IDENTITY_API_CLIENT_SECRET = 'identity api client secret';
// infrastructure api client secret
const INFRASTRUCTURE_API_CLIENT_SECRET = 'infrastructure api clientsecret';

module.exports = {
  apps: [
    {
      name: 'identity-server',
      cwd: 'identity-server',
      script: 'node dist/main.js',
      autorestart: true,
      env_production: {
        PORT: 3001,
        ORIGIN,
        GLOBAL_PREFIX_URI: '/oauth',
        CORS_ORIGIN: CORS_ORIGIN.join('|'),
        INFRASTRUCTURE_DATABASE_CONNECTION,
        IDENTITY_DATABASE_CONNECTION,
        REDIS_URL,
        OIDC_CLIENT_SECRET: IDENTITY_SERVER_CLIENT_SECRET,
      },
      env_fly: {
        PORT: 3001,
        ORIGIN: 'https://pomelo-server.fly.dev',
        GLOBAL_PREFIX_URI: '/oauth',
        CORS_ORIGIN: [].join('|'),
        // from fly secrets
        // INFRASTRUCTURE_DATABASE_CONNECTION,
        // IDENTITY_DATABASE_CONNECTION,
        // REDIS_URL,
        OIDC_CLIENT_SECRET: process.env.IDENTITY_SERVER_CLIENT_SECRET,
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
        ORIGIN,
        GLOBAL_PREFIX_URI: '/identity',
        CORS_ORIGIN: CORS_ORIGIN.join('|'),
        IDENTITY_DATABASE_CONNECTION,
        OIDC_ISSUER: ORIGIN + '/oauth',
        OIDC_CLIENT_SECRET: IDENTITY_API_CLIENT_SECRET,
      },
      env_fly: {
        SWAGGER_DEBUG: true,
        GRAPHQL_DEBUG: true,
        PORT: 3002,
        ORIGIN: 'https://pomelo-server.fly.dev',
        GLOBAL_PREFIX_URI: '/identity',
        CORS_ORIGIN: [].join('|'),
        // from fly secrets
        // IDENTITY_DATABASE_CONNECTION,
        OIDC_ISSUER: 'https://pomelo-server.fly.dev/oauth',
        OIDC_CLIENT_SECRET: process.env.IDENTITY_API_CLIENT_SECRET,
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
        ORIGIN,
        GLOBAL_PREFIX_URI: '/infrastructure',
        CORS_ORIGIN: CORS_ORIGIN.join('|'),
        INFRASTRUCTURE_DATABASE_CONNECTION,
        OIDC_ISSUER: ORIGIN + '/oauth',
        OIDC_CLIENT_SECRET: INFRASTRUCTURE_API_CLIENT_SECRET,
      },
      env_fly: {
        SWAGGER_DEBUG: true,
        GRAPHQL_DEBUG: true,
        PORT: 3003,
        ORIGIN: 'https://pomelo-server.fly.dev',
        CORS_ORIGIN: [].join('|'),
        // from fly secrets
        // INFRASTRUCTURE_DATABASE_CONNECTION,
        OIDC_ISSUER: 'https://pomelo-server.fly.dev/oauth',
        OIDC_CLIENT_SECRET: process.env.INFRASTRUCTURE_API_CLIENT_SECRET,
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
