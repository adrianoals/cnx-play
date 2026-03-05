# Plano: Sistema de Conexões Diárias

## Contexto

A plataforma precisa de um sistema real de conexões diárias. Cada dia, usuários disponíveis recebem até 2 matches (07:00 e 19:00) com empresários de segmentos diferentes. O match é bilateral e gerado por uma Edge Function com cron na véspera.

**Importante:** A plataforma é um facilitador de conexão via chat, **não** de videoconferência. O match conecta duas pessoas pelo chat — a reunião é combinada e realizada fora (WhatsApp, Meet, presencial, etc.). Textos na UI devem deixar isso claro.

**Decisões confirmadas:**
- UI da agenda: nova página `/agenda`
- Agenda: semana atual, Seg a Dom, só pode marcar a partir de amanhã
- Geração: Edge Function cron às **20:00 BRT (23:00 UTC)** na véspera, gera matches de 07:00 e 19:00 do dia seguinte
- Deadline: usuário marca disponibilidade até 20:00 do dia anterior
- Repetição: prioriza pares novos → mais antigos → repete após 3 dias só se não houver opção
- Histórico salvo em `daily_match_history` para rastrear repetições
- Painel admin: visualizar matches do dia seguinte, ajustar manualmente, flag de repetição

---

## 1. Migration: Tabela `user_availability` + ajustes `daily_matches`

```sql
-- Tabela de disponibilidade
CREATE TABLE user_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  available_date date NOT NULL,
  slot_07 boolean NOT NULL DEFAULT false,
  slot_19 boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, available_date)
);
ALTER TABLE user_availability ENABLE ROW LEVEL SECURITY;
-- RLS: SELECT/INSERT/UPDATE/DELETE WHERE auth.uid() = user_id

-- Ajustar daily_matches
ALTER TABLE daily_matches
  ADD COLUMN IF NOT EXISTS time_slot text NOT NULL DEFAULT '07:00'
  CHECK (time_slot IN ('07:00', '19:00'));
CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_matches_user_date_slot
  ON daily_matches(user_id, match_date, time_slot);
-- RLS SELECT: auth.uid() = user_id OR auth.uid() = suggested_user_id
-- RLS UPDATE: auth.uid() = user_id (para confirmar reunião)
```

Tabelas já existentes reaproveitadas: `daily_matches`, `daily_match_history`.

---

## 2. Types — `src/types/index.ts`

Adicionar `DailyMatchRow` e `UserAvailability`. Remover antigo `DailyMatch` (mock).

```typescript
export interface DailyMatchRow {
  id: string
  userId: string
  suggestedUserId: string
  matchDate: string
  timeSlot: '07:00' | '19:00'
  status: 'pending' | 'completed'
  createdAt: string
  partnerName?: string
  partnerAvatar?: string | null
  partnerCompany?: string
  partnerCategory?: string
}

export interface UserAvailability {
  id: string
  userId: string
  availableDate: string
  slot07: boolean
  slot19: boolean
}
```

---

## 3. Services novos

### `src/services/availability.service.ts`
- `fetchWeekAvailability(weekStart: string)` — SELECT 7 dias
- `upsertDayAvailability(date, slot07, slot19)` — UPSERT um dia

### `src/services/daily-match.service.ts`
- `fetchTodayMatches()` — matches de hoje, JOIN users+companies para dados do parceiro
- `confirmMatch(matchId)` — UPDATE status → 'completed'

Padrão: mesmo que `connection.service.ts`.

---

## 4. Página `/agenda` — `src/app/(dashboard)/agenda/page.tsx`

- Header "Minha Agenda" + navegação < semana > com setas
- Banner: "Marque os dias e horários em que você está disponível para receber conexões. Nos horários marcados, você receberá um contato para conversar pelo chat e combinar uma reunião por fora da plataforma. Configure até as 20h do dia anterior."
- Grid 7 colunas (Seg-Dom) com data de cada dia
- Cada dia: 2 toggles (07:00 e 19:00)
- **Dias passados e hoje: desabilitados** (só pode marcar a partir de amanhã)
- Salva ao clicar toggle (upsert imediato)

---

## 5. Sidebar — `src/components/layout/Sidebar.tsx`

Adicionar `{ icon: Calendar, label: "Agenda", path: "/agenda" }` ao `baseItems`.

---

## 6. Dashboard — seção "Conexões do Dia"

**Arquivo:** `src/app/(dashboard)/dashboard/page.tsx`

- Chamar `fetchTodayMatches()` no `loadDashboardData`
- Se tem matches: cards com nome/empresa/categoria do parceiro, horário, status
  - Botões: "Abrir Chat" (vai para /conexoes) e "Reunião Realizada" (confirma que aconteceu fora)
  - Texto: "Converse pelo chat e combinem a reunião por fora"
- Se não tem: "Nenhuma conexão para hoje. Configure sua disponibilidade." + link /agenda

---

## 7. Edge Function: `generate-daily-matches`

Deploy via `mcp__supabase__deploy_edge_function`. Roda **1x/dia às 20:00 BRT (23:00 UTC)**.

### Lógica:

```
Para cada slot em ['07:00', '19:00']:
  1. Buscar usuários disponíveis AMANHÃ + slot:
     - user_availability.available_date = TOMORROW
     - slot_07 = true (ou slot_19)
     - users.status = 'active'
     - tem empresa primária com category_id

  2. Excluir quem já tem match amanhã+slot

  3. Para cada usuário, calcular "score de prioridade" do par:
     - Nunca conectou → prioridade máxima
     - Conectou há >3 dias → prioridade média
     - Conectou há ≤3 dias → só se não tiver outra opção
     (usar daily_match_history para consultar)

  4. Parear respeitando:
     - category_id diferente (flexibiliza se não houver opção)
     - Ambos disponíveis no mesmo slot
     - Priorizar pares novos/mais antigos

  5. Para cada par (A, B):
     - INSERT daily_matches: (A→B, slot) e (B→A, slot)
     - INSERT daily_match_history: (A↔B, date)
     - INSERT notifications para A e B
```

### Cron: `0 23 * * *` (23:00 UTC = 20:00 BRT)

---

## 8. Painel Admin — Conexões do Dia

**Arquivo:** `src/app/(admin)/admin/conexoes/page.tsx` (novo)

- Seletor de data (default: amanhã)
- Lista de matches gerados para a data selecionada
- Cada match mostra: Usuário A ↔ Usuário B, horário, categorias
- **Flag de repetição**: badge "Repetido (Xª vez)" se o par já se conectou antes (consulta `daily_match_history`)
- Ações: Remover match, Trocar parceiro (dropdown com disponíveis), Criar match manual
- Acesso: só admin (`role = 'admin'`)

### Service: `src/services/admin.service.ts` (adicionar funções)
- `fetchDailyMatchesAdmin(date)` — todos os matches de uma data, com dados enriquecidos + contagem de repetições
- `deleteDailyMatch(matchId)` — remove par bilateral
- `createManualMatch(userA, userB, date, slot)` — cria par manual
- `swapMatch(matchId, newPartnerId)` — troca parceiro

### Sidebar admin: adicionar item "Conexões" no menu admin.

---

## Ordem de implementação

1. Migrations (user_availability + daily_matches ajuste + RLS)
2. Types (DailyMatchRow, UserAvailability)
3. Services (availability + daily-match)
4. Página /agenda
5. Sidebar (link Agenda para users + link Conexões para admin)
6. Dashboard (seção Conexões do Dia)
7. Edge Function (generate-daily-matches)
8. Painel admin (página + service)
9. `npm run build`

---

## Arquivos afetados

| Arquivo | Ação |
|---|---|
| Supabase migration | Criar `user_availability`, ajustar `daily_matches`, RLS |
| `src/types/index.ts` | Adicionar `DailyMatchRow`, `UserAvailability`, remover `DailyMatch` |
| `src/services/availability.service.ts` | **Novo** |
| `src/services/daily-match.service.ts` | **Novo** |
| `src/services/admin.service.ts` | Adicionar funções de match admin |
| `src/app/(dashboard)/agenda/page.tsx` | **Novo** |
| `src/app/(dashboard)/dashboard/page.tsx` | Adicionar seção Conexões do Dia |
| `src/app/(admin)/admin/conexoes/page.tsx` | **Novo** |
| `src/components/layout/Sidebar.tsx` | Adicionar Agenda (user) + Conexões (admin) |
| Edge Function `generate-daily-matches` | **Novo** |

---

## Verificação

1. /agenda: grid semanal funciona, toggles salvam, hoje desabilitado
2. Sidebar: link Agenda visível para users ativos
3. Dashboard: seção Conexões do Dia com dados do banco (ou msg vazio)
4. Edge Function: deploy OK, gera matches corretamente
5. Admin /conexoes: lista matches, flag repetição, ações manuais
6. `npm run build` sem erros
