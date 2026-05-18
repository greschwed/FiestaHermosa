# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Next.js version note:** This project uses Next.js 16 — APIs, conventions, and file structure may differ from training data. Read `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build (also type-checks)
npm run lint     # eslint
npx tsc --noEmit # type-check without building
```

No test suite — verify UI changes manually in the browser.

## Environment variables

`.env.local` is required for the recipe-import feature:

```
GOOGLE_CLOUD_API_KEY=   # Google Cloud Vision API (OCR)
GEMINI_API_KEY=         # Gemini 1.5 Flash (recipe text parsing)
```

Firebase config is hardcoded in `lib/firebase.ts` (project: `fiesta-hermosa`).

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
| `lib/firestore.ts` | All Firestore CRUD scoped per user + migration + cascade recalc logic |
| `lib/auth-context.tsx` | `AuthProvider` + `useAuth()` hook; calls `seedIfEmpty` on auth state change |
| `components/AuthGuard.tsx` | Wraps pages — redirects to `/login` if unauthenticated, shows spinner while loading |
| `components/Icon.tsx` | Inline SVG icon library; accepts `name`, `size`, `stroke`, `color`, `style` |
| `app/globals.css` | All design tokens and shared CSS utility classes |
| `app/api/parse-receita/route.ts` | Server route: accepts base64 image → Google Vision OCR → Gemini parses text → returns structured recipe JSON |
| `app/diagnostico/page.tsx` | Dev utility page: inspect legacy vs new Firestore data, manually trigger migration, bulk auto-categorize recipes by name |

### Ingredient→Recipe relationship

`IngredienteReceita` stores only `{ id, qtd }` — a reference ID plus quantity. To render recipe ingredients with names/units/costs, join against the `Insumo` array at display time:

```ts
const insumo = insumos.find(i => i.id === ing.id);
const custo = ing.qtd * insumo.custoUn;
```

### Pricing formula

```
custoUn       = precoCompra / qtdCompra          ← derived when saving Insumo
custoTotal    = Σ (ing.qtd × insumo.custoUn)
custoPorcao   = custoTotal / rendimento
precoSugerido = (custoPorcao × (1 + margem/100)) / (1 - taxaApp/100)
```

`recalcReceitasComInsumo()` and `recalcTodasReceitas()` in `lib/firestore.ts` recompute `custoTotal`, `custoPorcao`, and `precoSugerido` on all affected recipes whenever ingredient prices change.

### Auth

Google sign-in uses `signInWithPopup` with automatic fallback to `signInWithRedirect` on popup-blocked errors. `getRedirectResult` is called on mount to handle the redirect return. `authError` is exposed from `useAuth()` with Portuguese error messages.

### Design system

Fonts loaded via `next/font/google` in `app/layout.tsx` and exposed as CSS variables:
- `--font-dm-sans` → body text (default)
- `--font-cormorant` → display/serif (CSS class `.serif`)
- `--font-jetbrains-mono` → monospace numbers (CSS classes `.mono`, `.tnum`)

Utility classes in `globals.css`: `.app-shell`, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-sm`, `.card`, `.card-soft`, `.chip` (modifiers: `.terracotta`, `.olive`, `.honey`, `.good`, `.warn`, `.danger`), `.field`, `.input-prefix`, `.fab`, `.bottomnav`, `.navitem`, `.iconbtn`, `.scroll`, `.row`, `.col`, `.gap-2/3/4`, `.img-placeholder`, `.divider`, `.serif`, `.mono`, `.tnum`, `.muted`.

### Recipe categories

Defined in `lib/data.ts` as `CATEGORIAS_RECEITA`:
`Pães`, `Bolos`, `Doces`, `Tortas Doce`, `Tortas Salgadas`, `Salgados e Petiscos`, `Biscoitos e Bolachas`, `Chocolates e Trufas`

### Commits

Sign with: `git -c commit.gpgsign=false commit` (codesign MCP requires a GitHub source linked to the session).
