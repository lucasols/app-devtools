# app-devtools

An in-app devtools panel for inspecting network calls (API requests and websocket events), built with SolidJS. It is published as the `app-devtools` npm library, consumed by host apps via `initializeDevTools()`, `addCall()`, and `addWebsocketEvent()` exported from `src/main.ts`.

## Stack

- SolidJS + solid-styled-components (with `babel-plugin-solid-labels`)
- TypeScript (strict), built with Vite (app/dev) and tsup (type declarations)
- pnpm as package manager
- Vitest for tests (currently `test:run` is a no-op)

## Structure

- `src/main.ts` — library entry point; also bootstraps a local dev playground when running `pnpm dev`
- `src/initializeDevTools.ts` / `src/initializeApp.tsx` — devtools setup and dev playground initialization
- `src/pages/` — UI pages (`app`, `api-explorer`)
- `src/stores/` — state (`callsStore.ts` for calls/websocket events, `uiStore.ts`)
- `src/components/`, `src/utils/`, `src/style/`, `src/types/` — shared UI, helpers, styling, types
- `src/mocks/` — mock data for local development (e.g. from `jestorRequests.har`, converted via `pnpm convert-har`)
- `scripts/` — build/deploy helper scripts

## Commands

- `pnpm dev` — run the dev playground with Vite
- `pnpm lint` — ESLint (`--max-warnings 0`) + typecheck (`tsc -p tsconfig.prod.json`)
- `pnpm build` — lint + Vite build + tsup `--dts-only`
- `pnpm deploy` — check git sync, build, and publish to npm

## Conventions

- Path alias `@src/*` maps to `src/*`
- Type-safe code: no `any`, no `as` casts (except `as const`), no non-null assertions, no `@ts-expect-error`/`@ts-ignore`
- Fix lint errors instead of adding `eslint-disable` comments
