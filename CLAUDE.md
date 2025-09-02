# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pomelo is an automated website building platform with a microservices architecture. It includes:

- **Identity Server**: OpenID Connect authentication server using NestJS and oidc-provider
- **Infrastructure Services**: Backend services for content management, APIs, and business logic
- **Web Client**: Vue.js 2 frontend with admin interface and public-facing pages
- **Shared Packages**: Reusable components and utilities across the platform

## Common Commands

### Development
```bash
# Start web client in development mode
yarn serve:web

# Start identity server with theme build
yarn start:server:identity-server

# Start infrastructure service
yarn start:server:infrastructure-service

# Start infrastructure BFF
yarn start:server:infrastructure-bff
```

### Building
```bash
# Build entire project for production
yarn build:prod

# Build for local development
yarn build:local

# Build only web client
yarn build:web

# Build only servers
yarn build:servers

# Build specific server
yarn build:identity-server
yarn build:server:infrastructure-service
yarn build:server:infrastructure-bff
```

### Testing
```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:cov

# Run e2e tests for specific server
yarn test:e2e:identity-server
yarn test:e2e:infrastructure-service
yarn test:e2e:infrastructure-bff
```

### Code Quality
```bash
# Run linting across all workspaces
yarn lint

# Fix linting issues
yarn lint:fix

# Check linting with no warnings
yarn lint:check

# Format code with Prettier
yarn prettier:all
```

### Submodules
```bash
# Build all submodules (Formily components)
yarn build:submodules

# Clean all submodules
yarn clean:submodules

# Build specific submodule
yarn build:submodules:formily-antdv
yarn build:submodules:formily-vant
```

## Architecture

### Server Structure
- **identity-server/**: OpenID Connect provider using NestJS and oidc-provider
- **infrastructure-service/**: Core business logic and data services
- **infrastructure-bff/**: Backend-for-frontend API layer

### Client Structure
- **clients/web/**: Vue.js 2 application with:
  - Admin interface for managing resources
  - Public-facing pages and forms
  - Form builder using Formily components

### Shared Packages
- **packages/pomelo-authorization/**: Authentication and authorization utilities
- **packages/pomelo-shared/**: Shared types and utilities
- **packages/pomelo-theme/**: Theme and UI components

### Key Technologies
- **Backend**: NestJS, TypeScript, GraphQL, Sequelize ORM, OpenID Connect
- **Frontend**: Vue.js 2, TypeScript, Ant Design Vue, Vant, Formily
- **Database**: MySQL, Redis
- **Authentication**: OpenID Connect, JWT
- **Build Tools**: Webpack, Rollup, Grunt

## Development Notes

### Workspace Structure
This is a Yarn workspace monorepo with workspaces defined in:
- `clients/**` - Frontend applications
- `servers/**` - Backend services  
- `packages/**` - Shared libraries
- `plugins/**` - Plugin modules
- `themes/**` - Theme packages

### Formily Integration
The project uses custom Formily builds located in `.submodules/`:
- Formily Ant Design Vue components
- Formily Vant components  
- Portal components for both UI libraries

### Environment Configuration
- Use `.env.sample` as reference for environment variables
- Local development uses `env/env.local.js`
- Docker configurations available in root directory

### Database
- Uses MySQL with Sequelize ORM
- Redis for caching and sessions
- Connection configuration in server modules

### Branch Strategy
- Main development branch: `master`
- Current working branch: `fix/id-type`