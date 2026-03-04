# Conecta Play

Plataforma de networking premium para empresarios, lideres e visionarios que querem acelerar relacionamento, prospeccao e parcerias.

## Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Backend:** Supabase (Postgres, Auth, RLS, Edge Functions, Storage)
- **Estilizacao:** TailwindCSS + Radix UI + Framer Motion
- **Deploy:** Vercel (frontend) + Supabase Cloud (backend)

## Funcionalidades

### Para Usuarios

- **Dashboard** com stats (reunioes, pontuacao, fechamentos, valor gerado), mural de conquistas e ranking
- **Conexoes Diarias** com matches automaticos (sorteio via Edge Function, cron 20h BRT) e confirmacao bilateral
- **Agenda** com grid semanal de disponibilidade (slots 07:00 e 19:00) e aba de historico
- **Chat** em tempo real entre conexoes aceitas
- **Busca de Empresas** com filtro por categoria/segmento
- **Perfil Publico** com galeria, contato e compartilhamento
- **Indicacoes** (referral) com rastreamento de status e pontuacao
- **Registro de Negocios** com aprovacao por admin
- **Pagamento** com 3 planos (Mensal, Anual, Start 2026)

### Para Admin

- **Gestao de Usuarios** com aprovacao, edicao, exportacao CSV
- **Gestao de Empresas** vinculadas aos usuarios
- **Conexoes do Dia** com match manual, swap de parceiros e exclusao
- **Indicacoes** com aprovacao/rejeicao
- **Negocios** com validacao e aprovacao

### Sistema de Pontuacao

- +1 ponto por reuniao confirmada (bilateral)
- +1 ponto por indicacao aprovada
- +5 pontos por negocio fechado (aprovado)

## Estrutura do Projeto

```
src/
  app/
    (auth)/          # Login, Register, Reset Password
    (dashboard)/     # Dashboard, Agenda, Conexoes, Search, Account, Referral, Payment, Meetings
    (admin)/         # Admin: Users, Empresas, Conexoes, Indicacoes, Negocios
    (marketing)/     # Landing page
    api/             # API routes (auth, admin)
  components/
    ui/              # Radix UI primitives (button, dialog, tabs, etc.)
    layout/          # Sidebar, Header
    features/        # FirstLoginWelcome, DashboardTutorial, SupportChat, CompanyCard, etc.
    marketing/       # Landing page, WelcomeOverlay, CompanyLogo
  services/          # Supabase service layer (dashboard, availability, daily-match, admin, etc.)
  types/             # TypeScript interfaces
  lib/               # Supabase clients (browser + server), utils
  hooks/             # Custom hooks (use-current-user, use-toast)
```

## Configuracao Local

```bash
# Instalar dependencias
npm install

# Configurar variaveis de ambiente
cp .env.example .env.local
# Preencher NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY

# Rodar em desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Build

```bash
npm run build
npm start
```
