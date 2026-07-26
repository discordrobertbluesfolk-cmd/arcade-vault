# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — a platform for playing games online and competing for points (see README.md, in Spanish).

The project follows **Spec Driven Design** using `/spec` and `/spec-impl` commands from the `Klerith/fernando-skills` skill pack (installed via `npx skills@latest add Klerith/fernando-skills`). If those commands aren't available in this session, check whether the skill pack is installed before improvising a spec workflow.

The codebase is currently the unmodified `create-next-app` scaffold — no game logic, routes, or data layer exist yet.

## Commands

- `npm run dev` — start dev server (Turbopack, stable by default in Next 16)
- `npm run build` — production build (Turbopack by default; fails if a webpack config is detected — see the Next 16 upgrade doc for options)
- `npm run start` — run the production build
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`). Note: `next lint` was removed in Next 16; this project already invokes the ESLint CLI directly.

No test framework is configured yet.

## Architecture notes

- Next.js **16.2.12** on the **App Router**, React 19.2. This is a newer major version than what most training data reflects — breaking changes vs. Next.js 14/15 are real (not hallucinations to correct). Before implementing anything non-trivial, check `node_modules/next/dist/docs/01-app/` for the current API (this is already enforced via `AGENTS.md`).
- Notable v16 changes likely to matter as this project grows:
  - `middleware.ts` is renamed to `proxy.ts` (export `proxy`, not `middleware`); edge runtime is not supported in `proxy`.
  - `cookies`, `headers`, `draftMode`, `params`, and `searchParams` are fully async-only (no sync fallback).
  - PPR is now opt-in via top-level `cacheComponents` in `next.config.ts`, replacing `experimental.ppr` / `experimental.dynamicIO` / `experimental.useCache`.
  - `revalidateTag` requires a second `cacheLife` profile argument; `updateTag` gives read-your-writes semantics in Server Actions.
  - Parallel route slots (`@slot`) require an explicit `default.js`.
- Styling: Tailwind CSS v4 via `@tailwindcss/postcss` (see `postcss.config.mjs`), configured through the `@theme inline` block in `app/globals.css` rather than a `tailwind.config.js` file.
- Path alias `@/*` maps to the repo root (`tsconfig.json`).
- Fonts (Geist Sans/Mono) are loaded via `next/font/google` in `app/layout.tsx` and exposed as CSS variables consumed by the Tailwind theme.
