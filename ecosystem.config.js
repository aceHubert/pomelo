module.exports = {
  apps: [
    {
      name: 'infrastructure-service',
      cwd: 'infrastructure-service',
      script: 'dist/main.js',
      interpreter: 'node',
      args: '--sync',
      autorestart: true,
      env_production: {
        PORT: 3000,
        TCP_PORT: 3001,
      },
    },
    {
      name: 'infrastructure-bff',
      cwd: 'infrastructure-bff',
      script: 'node dist/main.js',
      autorestart: true,
      env_production: {
        PORT: 3002,
        INFRASTRUCTURE_SERVICE_PORT: 3001,
      },
    },
    {
      name: 'nginx',
      cwd: '.',
      script: './scripts/start-nginx.sh',
      interpreter: '/bin/sh',
      autorestart: true,
      env_production: {
        NGINX_PORT: 80,
      },
    },
  ],
};
