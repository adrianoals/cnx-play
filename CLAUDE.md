# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Production build
npm start          # Serve production build
npm run lint       # ESLint (flat config, Next.js core-web-vitals + TypeScript)
npm test           # Run tests once (Vitest)
npm run test:watch # Run tests in watch mode
```

Tests live in `__tests__/` directories next to source files (e.g. `src/lib/__tests__/utils.test.ts`).

## Architecture

**Conecta Play** — a Portuguese-language (pt-BR) premium networking platform for entrepreneurs built with Next.js 16 App Router, React 19, TypeScript, Supabase, and TailwindCSS 4.

### Route Groups

- `(auth)` — Login, Register, Reset Password (public)
- `(dashboard)` — Authenticated user pages (dashboard, agenda, connections, search, chat, referrals, deals, payments, profile)
- `(admin)` — Admin panel (user/company/connection/referral/deal/magazine management). Access gated by `user.role === 'admin'` or membership in `SUPER_ADMINS` list (`src/lib/constants.ts`)
- `(marketing)` — Public landing page and digital magazine (`/revista`)
- `api/` — API routes for auth (password reset/change) and admin emails (approval notifications, user creation)

### Data Flow

- **Supabase clients**: `src/lib/supabase.ts` (browser via `createBrowserClient`) and `src/lib/supabase-server.ts` (server via `createServerClient` with cookie forwarding)
- **Service layer** (`src/services/*.service.ts`): All Supabase queries are encapsulated here. Services use the browser client; API routes use server client with service role key for admin operations
- **SWR**: Client-side data fetching with `revalidateOnFocus: false`, 10s deduping, 2 retries (configured in `src/providers/swr-provider.tsx`)
- **Auth**: Supabase Auth with `AuthProvider` context (`src/providers/auth-provider.tsx`). Auth callback at `src/app/auth/callback/`. Dashboard and admin layouts act as auth guards via `useEffect` redirects

### Mappers

`src/lib/map-*.ts` files transform Supabase row shapes into frontend TypeScript types defined in `src/types/index.ts`. Always use these mappers when reading from Supabase.

### Key Conventions

- Path alias: `@/*` maps to `./src/*`
- UI components: Radix UI primitives wrapped in `src/components/ui/` (shadcn/ui pattern with `class-variance-authority` + `tailwind-merge`)
- Styling: TailwindCSS 4 via PostCSS plugin, dark theme default
- Scoring system (calculated by the `v_user_stats` view, with `MAX(0, ...)` floor):
  - +1 per meeting completed (`meetings.status = 'completed'`, grouped by `organizer_id`)
  - Daily match presence: marking presence creates a meeting (+1). If **both** users mark presence on the mirrored match, a bonus meeting is inserted for each → **+2 each** when bilateral. Trigger: `handle_daily_match_completed`.
  - +1 per approved referral
  - +5 per approved deal
  - **−1 per connection request sent** (counted on every row in `connections.requester_id`, regardless of status — pending/accepted/rejected all subtract). `/search` blocks new requests when score < 1.
  - Levels: Platina (0-49), Safira (50-150), Diamante (151+) — defined in `src/lib/constants.ts`
- Email: Nodemailer SMTP via API routes (not services)
- Payments: External InfinitePay hosted payment links (env vars)

### Environment

Requires `.env.local` with Supabase credentials (URL, anon key, service role key), SMTP config, app URL, payment links, and WhatsApp support number. See `.env.example`.
