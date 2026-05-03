# Conecta Play

🇺🇸 [Read in English](README.md)

**Desenvolvido para Conexao Play por XNAP**

Plataforma premium de networking para empresários, líderes e donos de negócios. O Conecta Play automatiza conexões diárias, rastreia reuniões e ajuda membros a fechar negócios através de networking estratégico.

## Stack Tecnológica

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, RLS, Edge Functions, Storage)
- **Estilização:** TailwindCSS 4 + Radix UI + Framer Motion
- **Data Fetching:** SWR (cache stale-while-revalidate)
- **Email:** Nodemailer (SMTP)
- **Pagamentos:** InfinitePay (links de pagamento hospedados)
- **Deploy:** Vercel (frontend) + Supabase Cloud (backend)

## Funcionalidades

### Usuários

- **Dashboard** — stats pessoais (reuniões, pontuação, fechamentos, valor gerado), mural de conquistas e ranking
- **Conexões Diárias** — matches automáticos via Edge Function (cron às 20:00 BRT) com confirmação bilateral
- **Agenda de Disponibilidade** — grid semanal com slots 07:00 e 19:00, além de histórico de matches
- **Chat em Tempo Real** — mensagens entre conexões aceitas
- **Busca de Empresas** — navegação e filtro por categoria/segmento
- **Perfis Públicos** — galeria, informações de contato e compartilhamento
- **Indicações** — rastreamento de indicações com status e pontuação
- **Registro de Negócios** — submissão com seleção de empresa, pendente de aprovação do admin
- **Revista Digital** — flip-book interativo destacando empresários membros

### Admin

- **Gestão de Usuários** — aprovar, editar, exportar CSV
- **Gestão de Empresas** — vinculadas às contas dos usuários
- **Conexões do Dia** — match manual, troca de parceiros e exclusão
- **Aprovação de Indicações e Negócios** — revisar e aprovar/rejeitar submissões
- **Gestão da Revista** — gerenciar empresários em destaque

### Sistema de Pontuação

A pontuação é calculada pela view `v_user_stats` no Postgres, com piso de `0` (nunca fica negativa):

- **+1** por reunião marcada como `completed` (contada por `meetings.organizer_id`)
- **Match diário — marcação de presença:**
  - Marcar presença cria uma meeting → **+1**
  - Quando **os dois** marcam presença no match espelhado, é inserida uma meeting bônus para cada um → **+2 para cada** (confirmação bilateral)
- **+1** por indicação aprovada
- **+5** por negócio aprovado
- **−1** por solicitação de conexão enviada (conta todas as linhas em `connections.requester_id`, independentemente do status — pending, accepted e rejected descontam ponto da mesma forma)

A página `/search` bloqueia novas solicitações de conexão quando a pontuação fica abaixo de 1.

**Níveis:** Platina (0-49) · Safira (50-150) · Diamante (151+).

## Estrutura do Projeto

```
src/
  app/
    (auth)/            # Login, Cadastro, Redefinir Senha
    (dashboard)/       # Dashboard, Agenda, Conexões, Busca, Conta, Indicações, Pagamento
    (admin)/           # Admin: Usuários, Empresas, Conexões, Indicações, Negócios, Revista
    (marketing)/       # Landing page, Revista Digital
    api/               # Rotas de API (auth, emails admin)
  components/
    ui/                # Primitivos Radix UI (button, dialog, tabs, toast, etc.)
    layout/            # Sidebar, Header
    features/          # Fluxo de boas-vindas, Tutorial, Chat de Suporte, Cards de Empresa
    magazine/          # Componentes da revista digital (Capa, Páginas, Contracapa)
    marketing/         # Landing page, Welcome Overlay
  services/            # Camada de serviços Supabase (dashboard, disponibilidade, matches, admin, etc.)
  providers/           # Providers de SWR e contexto de Auth
  types/               # Interfaces TypeScript
  lib/                 # Clientes Supabase (browser + server), mappers, utilitários
  hooks/               # Hooks customizados (use-current-user, use-auth, use-toast, use-pagination)
```

## Primeiros Passos

### Pré-requisitos

- Node.js 18+
- Projeto Supabase (com Edge Functions e pg_cron habilitados)

### Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Preencha os valores necessários (veja Variáveis de Ambiente abaixo)

# Rodar em modo de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

### Build de Produção

```bash
npm run build
npm start
```

## Variáveis de Ambiente

Copie `.env.example` para `.env.local` e preencha os valores:

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço do Supabase (apenas server-side) |
| `SMTP_HOST` | Host do servidor SMTP |
| `SMTP_PORT` | Porta SMTP (padrão: 465) |
| `SMTP_USER` | Usuário SMTP |
| `SMTP_PASS` | Senha SMTP |
| `SMTP_SENDER_NAME` | Nome de exibição do remetente |
| `SMTP_SENDER_EMAIL` | Endereço de e-mail do remetente |
| `NEXT_PUBLIC_APP_URL` | URL da aplicação |
| `NEXT_PUBLIC_PAYMENT_LINK_MONTHLY` | Link de pagamento do plano mensal |
| `NEXT_PUBLIC_PAYMENT_LINK_VISIONARY` | Link de pagamento do plano Start 2026 |
| `NEXT_PUBLIC_WHATSAPP_SUPPORT` | Número do WhatsApp de suporte |

---

Desenvolvido com assistência de IA usando [Claude Code](https://claude.ai/claude-code)
