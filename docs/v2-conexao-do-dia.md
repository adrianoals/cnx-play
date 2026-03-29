# Conecta Play v2 — Conexao do Dia

> Documento de mudancas, plano de implementacao e pendencias de backend.
> Data: 2026-03-29

---

## 1. Visao Geral

Substituir o modelo atual (usuario marca disponibilidade na agenda para receber matches automaticos) por um modelo simplificado:

- **Admin sorteia/forma os matches manualmente**
- **Conexao automatica sem confirmacao** — ao criar o match, a conexao ja e aceita
- **Usuario ve apenas a "Conexao do Dia"** com dados do parceiro + WhatsApp
- **Chat interno desativado** — contato via WhatsApp externo
- **Nova regra de pontuacao** — marcar presenca = pontos

---

## 2. Mudancas Detalhadas

### 2.1 Pagina do Usuario: Conexao do Dia (substitui `/agenda`)

**Antes:**
- Aba "Disponibilidade" — usuario marca slots Manha/Tarde por dia
- Aba "Historico" — lista de matches passados com status

**Depois:**
- Pagina unica mostrando a **conexao do dia atual** (se houver)
- Card com informacoes do parceiro:
  - Nome completo
  - Nome da empresa
  - Ramo/Categoria de atuacao
  - Telefone com **link WhatsApp** clicavel (`https://wa.me/55XXXXXXXXXXX`)
- Botao **"Marcar Presenca"** (ganha pontos)
- Se nao houver conexao no dia: mensagem informativa
- **Sem historico** para o usuario — cada dia e uma nova conexao, se nao entrou em contato, perdeu

**Arquivo:** `src/app/(dashboard)/agenda/page.tsx` — reescrever completamente

### 2.2 Sistema de Pontuacao (Nova Regra)

**Antes:**
- Ambos precisam confirmar match para ganhar pontos
- +10 pontos por confirmacao (trigger `handle_daily_match_completed`)

**Depois:**
- Usuario clica "Marcar Presenca" na conexao do dia → **+1 ponto** para quem marcou
- Se **ambos** marcarem presenca → **+2 pontos** para cada um (bonus bilateral)
- Se ninguem marcar → 0 pontos
- Pontuacao por **referrals** e **deals** permanece inalterada

**Arquivos frontend:**
- `src/services/daily-match.service.ts` — nova funcao `markPresence(matchId)`
- `src/app/(dashboard)/agenda/page.tsx` — botao "Marcar Presenca"

**Pendencia Supabase:** trigger `handle_daily_match_completed` precisa ser alterado (ver secao 5)

### 2.3 Matches — Apenas pelo Admin

**Antes:**
- Sorteio automatico via RPC `generate_daily_matches` no Supabase
- Admin podia criar matches manuais via `/admin/agendas`

**Depois:**
- Sorteio automatico **desativado** (desabilitar no Supabase depois)
- Admin forma matches **manualmente** em `/admin/agendas`
- `createManualMatch()` agora tambem cria **conexao aceita automaticamente**
- **Validacao nova:** maximo 1 match por dia por usuario

**Arquivo:** `src/services/admin.service.ts` — alterar `createManualMatch()`

### 2.4 Pagina Admin de Agendas — Melhorias

**Antes:**
- Lista de usuarios com toggles de disponibilidade (Manha/Tarde)
- Todos misturados, sem distincao

**Depois:**
- Lista dividida em **duas secoes**:
  1. **Usuarios COM empresa cadastrada** — aptos para match (destaque verde)
  2. **Usuarios SEM empresa cadastrada** — admin pode correr atras para regularizar (destaque vermelho/cinza)
- Admin seleciona pares apenas entre usuarios com empresa
- Indicador visual se usuario ja tem match no dia (impedir duplicata)

**Arquivo:** `src/app/(admin)/admin/agendas/page.tsx` — alterar layout
**Arquivo:** `src/services/admin.service.ts` — nova funcao `fetchUsersGroupedByCompany()`

### 2.5 Chat/Mensagens — Desativado

**Antes:**
- Aba "Conversas" em `/conexoes` com chat completo entre conexoes aceitas
- Botao "Mensagem" no card de busca (`/search`)

**Depois:**
- Aba "Conversas" **removida** de `/conexoes`
- Sistema de mensagens **desativado**
- Contato entre usuarios sera via **WhatsApp** (link na conexao do dia)

**Arquivos:**
- `src/app/(dashboard)/conexoes/page.tsx` — remover aba Conversas, manter so Solicitacoes
- `src/app/(dashboard)/search/page.tsx` — remover botao "Mensagem" para conexoes aceitas
- `src/services/messages.service.ts` — nao usado mais (manter arquivo, apenas desacoplar)

### 2.6 Busca (`/search`) — Mantida com Ajustes

**Antes:**
- Botao "Conectar" com mensagem "Confirmar (-1 ponto)" (falso — nao descontava)
- Botao "Mensagem" para conexoes aceitas abre chat
- Gate: score >= 1 para solicitar conexao
- Sem limite diario

**Depois:**
- Gate `score >= 1` **mantido**
- Corrigir mensagem — remover "-1 ponto" (nao ha deducao real)
- Botao "Mensagem" **removido** (chat desativado)
- Para conexoes aceitas: mostrar apenas badge "Conectado" ou link WhatsApp
- Sem limite diario **mantido**

**Arquivo:** `src/app/(dashboard)/search/page.tsx`

### 2.7 Pagina `/conexoes` — Simplificada

**Antes:**
- Aba "Solicitacoes" (recebidas + enviadas)
- Aba "Conversas" (chat completo)

**Depois:**
- Apenas aba "Solicitacoes" (recebidas + enviadas)
- Sem chat

**Arquivo:** `src/app/(dashboard)/conexoes/page.tsx`

### 2.8 Sidebar/Menu

**Antes:**
- "Agenda" → `/agenda`
- "Conexoes" → `/conexoes`

**Depois:**
- **"Conexao do Dia"** → `/agenda` (renomear label + trocar icone)
- "Conexoes" → `/conexoes` (mantido, mas so solicitacoes agora)

**Arquivo:** `src/components/layout/Sidebar.tsx`

---

## 3. Plano de Implementacao (Etapas)

### Etapa 1 — Servicos e Logica de Negocio

1. **`src/services/admin.service.ts`**
   - Alterar `createManualMatch()` → criar conexao aceita (`connections.status = 'accepted'`) junto com o match
   - Adicionar validacao: 1 match/dia por usuario (verificar `daily_matches` antes de inserir)
   - Nova funcao `fetchUsersGroupedByCompany(date)` → retorna `{ withCompany: [], withoutCompany: [] }`

2. **`src/services/daily-match.service.ts`**
   - Nova funcao `fetchTodayConnection()` → busca o match do dia com dados completos do parceiro (nome, empresa, categoria, telefone/WhatsApp)
   - Nova funcao `markPresence(matchId)` → marca `daily_matches.status = 'completed'` para o usuario logado
   - Nova funcao `checkPresenceStatus(matchId)` → verifica se ja marcou presenca
   - Remover/desativar `confirmMatch()` (substituido por `markPresence`)
   - Manter `fetchTodayMatches()` para compatibilidade temporaria

3. **`src/services/availability.service.ts`**
   - Desacoplar do uso pelo usuario (manter arquivo para o admin, que ainda gerencia disponibilidade)

4. **`src/types/index.ts`**
   - Adicionar campo `partnerPhone?: string` em `DailyMatchRow` (ou criar tipo novo `TodayConnection`)

### Etapa 2 — Pagina Conexao do Dia (Usuario)

5. **`src/app/(dashboard)/agenda/page.tsx`**
   - Reescrever completamente
   - Mostrar card com dados da conexao do dia
   - Botao "Marcar Presenca" que chama `markPresence()`
   - Link WhatsApp clicavel
   - Estado vazio quando nao ha conexao
   - Sem tabs, sem historico

### Etapa 3 — Admin: Listagem por Empresa

6. **`src/app/(admin)/admin/agendas/page.tsx`**
   - Na tab "Por Data": dividir lista em "Com Empresa" e "Sem Empresa"
   - Indicador visual se usuario ja tem match no dia
   - Bloquear pareamento se usuario ja tem match no dia

### Etapa 4 — Desativar Chat e Ajustar Paginas

7. **`src/app/(dashboard)/conexoes/page.tsx`**
   - Remover aba "Conversas" e todo o codigo de chat
   - Manter apenas aba "Solicitacoes" (recebidas + enviadas)

8. **`src/app/(dashboard)/search/page.tsx`**
   - Remover botao "Mensagem" para conexoes aceitas
   - Substituir por badge "Conectado" ou similar
   - Corrigir texto do dialog de confirmacao (remover "-1 ponto")

9. **`src/components/layout/Sidebar.tsx`**
   - Renomear "Agenda" → "Conexao do Dia"
   - Trocar icone de `Calendar` para `Link2` ou `Zap`

### Etapa 5 — Limpeza

10. **Remover imports nao utilizados** em todos os arquivos alterados
11. **Verificar build** (`npm run build`)
12. **Rodar lint** (`npm run lint`)

---

## 4. Resumo de Arquivos Afetados

| Arquivo | Acao | Etapa |
|---------|------|-------|
| `src/services/admin.service.ts` | Alterar: createManualMatch + fetchUsersGroupedByCompany | 1 |
| `src/services/daily-match.service.ts` | Alterar: fetchTodayConnection + markPresence | 1 |
| `src/services/availability.service.ts` | Desacoplar do usuario | 1 |
| `src/types/index.ts` | Adicionar partnerPhone em DailyMatchRow | 1 |
| `src/app/(dashboard)/agenda/page.tsx` | Reescrever: Conexao do Dia | 2 |
| `src/app/(admin)/admin/agendas/page.tsx` | Alterar: separar por empresa | 3 |
| `src/app/(dashboard)/conexoes/page.tsx` | Simplificar: remover chat | 4 |
| `src/app/(dashboard)/search/page.tsx` | Ajustar: remover mensagem, corrigir texto | 4 |
| `src/components/layout/Sidebar.tsx` | Renomear: Conexao do Dia | 4 |
| `src/services/messages.service.ts` | Desativado (manter arquivo) | — |

---

## 5. Pendencias Supabase (Backend)

Estas alteracoes precisam ser feitas diretamente no Supabase e **nao** podem ser implementadas pelo frontend.

### 5.1 Trigger de Pontuacao — Alterar

**Trigger atual:** `handle_daily_match_completed`
- Quando `daily_matches.status` muda para `completed` → +10 pontos

**Nova logica:**
```sql
-- Proposta de nova trigger
CREATE OR REPLACE FUNCTION public.handle_daily_match_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner_status TEXT;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    -- Dar +1 ponto para quem marcou presenca
    UPDATE public.profiles
    SET score = score + 1,
        meetings_count = meetings_count + 1,
        updated_at = now()
    WHERE id = NEW.user_id;

    -- Verificar se o parceiro ja marcou presenca
    SELECT status INTO v_partner_status
    FROM public.daily_matches
    WHERE user_id = NEW.suggested_user_id
      AND suggested_user_id = NEW.user_id
      AND match_date = NEW.match_date
      AND time_slot = NEW.time_slot;

    -- Se o parceiro ja marcou, dar +1 bonus para AMBOS
    IF v_partner_status = 'completed' THEN
      -- Bonus para quem acabou de marcar
      UPDATE public.profiles
      SET score = score + 1, updated_at = now()
      WHERE id = NEW.user_id;

      -- Bonus para o parceiro que ja tinha marcado
      UPDATE public.profiles
      SET score = score + 1, updated_at = now()
      WHERE id = NEW.suggested_user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
```

**Resultado:**
- 1 marca → +1 ponto (total: 1)
- Ambos marcam → +2 pontos cada (1 base + 1 bonus)

### 5.2 Desativar Sorteio Automatico

- Desabilitar ou remover a funcao RPC `generate_daily_matches` (ou o cron job que a chama)
- Manter a funcao `get_today_matches` que apenas le os matches existentes

### 5.3 Campo Telefone

- Verificar se a tabela `users`/`profiles` ja tem campo `phone` acessivel
- Se nao, verificar se `companies` tem campo de telefone
- Garantir que o telefone esteja disponivel para a query de conexao do dia

### 5.4 View `v_user_stats`

- Ajustar se necessario para refletir a nova pontuacao (provavelmente nao precisa, pois le `score` direto de `profiles`)

---

## 6. Fluxo Final (Apos Implementacao)

```
Admin acessa /admin/agendas
    |
    v
Ve lista de usuarios separada:
  [COM empresa] - aptos para match
  [SEM empresa] - precisam regularizar
    |
    v
Admin seleciona 2 usuarios com empresa
e cria match manual (1 por dia max)
    |
    v
Sistema cria:
  - daily_matches (bilateral)
  - daily_match_history
  - connections (status: accepted) ← NOVO
    |
    v
Usuario acessa "Conexao do Dia"
    |
    v
Ve card com: Nome | Empresa | Ramo | WhatsApp
    |
    v
Opcao 1: Clica WhatsApp → contato externo
Opcao 2: Clica "Marcar Presenca" → +1 ponto
    (se parceiro tambem marcar → +2 pontos cada)
Opcao 3: Nao faz nada → 0 pontos, perdeu a conexao
    |
    v
Proximo dia → nova conexao (sem historico para usuario)
```

---

## 7. O Que NAO Muda

- **Busca (`/search`)** — mantida com gate de pontos (score >= 1)
- **Sistema de referrals** — mantido como esta
- **Sistema de deals/negocios** — mantido como esta
- **Niveis (Platina/Safira/Diamante)** — mantidos, thresholds iguais
- **Pagina admin de matches (`/admin/conexoes`)** — mantida (admin ve historico)
- **Leaderboard** — mantido
- **Dashboard** — mantido
