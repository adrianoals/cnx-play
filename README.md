# Conecta Play

🇧🇷 [Leia em Português](README.pt-br.md)

**Built for Conexao Play by XNAP**

Premium networking platform for entrepreneurs, leaders, and business owners. Conecta Play automates daily connections, tracks meetings, and helps members close deals through strategic networking.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, RLS, Edge Functions, Storage)
- **Styling:** TailwindCSS 4 + Radix UI + Framer Motion
- **Data Fetching:** SWR (stale-while-revalidate caching)
- **Email:** Nodemailer (SMTP)
- **Payments:** InfinitePay (hosted payment links)
- **Deploy:** Vercel (frontend) + Supabase Cloud (backend)

## Features

### Users

- **Dashboard** — personal stats (meetings, score, deals, revenue), achievements wall, and leaderboard
- **Daily Connections** — automated matching via Edge Function (cron at 20:00 BRT) with bilateral confirmation
- **Availability Agenda** — weekly grid with 07:00 and 19:00 time slots, plus match history
- **Real-time Chat** — messaging between accepted connections
- **Company Search** — browse and filter companies by category/segment
- **Public Profiles** — gallery, contact info, and sharing
- **Referrals** — referral tracking with status and scoring
- **Deal Registration** — submit deals with company selection, pending admin approval
- **Digital Magazine** — interactive flip-book showcasing member entrepreneurs

### Admin

- **User Management** — approve, edit, export CSV
- **Company Management** — linked to user accounts
- **Daily Connections** — manual matching, partner swap, deletion
- **Referral & Deal Approval** — review and approve/reject submissions
- **Magazine Management** — manage featured entrepreneurs

### Scoring System

- +1 point per confirmed meeting (bilateral)
- +1 point per approved referral
- +5 points per approved deal

## Project Structure

```
src/
  app/
    (auth)/            # Login, Register, Reset Password
    (dashboard)/       # Dashboard, Agenda, Connections, Search, Account, Referral, Payment
    (admin)/           # Admin: Users, Companies, Connections, Referrals, Deals, Magazine
    (marketing)/       # Landing page, Digital Magazine
    api/               # API routes (auth, admin emails)
  components/
    ui/                # Radix UI primitives (button, dialog, tabs, toast, etc.)
    layout/            # Sidebar, Header
    features/          # Welcome flow, Tutorial, Support Chat, Company Cards
    magazine/          # Digital magazine components (Cover, Pages, Back Cover)
    marketing/         # Landing page, Welcome Overlay
  services/            # Supabase service layer (dashboard, availability, daily-match, admin, etc.)
  providers/           # SWR and Auth context providers
  types/               # TypeScript interfaces
  lib/                 # Supabase clients (browser + server), mappers, utilities
  hooks/               # Custom hooks (use-current-user, use-auth, use-toast, use-pagination)
```

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project (with Edge Functions and pg_cron enabled)

### Installation

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Fill in the required values (see Environment Variables below)

# Run in development mode
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP port (default: 465) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_SENDER_NAME` | Email sender display name |
| `SMTP_SENDER_EMAIL` | Email sender address |
| `NEXT_PUBLIC_APP_URL` | Application URL |
| `NEXT_PUBLIC_PAYMENT_LINK_MONTHLY` | Monthly plan payment link |
| `NEXT_PUBLIC_PAYMENT_LINK_VISIONARY` | Start 2026 plan payment link |
| `NEXT_PUBLIC_WHATSAPP_SUPPORT` | WhatsApp support number |

---

Built with AI-assisted development using [Claude Code](https://claude.ai/claude-code)
