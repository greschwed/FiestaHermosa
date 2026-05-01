# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build (also type-checks)
npm run lint     # eslint
npx tsc --noEmit # type-check without building
```

No test suite exists — verify UI changes manually in the browser.

## Architecture

**Stack:** Next.js 16 (App Router) · React 19 · Firebase v12 · TypeScript

All pages are `'use client'` (no server components in use). The app is mobile-first, max-width 480px, centered on a `#ece4d8` body background.

### Data flow

```
Firebase (fiesta-hermosa project)
  └── users/{uid}/insumos/{id}    ← Insumo documents
  └── users/{uid}/receitas/{id}   ← Receita documents

Legacy collections (original vanilla-JS app, still in Firestore):
  └── materiais/{id}              ← has userId field
  └── receitas/{id}               ← has userId field
```

On first login, `lib/firestore.ts:seedIfEmpty()` runs:
1. Calls `migrateFromLegacy()` — reads old `materiais`/`receitas` where `userId == uid` and writes to new subcollections, preserving document IDs so recipe→ingredient references stay intact.
2. If no legacy data exists and new collections are empty, seeds with mock data from `lib/data.ts`.

### Key files

| File | Purpose |
|---|---|
| `lib/data.ts` | TypeScript interfaces (`Insumo`, `Receita`, `IngredienteReceita`) + mock seed data + `fmtBRL`/`fmtNum` helpers |
| `lib/firebase.ts` | Firebase app init (singleton guard via `getApps()`) |
| `lib/firestore.ts` | All Firestore CRUD scoped per user + migration logic |
| `lib/auth-context.tsx` | `AuthProvider` + `useAuth()` hook; calls `seedIfEmpty` on auth state change |
| `components/AuthGuard.tsx` | Wraps pages — redirects to `/login` if unauthenticated, shows spinner while loading |
| `components/Icon.tsx` | Inline SVG icon library; accepts `name`, `size`, `stroke`, `color`, `style` |
| `app/globals.css` | All design tokens (`--terracotta`, `--bg`, `--ink-*`, etc.) and shared CSS classes (`.btn`, `.card`, `.chip`, `.field`, `.fab`, `.bottomnav`, etc.) |

### Ingredient→Recipe relationship

`IngredienteReceita` stores only `{ id, qtd }` — a reference ID plus quantity. To render recipe ingredients with names/units/costs, join against the `Insumo` array at display time:

```ts
const insumo = insumos.find(i => i.id === ing.id);
const custo = ing.qtd * insumo.custoUn;
```

### Pricing formula

```
precoSugerido = (custoPorcao × (1 + margem/100)) / (1 - taxaApp/100)
custoPorcao   = custoTotal / rendimento
custoTotal    = Σ (ing.qtd × insumo.custoUn)
```

### Auth

Google sign-in uses `signInWithPopup` with automatic fallback to `signInWithRedirect` on popup-blocked errors. `getRedirectResult` is called on mount to handle the redirect return. `authError` is exposed from `useAuth()` with Portuguese error messages.

### Commits

Sign with: `git -c commit.gpgsign=false commit` (codesign MCP requires a GitHub source linked to the session).
