module.exports = {
  apps: [
    {
      name: 'infrastructure-service',
      cwd: 'infrastructure-service',
      script: 'node dist/main.js',
      autorestart: true,
      env_production: {
        PORT: 3001,
        TCP_PORT: 3000,
      },
    },
    {
      name: 'infrastructure-bff',
      cwd: 'infrastructure-bff',
      script: 'node dist/main.js',
      autorestart: true,
      env_production: {
        PORT: 3002,
        INFRASTRUCTURE_SERVICE_PORT: 3000,
      },
    },
    {
      name: 'identity-server',
      cwd: 'identity-server',
      script: 'node dist/main.js',
      autorestart: true,
      env_production: {
        PORT: 3003,
        OIDC_PATH: '/oauth2',
        INFRASTRUCTURE_SERVICE_PORT: 3000,
        WEB_URL: 'https://pomelo-client.fly.dev:3011',
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
    },
    {
      name: 'web',
      cwd: 'web',
      script: 'serve',
      env_production: {
        PM2_SERVE_PATH: '.',
        PM2_SERVE_PORT: 3011,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html',
      },
    },
  ],
};
