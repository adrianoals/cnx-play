# Modelagem de Dados v2 - CnxPlay (Conecta Empresarios)

> Foco: Sistema logado (area do usuario + area do admin)

---

## Sumario

1. [Visao Geral](#visao-geral)
2. [Diagrama de Entidades](#diagrama-de-entidades)
3. [Tabelas](#tabelas)
4. [Views](#views)
5. [Gatilhos e Funcoes](#gatilhos-e-funcoes)
6. [Seguranca por Linha (RLS)](#seguranca-por-linha)
7. [Tempo Real](#tempo-real)
8. [Armazenamento de Arquivos](#armazenamento-de-arquivos)
9. [Regras de Negocio](#regras-de-negocio)

---

## Visao Geral

### Escopo
- Area do usuario (dashboard, reunioes, chat, perfil, empresa, portfolio)
- Area do admin (gestao de usuarios, aprovacao de pagamentos, atribuicao de contatos diarios)

### Fora do escopo nesta versao
- Landing page / site publico
- Campanhas de marketing / leads

### Fluxo do usuario
```
Cadastro → Pagamento → Admin aprova → Ativo
```

---

## Diagrama de Entidades

```
auth.users (Supabase Auth - so autenticacao)
    | 1:1
    v
users (dados pessoais)
    |
    |── 1:N ── companies (empresas do usuario)
    |              └── category_id FK ── categories (categorias de empresa)
    |── 1:N ── gallery (portfolio/imagens)
    |── 1:N ── connections (solicitacoes de conexao)
    |              └── requester_id / requested_id → users
    |── 1:N ── daily_matches (contato diario)
    |              └── daily_match_history (historico)
    |── 1:N ── meetings (reunioes)
    |── 1:N ── deals (negocios fechados / mural de conquistas)
    |── 1:N ── messages (chat - exige conexao aceita)
    |── 1:N ── notifications (notificacoes)
    |── 1:N ── referrals (indicacoes + pontos armazenados)
    └── 1:N ── subscriptions (assinaturas/pagamentos)
```

### Fluxo de conexao e mensagens
```
Pesquisar empresas por categoria
    → Clicar "Conectar" → connections.status = 'pending'
    → Destinatario recebe notificacao
    → Aceitar → connections.status = 'accepted' → Chat liberado
    → Rejeitar → connections.status = 'rejected'
```

---

## Tabelas

### 1. users (Usuarios)

Tabela espelho do `auth.users`. Auth cuida da autenticacao, aqui ficam os dados pessoais.

| Coluna | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|--------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID PK | Sim | auth.users(id) | Vinculado a conta de autenticacao |
| full_name | Nome completo | TEXT | Sim | - | - |
| email | E-mail | TEXT (unico) | Sim | - | Mesmo do auth |
| phone | Telefone | TEXT | Nao | - | WhatsApp/celular |
| cpf | CPF | TEXT | Nao | - | - |
| birth_date | Data de nascimento | DATE | Nao | - | - |
| address | Endereco | TEXT | Nao | - | - |
| avatar_url | Foto de perfil | TEXT | Nao | - | URL do Storage |
| role | Papel | ENUM (user, admin) | Sim | 'user' | - |
| status | Situacao | ENUM (pending, active, inactive) | Sim | 'pending' | - |
| referral_code | Codigo de indicacao | TEXT (unico) | Nao | Gerado auto | Ex: "LUCAS8829" |
| created_at | Criado em | TIMESTAMPTZ | Sim | now() | - |
| updated_at | Atualizado em | TIMESTAMPTZ | Sim | now() | - |

**Observacoes:**
- Score e meetings_count **nao ficam aqui**. Sao calculados a partir da tabela `meetings`.
- Nivel (Platina/Safira/Diamante) e calculado via view, nunca armazenado.
- Dados de empresa ficam na tabela `companies`.

---

### 2. categories (Categorias de Empresa)

Categorias gerenciaveis pelo admin. Usadas para filtrar empresas na pesquisa.

| Coluna | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|--------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID PK | Sim | gen_random_uuid() | - |
| name | Nome | TEXT (unico) | Sim | - | Ex: "Tecnologia", "Saude", "Educacao" |
| slug | Slug | TEXT (unico) | Sim | - | Versao URL-friendly. Ex: "tecnologia" |
| sort_order | Ordem | INTEGER | Sim | 0 | Ordem de exibicao na UI |
| is_active | Ativa | BOOLEAN | Sim | true | Permite desativar sem excluir |
| created_at | Criado em | TIMESTAMPTZ | Sim | now() | - |

**Observacao:** Admin pode criar, editar e desativar categorias sem deploy. No frontend, a pesquisa filtra por categoria.

---

### 3. companies (Empresas)

Empresas vinculadas ao usuario. Relacao 1:N (comecar com 1, preparado para N).

| Coluna | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|--------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID PK | Sim | gen_random_uuid() | - |
| user_id | ID do usuario | UUID FK | Sim | - | Dono da empresa |
| category_id | Categoria | UUID FK | Nao | - | Referencia a tabela `categories` |
| name | Nome da empresa | TEXT | Sim | - | - |
| cnpj | CNPJ | TEXT | Nao | - | - |
| description | Descricao | TEXT | Nao | - | Bio/sobre a empresa |
| location | Localizacao | TEXT | Nao | - | Cidade/estado |
| contact_email | E-mail comercial | TEXT | Nao | - | Pode ser diferente do pessoal |
| contact_phone | Telefone comercial | TEXT | Nao | - | - |
| linkedin | LinkedIn | TEXT | Nao | - | URL do perfil |
| opportunities | Oportunidades | TEXT[] | Nao | '{}' | Lista de oportunidades de parceria |
| is_primary | Empresa principal | BOOLEAN | Sim | true | Qual aparece no perfil por padrao |
| created_at | Criado em | TIMESTAMPTZ | Sim | now() | - |
| updated_at | Atualizado em | TIMESTAMPTZ | Sim | now() | - |

**Mudanca v2:** Campo `segment` (texto livre) substituido por `category_id` (FK para `categories`). Permite filtrar por categoria na pesquisa e o admin gerencia as opcoes.

---

### 5. gallery (Portfolio/Galeria)

Imagens do portfolio da empresa (vinculada a company, nao ao user).

| Coluna | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|--------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID PK | Sim | gen_random_uuid() | - |
| company_id | ID da empresa | UUID FK | Sim | - | Empresa dona da imagem (CASCADE on delete) |
| image_url | URL da imagem | TEXT | Sim | - | URL no Storage |
| caption | Legenda | TEXT | Nao | - | Descricao da imagem |
| sort_order | Ordem | INTEGER | Sim | 0 | Posicao na galeria |
| created_at | Criado em | TIMESTAMPTZ | Sim | now() | - |

---

### 6. connections (Conexoes)

Solicitacoes de conexao entre usuarios. Substitui o antigo sistema de likes/matches com um fluxo mais profissional de networking.

| Coluna | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|--------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID PK | Sim | gen_random_uuid() | - |
| requester_id | ID do solicitante | UUID FK | Sim | - | Quem enviou o pedido de conexao |
| requested_id | ID do solicitado | UUID FK | Sim | - | Quem recebeu o pedido |
| status | Situacao | ENUM (pending, accepted, rejected) | Sim | 'pending' | - |
| created_at | Criado em | TIMESTAMPTZ | Sim | now() | - |
| responded_at | Respondido em | TIMESTAMPTZ | Nao | - | Preenchido quando aceita ou rejeita |

**Restricoes:**
- Nao pode conectar consigo mesmo (requester_id <> requested_id)
- Par unico: apenas 1 solicitacao entre dois usuarios (UNIQUE ordenado)
- Apenas usuarios ativos podem enviar/receber solicitacoes

**Fluxo:**
```
1. Usuario A pesquisa empresas por categoria
2. Encontra empresa do Usuario B → clica "Conectar"
3. Cria connections (requester=A, requested=B, status='pending')
4. Usuario B recebe notificacao
5. Usuario B aceita → status='accepted', responded_at=now()
6. Chat entre A e B fica liberado
```

**Observacao:** Mensagens so podem ser enviadas entre usuarios com conexao `accepted`. A RLS de `messages` valida isso.

---

### 7. daily_matches (Contatos Diarios)

Sugestao diaria de contato. Gerada automaticamente ou definida pelo admin.

| Coluna | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|--------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID PK | Sim | gen_random_uuid() | - |
| user_id | ID do usuario | UUID FK | Sim | - | Quem recebe a sugestao |
| suggested_user_id | ID do sugerido | UUID FK | Sim | - | Quem foi sugerido |
| match_date | Data | DATE | Sim | CURRENT_DATE | - |
| suggested_time | Horario sugerido | TIME | Nao | - | - |
| status | Situacao | ENUM (pending, completed) | Sim | 'pending' | - |
| assigned_by | Atribuido por | UUID FK | Nao | - | NULL = automatico; preenchido = admin |
| created_at | Criado em | TIMESTAMPTZ | Sim | now() | - |

**Restricoes:**
- Nao pode sugerir a si mesmo
- Maximo 1 sugestao por usuario por dia

---

### 8. daily_match_history (Historico de Contatos Diarios)

Evita repetir sugestoes de contato.

| Coluna | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|--------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID PK | Sim | gen_random_uuid() | - |
| user_id | ID do usuario | UUID FK | Sim | - | Quem recebeu |
| shown_user_id | ID do exibido | UUID FK | Sim | - | Quem foi exibido |
| shown_date | Data | DATE | Sim | CURRENT_DATE | - |

**Restricao:** Combinacao (user_id, shown_user_id, shown_date) e unica.

---

### 9. meetings (Reunioes)

Reunioes de networking. Base para calcular score e nivel.

| Coluna | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|--------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID PK | Sim | gen_random_uuid() | - |
| organizer_id | ID do organizador | UUID FK | Sim | - | Quem criou |
| partner_id | ID do parceiro | UUID FK | Nao | - | Outro participante (se for usuario) |
| partner_name | Nome do parceiro | TEXT | Nao | - | Fallback se nao for usuario |
| meeting_date | Data | DATE | Sim | - | - |
| meeting_time | Horario | TIME | Sim | - | - |
| duration_minutes | Duracao (min) | INTEGER | Nao | 45 | - |
| platform | Plataforma | ENUM | Nao | 'google_meet' | google_meet, zoom, teams, whatsapp, presencial, outro |
| meeting_link | Link | TEXT | Nao | - | URL de acesso |
| status | Situacao | ENUM | Sim | 'scheduled' | scheduled, completed, cancelled |
| topics | Pautas | TEXT[] | Nao | '{}' | - |
| rating | Avaliacao | SMALLINT | Nao | - | 0 a 5 estrelas |
| notes | Observacoes | TEXT | Nao | - | - |
| created_at | Criado em | TIMESTAMPTZ | Sim | now() | - |
| updated_at | Atualizado em | TIMESTAMPTZ | Sim | now() | - |

---

### 10. deals (Negocios Fechados / Mural de Conquistas)

Negocios reportados pelos usuarios. Alimenta o mural de conquistas e o ranking.

| Coluna | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|--------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID PK | Sim | gen_random_uuid() | - |
| author_id | ID do autor | UUID FK | Sim | - | Quem reportou o negocio |
| partner_company_name | Empresa parceira | TEXT | Sim | - | Texto livre (pode nao ser usuario) |
| value_brl | Valor (R$) | NUMERIC(15,2) | Sim | - | Valor do negocio (minimo 0) |
| deal_date | Data do negocio | DATE | Sim | CURRENT_DATE | - |
| description | Descricao | TEXT | Nao | - | Detalhes do negocio |
| created_at | Criado em | TIMESTAMPTZ | Sim | now() | - |

**Restricao:** value_brl >= 0

---

### 11. messages (Mensagens)

Chat entre usuarios conectados. So e possivel trocar mensagens se existir uma conexao com status `accepted` entre os dois usuarios.

| Coluna | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|--------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID PK | Sim | gen_random_uuid() | - |
| sender_id | ID do remetente | UUID FK | Sim | - | Quem enviou |
| receiver_id | ID do destinatario | UUID FK | Sim | - | Quem recebe |
| text | Texto | TEXT | Sim | - | Conteudo da mensagem |
| read | Lida | BOOLEAN | Sim | FALSE | - |
| created_at | Criado em | TIMESTAMPTZ | Sim | now() | - |

**Restricoes:**
- Remetente nao pode ser igual ao destinatario
- RLS exige conexao `accepted` entre sender e receiver para INSERT

---

### 12. notifications (Notificacoes)

Notificacoes dentro do app.

| Coluna | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|--------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID PK | Sim | gen_random_uuid() | - |
| user_id | ID do usuario | UUID FK | Sim | - | Quem recebe |
| type | Tipo | ENUM | Sim | - | connection, message, meeting, daily_match, referral, system |
| title | Titulo | TEXT | Sim | - | Titulo curto |
| content | Conteudo | TEXT | Sim | - | Texto da notificacao |
| read | Lida | BOOLEAN | Sim | FALSE | - |
| reference_id | ID de referencia | UUID | Nao | - | ID do objeto relacionado (reuniao, mensagem, etc.) |
| reference_type | Tipo de referencia | TEXT | Nao | - | Nome da tabela relacionada |
| created_at | Criado em | TIMESTAMPTZ | Sim | now() | - |

**Observacao:** `reference_id` + `reference_type` permitem que a notificacao aponte para o objeto correto (ex: clicar na notificacao abre a reuniao).

---

### 13. referrals (Indicacoes)

Programa de indicacoes entre usuarios. Pontos sao armazenados na indicacao.

| Coluna | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|--------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID PK | Sim | gen_random_uuid() | - |
| referrer_id | ID de quem indicou | UUID FK | Sim | - | - |
| referred_name | Nome do indicado | TEXT | Sim | - | - |
| referred_email | E-mail do indicado | TEXT | Nao | - | - |
| referred_user_id | ID do indicado (se cadastrou) | UUID FK | Nao | - | Preenchido quando o indicado se registra |
| status | Situacao | ENUM | Sim | 'pending' | pending, active, completed |
| points_awarded | Pontos concedidos | INTEGER | Sim | 0 | 50 pontos quando status vira 'completed' |
| meetings_awarded | Reunioes bonus | INTEGER | Sim | 0 | +1 reuniao bonus ao indicador |
| created_at | Criado em | TIMESTAMPTZ | Sim | now() | - |
| updated_at | Atualizado em | TIMESTAMPTZ | Sim | now() | - |

---

### 14. subscriptions (Assinaturas)

Controle de plano e pagamento.

| Coluna | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|--------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID PK | Sim | gen_random_uuid() | - |
| user_id | ID do usuario | UUID FK | Sim | - | Assinante |
| plan | Plano | ENUM | Sim | - | monthly, annual, visionary |
| status | Situacao | ENUM | Sim | 'pending' | pending, active, past_due, cancelled, expired |
| price_brl | Valor (R$) | NUMERIC(10,2) | Sim | - | - |
| starts_at | Inicio | TIMESTAMPTZ | Nao | - | Preenchido quando ativado |
| ends_at | Fim | TIMESTAMPTZ | Nao | - | Data de expiracao |
| payment_external_id | ID externo | TEXT | Nao | - | ID da transacao InfinitePay |
| payment_confirmed_at | Pagamento confirmado em | TIMESTAMPTZ | Nao | - | NULL = nao confirmado |
| admin_approved_at | Aprovado pelo admin em | TIMESTAMPTZ | Nao | - | NULL = nao aprovado |
| admin_approved_by | Aprovado por | UUID FK | Nao | - | Qual admin aprovou |
| created_at | Criado em | TIMESTAMPTZ | Sim | now() | - |
| updated_at | Atualizado em | TIMESTAMPTZ | Sim | now() | - |

### Fluxo:
```
1. Usuario se cadastra         → users.status = 'pending'
                               → subscriptions.status = 'pending'
2. Usuario paga                → subscriptions.payment_confirmed_at = now()
3. Admin aprova                → subscriptions.admin_approved_at = now()
                               → subscriptions.status = 'active'
                               → subscriptions.starts_at = now()
                               → users.status = 'active'
```

### Planos:
| Plano | Valor | Periodo |
|-------|-------|---------|
| Mensal | R$ 59,99/mes | Mensal |
| Anual | R$ 497,00 | 12 meses |
| Start 2026 | R$ 365,00 | 365 dias |

---

## Views

### v_user_stats (Estatisticas do Usuario)

Calcula score, total de reunioes, nivel e valor de negocios a partir dos dados reais.

| Campo | Fonte | Descricao |
|-------|-------|-----------|
| user_id | users.id | - |
| full_name | users.full_name | - |
| company_name | companies.name (principal) | Empresa principal |
| meetings_completed | COUNT de meetings com status 'completed' | Total de reunioes realizadas |
| referrals_completed | COUNT de referrals com status 'completed' | Total de indicacoes concluidas |
| referral_points | SUM de referrals.points_awarded | Pontos acumulados de indicacoes |
| total_deal_value | SUM de deals.value_brl | Valor total de negocios fechados (R$) |
| deal_count | COUNT de deals | Quantidade de negocios fechados |
| score | (meetings * 10) + referral_points | Calculado a partir das tabelas |
| level | Baseado em meetings_completed | Platina / Safira / Diamante |

**Niveis:**
| Nivel | Requisito |
|-------|-----------|
| Platina | < 50 reunioes |
| Safira | >= 50 reunioes |
| Diamante | >= 151 reunioes |

---

### v_leaderboard (Ranking)

| Campo | Descricao |
|-------|-----------|
| user_id | ID do usuario |
| full_name | Nome |
| company_name | Empresa principal |
| avatar_url | Foto |
| score | Pontuacao calculada |
| meetings_completed | Reunioes realizadas |
| total_deal_value | Valor total de negocios (R$) |
| deal_count | Quantidade de negocios |
| level | Nivel |
| rank_position | Posicao no ranking (por valor de deals) |

---

### v_platform_totals (Totais da Plataforma - Admin)

| Campo | Descricao |
|-------|-----------|
| active_users | Total de usuarios ativos |
| total_meetings | Total de reunioes realizadas |
| total_deal_value | Valor total de negocios na plataforma (R$) |
| total_deals | Quantidade total de negocios |
| total_referrals | Total de indicacoes |
| pending_approvals | Usuarios aguardando aprovacao |

---

## Gatilhos e Funcoes

| Gatilho | Quando | O que faz |
|---------|--------|-----------|
| on_auth_user_created | Novo cadastro no Auth | Cria registro na tabela `users` com referral_code |
| on_connection_requested | Nova solicitacao de conexao | Cria notificacao para o destinatario (tipo 'connection') |
| on_connection_accepted | Conexao aceita (status → 'accepted') | Cria notificacao para o solicitante informando que foi aceito |
| on_meeting_status_change | Meeting muda para 'completed' | Cria notificacao para o organizador |
| on_daily_match_completed | Contato diario realizado | Cria notificacao + registra no historico |
| on_message_created | Nova mensagem enviada | Cria notificacao para o destinatario |
| on_subscription_approved | Admin aprova assinatura | Atualiza users.status para 'active' |
| on_referral_completed | Indicacao muda para 'completed' | Atribui 50 pontos + 1 reuniao bonus ao indicador + cria notificacao |
| set_updated_at | Atualizacao em qualquer tabela com updated_at | Atualiza o campo automaticamente |

### Funcoes auxiliares

| Funcao | Descricao |
|--------|-----------|
| is_admin() | Retorna true se o usuario logado e admin |
| is_super_admin() | Retorna true se o email e um dos super admins protegidos |
| are_connected(user_a, user_b) | Retorna true se existe conexao 'accepted' entre os dois usuarios. Usada na RLS de messages |

**Super admins:**
- lucasreccchia@companyconexaoplay.com
- lucasreccchia@gmail.com

---

## Seguranca por Linha

| Tabela | Ver | Criar | Editar | Excluir |
|--------|-----|-------|--------|---------|
| **users** | Ativos veem ativos + proprio; Admin todos | Automatico (gatilho) | Proprio (sem mudar role/status); Admin qualquer | Admin (exceto super admins) |
| **categories** | Todos usuarios ativos | Admin | Admin | Admin |
| **companies** | Usuarios ativos veem todas; Admin todas | Dono | Dono; Admin qualquer | Dono; Admin |
| **gallery** | Usuarios ativos | Dono | Dono | Dono |
| **connections** | Participantes (requester ou requested) + admin | Usuario ativo (requester = uid) | Somente requested_id pode aceitar/rejeitar; Admin qualquer | - |
| **daily_matches** | Proprio + admin | Admin ou sistema | Proprio (mudar status) | - |
| **daily_match_history** | Proprio + admin | Sistema | - | - |
| **meetings** | Organizador ou parceiro + admin | Usuario logado | Organizador ou parceiro | Admin |
| **deals** | Usuarios ativos + admin | Autor = usuario logado | Autor; Admin | Autor; Admin |
| **messages** | Remetente ou destinatario | Usuario logado (sender = uid) + conexao 'accepted' com receiver | Marcar como lida (so destinatario) | - |
| **notifications** | Proprio | Sistema/gatilhos | Marcar como lida | - |
| **referrals** | Proprio + admin | Usuario logado | Admin (mudar status) | - |
| **subscriptions** | Proprio + admin | Sistema | Admin (aprovar) | - |

---

## Tempo Real

| Tabela | Motivo |
|--------|--------|
| **messages** | Chat em tempo real |
| **notifications** | Notificacoes instantaneas (inclui solicitacoes de conexao) |
| **connections** | Atualizar status de conexao em tempo real |
| **daily_matches** | Atualizar quando admin atribui |

---

## Armazenamento de Arquivos

| Bucket | Publico | Max | Tipos | Uso |
|--------|---------|-----|-------|-----|
| **avatars** | Sim | 2MB | JPEG, PNG, WebP | Foto de perfil |
| **gallery** | Sim | 2MB | JPEG, PNG, WebP | Portfolio |

### Estrutura
```
avatars/{user_id}/avatar.jpg
gallery/{company_id}/img_001.jpg
```

### Permissoes
- Qualquer pessoa pode visualizar
- So o dono pode enviar/atualizar/excluir em sua pasta

---

## Regras de Negocio

### Pontuacao
| Acao | Pontos | Onde fica armazenado |
|------|--------|----------------------|
| Reuniao realizada | +10 | Calculado via COUNT de meetings completed |
| Indicacao concluida | +50 | Armazenado em referrals.points_awarded |

**Score total** = (reunioes realizadas * 10) + SUM(referrals.points_awarded) → calculado na view `v_user_stats`

### Niveis (calculados via view)
| Nivel | Requisito |
|-------|-----------|
| Platina | < 50 reunioes |
| Safira | >= 50 reunioes |
| Diamante | >= 151 reunioes |

### Fluxo de ativacao
```
Cadastro → Pagamento → Admin aprova → Ativo
```

### Contato diario
```
Todo dia, para cada usuario ativo:
    |
    |── Admin definiu? → Usa definicao do admin
    |
    └── Nao? → Algoritmo sugere baseado em:
                - Categoria da empresa
                - Historico (nao repetir)
                - Usuario ativo com assinatura valida
```

### Pesquisa de empresas e conexoes
```
1. Usuario acessa aba de pesquisa
2. Filtra por categoria (tabela categories)
3. Visualiza empresas com dados basicos (nome, categoria, descricao, avatar)
4. Clica "Conectar" → cria solicitacao de conexao (pending)
5. Outro usuario recebe notificacao
6. Aceita → conexao 'accepted' → botao "Mensagem" fica disponivel
7. Rejeita → conexao 'rejected' → pode solicitar novamente no futuro (a definir)
```

### Itens em aberto (confirmar com o dono)
- [x] Empresa: confirmado 1:N (um usuario pode ter varias empresas)
- [x] Conexoes: confirmado fluxo solicitar → aceitar → chat liberado
- [x] Categorias: confirmado tabela gerenciavel pelo admin
- [ ] Rejeicao: usuario rejeitado pode solicitar conexao novamente? (definir regra)
