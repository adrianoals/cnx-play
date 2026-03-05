# Modelagem de Dados - CnxPlay (Conecta Empresarios)

> Supabase / PostgreSQL

---

## Sumario

1. [Visao Geral](#visao-geral)
2. [Diagrama de Entidades](#diagrama-de-entidades)
3. [Enum Types](#enum-types)
4. [Tabelas](#tabelas)
5. [Views (Campos Computados)](#views)
6. [Triggers e Functions](#triggers-e-functions)
7. [Row Level Security (RLS)](#row-level-security)
8. [Realtime](#realtime)
9. [Storage Buckets](#storage-buckets)
10. [Regras de Negocio](#regras-de-negocio)

---

## Visao Geral

### Stack
- **Frontend:** Next.js 16 (App Router) + Tailwind CSS 4 + TypeScript
- **Backend:** Supabase (Auth, PostgreSQL, Realtime, Storage, Edge Functions)
- **E-mail:** Resend + React Email
- **Pagamento:** InfinitePay (links externos)
- **Deploy:** Vercel (frontend) + Supabase Cloud (backend)

### Decisoes do Cliente
- **Fluxo de usuario:** Registro → Pagamento → Admin aprova manualmente → Ativo
- **Pagamento:** Modelar para webhook automatico E aprovacao manual
- **Daily Match:** Misto - algoritmo automatico por padrao, admin pode sobrescrever

---

## Diagrama de Entidades

```
auth.users (Supabase Auth)
    | 1:1
    v
profiles ──────────────────────────────────────────────┐
    | 1:N                                               |
    |── gallery_images                                  |
    |── likes (from_user_id) ──trigger──> matches       |
    |── matches (user1_id / user2_id)                   |
    |       └── messages (match_id)                     |
    |── notifications                                   |
    |── deals                                           |
    |── daily_matches (user_id + matched_user_id) <── profiles
    |── daily_match_history                             |
    |── meetings (organizer_id + partner_id) <──────────┘
    |── referrals (referrer_id)
    |── subscriptions
    └── campaign_leads (converted_user_id)
```

### Relacionamentos Principais

| Relacao | Tipo | Descricao |
|---------|------|-----------|
| auth.users → profiles | 1:1 | Perfil criado automaticamente via trigger |
| profiles → gallery_images | 1:N | Portfolio de imagens do usuario |
| profiles → likes | 1:N | Likes enviados e recebidos |
| likes → matches | trigger | Like mutuo cria match automaticamente |
| matches → messages | 1:N | Mensagens dentro de uma conexao |
| profiles → notifications | 1:N | Notificacoes do usuario |
| profiles → deals | 1:N | Negocios fechados reportados |
| profiles → daily_matches | 1:N | Sugestao diaria de contato |
| profiles → meetings | 1:N | Reunioes agendadas/realizadas |
| profiles → referrals | 1:N | Indicacoes feitas |
| profiles → subscriptions | 1:N | Historico de assinaturas |

---

## Enum Types

```sql
-- Roles e status do usuario
CREATE TYPE public.user_role AS ENUM ('user', 'admin');
CREATE TYPE public.user_status AS ENUM ('pending', 'active', 'inactive');

-- Origem do match
CREATE TYPE public.match_source AS ENUM ('mutual_like', 'manual', 'direct_message', 'daily');

-- Tipos de notificacao
CREATE TYPE public.notification_type AS ENUM ('match', 'message', 'like', 'system');

-- Reunioes
CREATE TYPE public.meeting_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE public.meeting_platform AS ENUM ('google_meet', 'zoom', 'teams', 'whatsapp', 'presencial', 'other');

-- Indicacoes
CREATE TYPE public.referral_status AS ENUM ('pending', 'active', 'completed');

-- Assinaturas
CREATE TYPE public.subscription_plan AS ENUM ('monthly', 'annual', 'visionary');
CREATE TYPE public.subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'trialing', 'expired');

-- Match diario
CREATE TYPE public.daily_match_status AS ENUM ('pending', 'completed');
```

> **Por que enums?** Campos com conjunto pequeno e estavel de valores. Garante integridade no banco, performance (armazenado como inteiro internamente) e schema auto-documentado. Campos como `segment` NAO sao enum porque sao texto livre definido pelo usuario.

---

## Tabelas

### profiles

Extensao da tabela `auth.users` do Supabase com dados de negocio.

```sql
CREATE TABLE public.profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name       TEXT NOT NULL,
    email           TEXT UNIQUE NOT NULL,
    phone           TEXT,
    cpf             TEXT,
    birth_date      DATE,
    address         TEXT,
    company_name    TEXT,
    cnpj            TEXT,
    segment         TEXT,
    description     TEXT,
    avatar_url      TEXT,
    role            public.user_role NOT NULL DEFAULT 'user',
    status          public.user_status NOT NULL DEFAULT 'pending',
    score           INTEGER NOT NULL DEFAULT 0,
    meetings_count  INTEGER NOT NULL DEFAULT 0,
    referral_code   TEXT UNIQUE,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| Campo | Descricao |
|-------|-----------|
| id | Mesmo UUID do auth.users |
| avatar_url | URL publica do Supabase Storage |
| score | Atualizado via triggers (+10 meeting, +50 referral) |
| meetings_count | Usado para calcular nivel (Platina/Safira/Diamante) |
| referral_code | Gerado automaticamente no cadastro (ex: "LUCAS8829") |
| metadata | JSONB flexivel para dados de campanha |

---

### gallery_images

Imagens do portfolio/galeria do usuario.

```sql
CREATE TABLE public.gallery_images (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url       TEXT NOT NULL,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### likes

Like direcional de um usuario para outro (estilo Tinder).

```sql
CREATE TABLE public.likes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    to_user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT likes_no_self_like CHECK (from_user_id <> to_user_id),
    CONSTRAINT likes_unique_pair UNIQUE (from_user_id, to_user_id)
);
```

> **Trigger:** Quando um like e inserido, verifica se existe like inverso. Se sim, cria match automaticamente.

---

### matches

Conexao bidirecional entre dois usuarios.

```sql
CREATE TABLE public.matches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user2_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    source          public.match_source NOT NULL DEFAULT 'manual',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT matches_no_self_match CHECK (user1_id <> user2_id),
    CONSTRAINT matches_ordered_pair CHECK (user1_id < user2_id),
    CONSTRAINT matches_unique_pair UNIQUE (user1_id, user2_id)
);
```

> **Importante:** `user1_id` e sempre < `user2_id`. Isso garante que o par (A,B) e (B,A) sejam armazenados da mesma forma, evitando duplicatas.

---

### messages

Mensagens de chat dentro de um match.

```sql
CREATE TABLE public.messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id        UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    text            TEXT NOT NULL,
    read            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> **Realtime:** Esta tabela tem subscription habilitado para chat em tempo real.

---

### notifications

Sistema de notificacoes in-app.

```sql
CREATE TABLE public.notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type            public.notification_type NOT NULL,
    content         TEXT NOT NULL,
    read            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### deals

Mural de Conquistas - negocios fechados reportados pelos usuarios.

```sql
CREATE TABLE public.deals (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    partner_company_name  TEXT NOT NULL,
    value_brl             NUMERIC(15, 2) NOT NULL CHECK (value_brl >= 0),
    deal_date             DATE NOT NULL DEFAULT CURRENT_DATE,
    description           TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> `partner_company_name` e texto livre porque o parceiro pode nao ser usuario da plataforma.

---

### daily_matches

Sugestao diaria de contato para cada usuario.

```sql
CREATE TABLE public.daily_matches (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    matched_user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    match_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    suggested_time    TIME,
    status            public.daily_match_status NOT NULL DEFAULT 'pending',
    assigned_by       UUID REFERENCES public.profiles(id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT daily_matches_no_self CHECK (user_id <> matched_user_id),
    CONSTRAINT daily_matches_one_per_day UNIQUE (user_id, match_date)
);
```

| Campo | Descricao |
|-------|-----------|
| assigned_by | NULL = gerado por algoritmo automatico; UUID = admin que atribuiu manualmente |
| suggested_time | Horario sugerido para o contato |

---

### daily_match_history

Historico para evitar repetir sugestoes.

```sql
CREATE TABLE public.daily_match_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    shown_user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    shown_date      DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT daily_history_unique UNIQUE (user_id, shown_user_id, shown_date)
);
```

---

### meetings

Reunioes de networking agendadas ou realizadas.

```sql
CREATE TABLE public.meetings (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    partner_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    partner_name      TEXT,
    partner_role      TEXT,
    meeting_date      DATE NOT NULL,
    meeting_time      TIME NOT NULL,
    duration_minutes  INTEGER DEFAULT 45,
    platform          public.meeting_platform DEFAULT 'google_meet',
    meeting_link      TEXT,
    status            public.meeting_status NOT NULL DEFAULT 'scheduled',
    topics            TEXT[] DEFAULT '{}',
    rating            SMALLINT CHECK (rating >= 0 AND rating <= 5),
    notes             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### referrals

Programa de indicacoes.

```sql
CREATE TABLE public.referrals (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_name     TEXT NOT NULL,
    referred_email    TEXT,
    referred_user_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status            public.referral_status NOT NULL DEFAULT 'pending',
    points_awarded    INTEGER NOT NULL DEFAULT 0,
    meetings_awarded  INTEGER NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| Campo | Descricao |
|-------|-----------|
| referred_user_id | Preenchido se o indicado se cadastrar na plataforma |
| points_awarded | 50 pontos quando status muda para 'completed' |
| meetings_awarded | +1 meeting bonus ao referrer |

---

### subscriptions

Assinaturas e status de pagamento.

```sql
CREATE TABLE public.subscriptions (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan                  public.subscription_plan NOT NULL,
    status                public.subscription_status NOT NULL DEFAULT 'active',
    price_brl             NUMERIC(10, 2) NOT NULL,
    starts_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    ends_at               TIMESTAMPTZ,
    external_payment_id   TEXT,
    external_payment_url  TEXT,
    payment_confirmed_at  TIMESTAMPTZ,
    admin_approved_at     TIMESTAMPTZ,
    admin_approved_by     UUID REFERENCES public.profiles(id),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| Campo | Descricao |
|-------|-----------|
| external_payment_id | ID da transacao no InfinitePay |
| external_payment_url | Link de pagamento |
| payment_confirmed_at | NULL = pagamento nao confirmado |
| admin_approved_at | NULL = admin ainda nao aprovou |
| admin_approved_by | UUID do admin que aprovou |

### Fluxo de ativacao:
```
1. Usuario se registra          → profiles.status = 'pending'
2. Usuario paga                 → subscriptions.payment_confirmed_at = now()
3. Admin aprova                 → subscriptions.admin_approved_at = now()
                                → profiles.status = 'active'
```

---

### campaign_leads

Leads de campanhas de marketing (ex: Ano Novo).

```sql
CREATE TABLE public.campaign_leads (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name             TEXT NOT NULL,
    email                 TEXT NOT NULL,
    phone                 TEXT,
    segment               TEXT,
    potential_connection   TEXT,
    age_range             TEXT,
    region                TEXT,
    campaign_name         TEXT NOT NULL,
    campaign_source       TEXT,
    converted_user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    metadata              JSONB DEFAULT '{}'::jsonb,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Views

### v_leaderboard

Ranking de usuarios por valor de deals e quantidade de meetings.

```sql
CREATE OR REPLACE VIEW public.v_leaderboard AS
SELECT
    p.id,
    p.full_name,
    p.company_name,
    p.avatar_url,
    p.segment,
    p.score,
    p.meetings_count,
    COALESCE(d.total_deal_value, 0) AS total_deal_value,
    COALESCE(d.deal_count, 0) AS deal_count,
    CASE
        WHEN p.meetings_count >= 151 THEN 'Diamante'
        WHEN p.meetings_count >= 50  THEN 'Safira'
        ELSE 'Platina'
    END AS level,
    RANK() OVER (ORDER BY COALESCE(d.total_deal_value, 0) DESC, p.score DESC) AS rank_position
FROM public.profiles p
LEFT JOIN (
    SELECT author_id, SUM(value_brl) AS total_deal_value, COUNT(*) AS deal_count
    FROM public.deals
    GROUP BY author_id
) d ON d.author_id = p.id
WHERE p.status = 'active'
ORDER BY total_deal_value DESC, p.score DESC;
```

### v_user_stats

Estatisticas completas do usuario para o dashboard.

```sql
CREATE OR REPLACE VIEW public.v_user_stats AS
SELECT
    p.id AS user_id,
    p.full_name,
    p.company_name,
    p.score,
    p.meetings_count,
    CASE
        WHEN p.meetings_count >= 151 THEN 'Diamante'
        WHEN p.meetings_count >= 50  THEN 'Safira'
        ELSE 'Platina'
    END AS level,
    COALESCE(d.total_deal_value, 0) AS total_deal_value,
    COALESCE(d.deal_count, 0) AS deal_count,
    COALESCE(m.match_count, 0) AS match_count,
    COALESCE(r.referral_count, 0) AS referral_count,
    COALESCE(r.referral_points, 0) AS referral_points
FROM public.profiles p
LEFT JOIN (
    SELECT author_id, SUM(value_brl) AS total_deal_value, COUNT(*) AS deal_count
    FROM public.deals GROUP BY author_id
) d ON d.author_id = p.id
LEFT JOIN (
    SELECT user_id, COUNT(*) AS match_count
    FROM (
        SELECT user1_id AS user_id FROM public.matches
        UNION ALL
        SELECT user2_id AS user_id FROM public.matches
    ) all_matches
    GROUP BY user_id
) m ON m.user_id = p.id
LEFT JOIN (
    SELECT referrer_id, COUNT(*) AS referral_count, SUM(points_awarded) AS referral_points
    FROM public.referrals GROUP BY referrer_id
) r ON r.referrer_id = p.id;
```

### v_platform_totals

Metricas agregadas da plataforma para o dashboard.

```sql
CREATE OR REPLACE VIEW public.v_platform_totals AS
SELECT
    COALESCE(SUM(value_brl), 0) AS total_deal_value,
    COUNT(*) AS total_deals,
    (SELECT COUNT(*) FROM public.profiles WHERE status = 'active') AS active_users,
    (SELECT COUNT(*) FROM public.matches) AS total_matches
FROM public.deals;
```

> **Niveis sao computados, nao armazenados.** Platina (<50 meetings), Safira (>=50), Diamante (>=151).

---

## Triggers e Functions

### Criacao automatica de profile

Quando um usuario se registra via Supabase Auth, o profile e criado automaticamente.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_referral_code TEXT;
BEGIN
    v_referral_code := UPPER(
        LEFT(REPLACE(COALESCE(NEW.raw_user_meta_data->>'full_name', 'USER'), ' ', ''), 5)
    ) || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    INSERT INTO public.profiles (
        id, full_name, email, phone, company_name, segment,
        role, status, referral_code, metadata
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'segment', ''),
        'user',
        'pending',
        v_referral_code,
        COALESCE((NEW.raw_user_meta_data->'metadata')::jsonb, '{}'::jsonb)
    );

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

---

### Match automatico por like mutuo

```sql
CREATE OR REPLACE FUNCTION public.handle_new_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user1 UUID;
    v_user2 UUID;
    v_match_id UUID;
    v_from_name TEXT;
    v_to_name TEXT;
BEGIN
    -- Verifica like mutuo
    IF EXISTS (
        SELECT 1 FROM public.likes
        WHERE from_user_id = NEW.to_user_id
          AND to_user_id = NEW.from_user_id
    ) THEN
        -- Ordena para garantir user1 < user2
        IF NEW.from_user_id < NEW.to_user_id THEN
            v_user1 := NEW.from_user_id;
            v_user2 := NEW.to_user_id;
        ELSE
            v_user1 := NEW.to_user_id;
            v_user2 := NEW.from_user_id;
        END IF;

        -- Cria match se nao existe
        IF NOT EXISTS (
            SELECT 1 FROM public.matches
            WHERE user1_id = v_user1 AND user2_id = v_user2
        ) THEN
            INSERT INTO public.matches (user1_id, user2_id, source)
            VALUES (v_user1, v_user2, 'mutual_like')
            RETURNING id INTO v_match_id;

            -- Notifica ambos
            SELECT full_name INTO v_from_name FROM public.profiles WHERE id = NEW.from_user_id;
            SELECT full_name INTO v_to_name FROM public.profiles WHERE id = NEW.to_user_id;

            INSERT INTO public.notifications (user_id, type, content) VALUES
                (NEW.from_user_id, 'match', 'Nova conexao com ' || COALESCE(v_to_name, 'um parceiro') || '!'),
                (NEW.to_user_id, 'match', 'Nova conexao com ' || COALESCE(v_from_name, 'um parceiro') || '!');
        END IF;
    ELSE
        -- Notifica o alvo sobre o like
        SELECT full_name INTO v_from_name FROM public.profiles WHERE id = NEW.from_user_id;

        INSERT INTO public.notifications (user_id, type, content)
        VALUES (NEW.to_user_id, 'like', COALESCE(v_from_name, 'Alguem') || ' demonstrou interesse no seu perfil.');
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_like_created
    AFTER INSERT ON public.likes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_like();
```

---

### Score por meeting completado

```sql
CREATE OR REPLACE FUNCTION public.handle_meeting_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
        UPDATE public.profiles
        SET score = score + 10,
            meetings_count = meetings_count + 1,
            updated_at = now()
        WHERE id = NEW.organizer_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_meeting_completed
    AFTER UPDATE OF status ON public.meetings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_meeting_completed();
```

---

### Score por daily match completado

```sql
CREATE OR REPLACE FUNCTION public.handle_daily_match_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_u1 UUID;
    v_u2 UUID;
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
        -- Atualiza score
        UPDATE public.profiles
        SET score = score + 10,
            meetings_count = meetings_count + 1,
            updated_at = now()
        WHERE id = NEW.user_id;

        -- Cria match social se nao existe
        IF NEW.user_id < NEW.matched_user_id THEN
            v_u1 := NEW.user_id;
            v_u2 := NEW.matched_user_id;
        ELSE
            v_u1 := NEW.matched_user_id;
            v_u2 := NEW.user_id;
        END IF;

        INSERT INTO public.matches (user1_id, user2_id, source)
        VALUES (v_u1, v_u2, 'daily')
        ON CONFLICT (user1_id, user2_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_daily_match_completed
    AFTER UPDATE OF status ON public.daily_matches
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_daily_match_completed();
```

---

### Score por referral completado

```sql
CREATE OR REPLACE FUNCTION public.handle_referral_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
        UPDATE public.profiles
        SET score = score + 50, updated_at = now()
        WHERE id = NEW.referrer_id;

        UPDATE public.referrals
        SET points_awarded = 50, meetings_awarded = 1, updated_at = now()
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_referral_completed
    AFTER UPDATE OF status ON public.referrals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_referral_completed();
```

---

### Notificacao por nova mensagem

```sql
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sender_name TEXT;
    v_receiver_id UUID;
    v_match RECORD;
BEGIN
    SELECT * INTO v_match FROM public.matches WHERE id = NEW.match_id;
    IF v_match IS NULL THEN RETURN NEW; END IF;

    IF v_match.user1_id = NEW.sender_id THEN
        v_receiver_id := v_match.user2_id;
    ELSE
        v_receiver_id := v_match.user1_id;
    END IF;

    SELECT COALESCE(company_name, full_name) INTO v_sender_name
    FROM public.profiles WHERE id = NEW.sender_id;

    INSERT INTO public.notifications (user_id, type, content)
    VALUES (v_receiver_id, 'message', 'Nova mensagem de ' || COALESCE(v_sender_name, 'alguem'));

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_created
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_message();
```

---

### Auto-update updated_at

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_meetings
    BEFORE UPDATE ON public.meetings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_subscriptions
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_referrals
    BEFORE UPDATE ON public.referrals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

### Functions auxiliares

```sql
-- Verifica se usuario autenticado e admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- Verifica se e super admin (emails protegidos)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND email IN (
              'lucasreccchia@companyconexaoplay.com',
              'lucasreccchia@gmail.com'
          )
    );
$$;
```

---

## Row Level Security

### Resumo de politicas por tabela

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| **profiles** | Ativos veem ativos + proprio; Admin ve todos | Via trigger auth | Proprio (sem mudar role/status); Admin qualquer | Admin (exceto super admins) |
| **gallery_images** | Publico | Proprio user_id | Proprio user_id | Proprio user_id |
| **likes** | Proprios likes + admin | from_user_id = uid | - | Proprios likes |
| **matches** | Participantes + admin | Via trigger/admin | - | - |
| **messages** | Participantes do match + admin | sender = uid + membro do match | Marcar lido (so msg de outros) | - |
| **notifications** | Proprio user_id | Via trigger/admin | Marcar como lido | - |
| **deals** | Usuarios ativos + admin | author_id = uid | author_id = uid | author + admin |
| **daily_matches** | Proprio + admin | Admin ou uid | Proprio user_id | - |
| **daily_match_history** | Proprio + admin | uid ou admin | - | - |
| **meetings** | organizer ou partner + admin | organizer_id = uid | organizer ou partner | - |
| **referrals** | Proprio + admin | referrer_id = uid | Admin | - |
| **subscriptions** | Proprio + admin | Admin/webhook | Admin | - |
| **campaign_leads** | Admin | Qualquer (anon) | Admin | Admin |

### Principios de seguranca
- Usuarios **nunca** podem alterar seu proprio `role` ou `status`
- Super admins (emails hardcoded) **nunca** podem ser deletados
- Mensagens so podem ser enviadas dentro de matches existentes
- Subscriptions so sao criadas por admin ou webhook do servidor
- Campaign leads podem ser inseridos por visitantes nao autenticados

---

## Realtime

Tabelas com subscription Supabase Realtime habilitado:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_matches;
```

| Tabela | Uso no Realtime |
|--------|-----------------|
| messages | Chat em tempo real (substitui polling de 2s) |
| notifications | Push de notificacoes in-app |
| matches | Alertar novo match instantaneamente |
| daily_matches | Atualizar quando admin atribui match |

> Apenas estas 4 tabelas precisam de realtime. Adicionar mais desperdicaria recursos.

---

## Storage Buckets

| Bucket | Publico | Max Size | MIME Types |
|--------|---------|----------|------------|
| **avatars** | Sim | 2MB | image/jpeg, image/png, image/webp, image/gif |
| **gallery** | Sim | 2MB | image/jpeg, image/png, image/webp, image/gif |

### Estrutura de pastas
```
avatars/
  {user_id}/
    avatar.jpg

gallery/
  {user_id}/
    img_001.jpg
    img_002.jpg
```

### Politicas de Storage
- Qualquer pessoa pode **visualizar** (buckets publicos)
- Usuarios so podem **upload/update/delete** em sua propria pasta (`{user_id}/*`)

---

## Regras de Negocio

### Pontuacao (Score)
| Acao | Pontos |
|------|--------|
| Meeting completado | +10 |
| Daily match completado | +10 |
| Referral completado | +50 |

### Niveis (computados, nao armazenados)
| Nivel | Requisito |
|-------|-----------|
| Platina | < 50 meetings |
| Safira | >= 50 meetings |
| Diamante | >= 151 meetings |

### Fluxo de ativacao do usuario
```
Registro → status: 'pending'
    ↓
Pagamento confirmado → subscriptions.payment_confirmed_at = now()
    ↓
Admin aprova → subscriptions.admin_approved_at = now()
             → profiles.status = 'active'
```

### Planos e precos
| Plano | Preco | Periodo |
|-------|-------|---------|
| Mensal | R$ 59,99/mes | Mensal |
| Anual | R$ 497,00 (R$ 41,42/mes) | 12 meses |
| Start 2026 (Visionary) | R$ 365,00 | 365 dias |

---

## Indexes

```sql
-- profiles
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_status ON public.profiles(status);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_segment ON public.profiles(segment);
CREATE INDEX idx_profiles_company_name ON public.profiles(company_name);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX idx_profiles_score_desc ON public.profiles(score DESC);
CREATE INDEX idx_profiles_metadata ON public.profiles USING GIN (metadata);

-- gallery_images
CREATE INDEX idx_gallery_user_id ON public.gallery_images(user_id);

-- likes
CREATE INDEX idx_likes_from_user ON public.likes(from_user_id);
CREATE INDEX idx_likes_to_user ON public.likes(to_user_id);
CREATE INDEX idx_likes_reverse_lookup ON public.likes(to_user_id, from_user_id);

-- matches
CREATE INDEX idx_matches_user1 ON public.matches(user1_id);
CREATE INDEX idx_matches_user2 ON public.matches(user2_id);
CREATE INDEX idx_matches_created_at ON public.matches(created_at DESC);

-- messages
CREATE INDEX idx_messages_match_id ON public.messages(match_id);
CREATE INDEX idx_messages_match_created ON public.messages(match_id, created_at ASC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_unread ON public.messages(match_id, read) WHERE read = FALSE;

-- notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_notifications_created_at ON public.notifications(user_id, created_at DESC);

-- deals
CREATE INDEX idx_deals_author ON public.deals(author_id);
CREATE INDEX idx_deals_date ON public.deals(deal_date DESC);
CREATE INDEX idx_deals_value ON public.deals(value_brl DESC);

-- daily_matches
CREATE INDEX idx_daily_matches_user_date ON public.daily_matches(user_id, match_date DESC);

-- daily_match_history
CREATE INDEX idx_daily_history_user ON public.daily_match_history(user_id, shown_date DESC);

-- meetings
CREATE INDEX idx_meetings_organizer ON public.meetings(organizer_id);
CREATE INDEX idx_meetings_partner ON public.meetings(partner_id);
CREATE INDEX idx_meetings_date ON public.meetings(meeting_date DESC);
CREATE INDEX idx_meetings_status ON public.meetings(status);

-- referrals
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred_user ON public.referrals(referred_user_id);

-- subscriptions
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_active ON public.subscriptions(user_id, status) WHERE status = 'active';

-- campaign_leads
CREATE INDEX idx_campaign_leads_email ON public.campaign_leads(email);
CREATE INDEX idx_campaign_leads_campaign ON public.campaign_leads(campaign_name);
CREATE INDEX idx_campaign_leads_converted ON public.campaign_leads(converted_user_id);
```
