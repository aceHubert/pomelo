# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by Yarn workspaces (Node 16.20.2). Key folders:
  - `clients/web` — Vue 2 app (SPA) and assets.
  - `servers/` — NestJS services: `identity-server`, `infrastructure-bff`, `infrastructure-service`.
  - `packages/` — Reusable libs (e.g., `antdv-layout-pro`, `pomelo-theme`, `pomelo-shared`).
  - `scripts/` — repo tooling (prettier, builds), `themes/` — style assets, `dist/` — build output.

## Build, Test, and Development Commands
- Use Yarn 3.2: `corepack enable && nvm use && yarn -v`.
- Web dev: `yarn serve:web` — run `clients/web` locally.
- Start servers (watch):
  - `yarn start:infrastructure-service`
  - `yarn start:infrastructure-bff`
  - `yarn start:identity-server`
- Build all: `yarn build:infrastructures` and `yarn build:web`.
- Build all with oidc: `yarn build:infrastructures` and `yarn build:identity-server` and `yarn build:web:oidc`.
- Tests: `yarn test` | watch `yarn test:watch` | coverage `yarn test:cov`.
- Lint/format: `yarn lint` | fix `yarn lint:fix` | `yarn prettier:all`.
- Optional local stack: `docker-compose up -d` (see `docker-compose.yml`).

## Coding Style & Naming Conventions
- EditorConfig: 2‑space indent, LF, UTF‑8; trim trailing whitespace.
- Prettier: width 120, single quotes, semicolons, trailing commas.
- ESLint: TypeScript/JS/Vue rules; import ordering enforced.
- Stylelint for CSS/LESS in packages/themes.
- Naming:
  - TS/JS files: `kebab-case` for filenames; `PascalCase` for Vue/Nest classes; `camelCase` for vars.
  - Tests: `*.spec.ts` next to the unit under test.

## Testing Guidelines
- Framework: Jest (+ ts-jest). Keep unit tests fast and isolated.
- Place specs alongside sources or in `__tests__` when integration oriented.
- Minimum: include happy path, edge cases, and failure handling. Aim for meaningful coverage over a number.
- E2E samples: `yarn test:e2e:identity-server` and `yarn test:e2e:infrastructure-service` and `yarn test:e2e:infrastructure-bff`.

## Commit & Pull Request Guidelines
- Conventional Commits enforced by commitlint. Use `yarn commit` (Commitizen) to compose messages.
  - Examples: `feat(server): add health endpoint`, `fix(web): correct login redirect`.
- PRs: include purpose, scope, linked issues, and run screenshots for UI changes. List breaking changes and migration notes.
- Ensure CI‑passing: lint, tests, and builds succeed before requesting review.

## Security & Configuration
- Never commit secrets. Start from `.env.sample` and create local overrides (e.g., `.env.docker.local`).
- Prefer env‑driven config for servers; review `nest-cli*.json` and `ecosystem*.config.js` when deploying.
