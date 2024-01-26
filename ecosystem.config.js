module.exports = {
  apps: [
    {
      name: 'identity-server',
      cwd: 'servers/identity-server',
      script: 'node dist/main.js',
      autorestart: true,
    },
    {
      name: 'identity-api',
      cwd: 'servers/identity-api',
      script: 'node dist/main.js',
      autorestart: true,
    },
    {
      name: 'infrastructure-api',
      cwd: 'servers/infrastructure-api',
      script: 'node dist/main.js',
      autorestart: true,
    },
    {
      name: 'client-admin',
      cwd: 'clients/admin',
      script: 'serve',
      env: {
        PM2_SERVE_PATH: '.',
        PM2_SERVE_PORT: 3011,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html',
      },
    },
    {
      name: 'client-web',
      cwd: 'clients/web',
      script: 'serve',
      env: {
        PM2_SERVE_PATH: '.',
        PM2_SERVE_PORT: 3012,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html',
      },
    },
  ],
};
