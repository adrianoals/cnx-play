# Modelagem de Dados - CnxPlay (Conecta Empresarios)

> Versao em portugues para revisao

---

## Sumario

1. [Visao Geral](#visao-geral)
2. [Diagrama de Entidades](#diagrama-de-entidades)
3. [Tipos Enumerados](#tipos-enumerados)
4. [Tabelas](#tabelas)
5. [Views (Consultas Computadas)](#views)
6. [Gatilhos e Funcoes](#gatilhos-e-funcoes)
7. [Seguranca por Linha (RLS)](#seguranca-por-linha)
8. [Tempo Real](#tempo-real)
9. [Armazenamento de Arquivos](#armazenamento-de-arquivos)
10. [Regras de Negocio](#regras-de-negocio)

---

## Visao Geral

### Tecnologias
- **Frontend:** Next.js 16 + Tailwind CSS 4 + TypeScript
- **Backend:** Supabase (Autenticacao, PostgreSQL, Tempo Real, Armazenamento, Edge Functions)
- **E-mail:** Resend + React Email
- **Pagamento:** InfinitePay (links externos)
- **Hospedagem:** Vercel (frontend) + Supabase Cloud (backend)

### Decisoes do Cliente
- **Fluxo do usuario:** Cadastro → Pagamento → Admin aprova manualmente → Ativo
- **Pagamento:** Suportar webhook automatico E aprovacao manual
- **Contato Diario:** Misto - algoritmo automatico por padrao, admin pode definir manualmente

---

## Diagrama de Entidades

```
auth.users (Autenticacao Supabase)
    | 1:1
    v
perfis ────────────────────────────────────────────────┐
    | 1:N                                               |
    |── imagens_galeria                                 |
    |── curtidas (de quem) ──gatilho──> conexoes        |
    |── conexoes (usuario1 / usuario2)                  |
    |       └── mensagens (id_conexao)                  |
    |── notificacoes                                    |
    |── negocios                                        |
    |── contatos_diarios (usuario + usuario_sugerido) <── perfis
    |── historico_contatos_diarios                      |
    |── reunioes (organizador + parceiro) <─────────────┘
    |── indicacoes (quem indicou)
    |── assinaturas
    └── leads_campanha (usuario convertido)
```

---

## Tipos Enumerados

| Nome no Banco | Valores | Descricao |
|---------------|---------|-----------|
| user_role | `user`, `admin` | Papel do usuario |
| user_status | `pending`, `active`, `inactive` | Situacao da conta: pendente, ativo, inativo |
| match_source | `mutual_like`, `manual`, `direct_message`, `daily` | Origem da conexao: curtida mutua, manual, mensagem direta, contato diario |
| notification_type | `match`, `message`, `like`, `system` | Tipo de notificacao: conexao, mensagem, curtida, sistema |
| meeting_status | `scheduled`, `completed`, `cancelled` | Situacao da reuniao: agendada, realizada, cancelada |
| meeting_platform | `google_meet`, `zoom`, `teams`, `whatsapp`, `presencial`, `other` | Plataforma da reuniao |
| referral_status | `pending`, `active`, `completed` | Situacao da indicacao: pendente, ativa, concluida |
| subscription_plan | `monthly`, `annual`, `visionary` | Plano: mensal, anual, visionario (Start 2026) |
| subscription_status | `active`, `past_due`, `cancelled`, `trialing`, `expired` | Situacao da assinatura: ativa, atrasada, cancelada, em teste, expirada |
| daily_match_status | `pending`, `completed` | Situacao do contato diario: pendente, realizado |

---

## Tabelas

### 1. profiles (Perfis)

Extensao da tabela de autenticacao do Supabase com dados do negocio.

| Coluna (banco) | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|----------------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID (chave primaria) | Sim | Mesmo do auth.users | Vinculado a conta de autenticacao |
| full_name | Nome completo | TEXT | Sim | - | Nome do usuario |
| email | E-mail | TEXT (unico) | Sim | - | E-mail corporativo |
| phone | Telefone | TEXT | Nao | - | WhatsApp/celular |
| cpf | CPF | TEXT | Nao | - | Documento pessoal |
| birth_date | Data de nascimento | DATE | Nao | - | - |
| address | Endereco | TEXT | Nao | - | Endereco residencial |
| company_name | Nome da empresa | TEXT | Nao | - | - |
| cnpj | CNPJ | TEXT | Nao | - | Documento da empresa |
| segment | Segmento | TEXT | Nao | - | Area de atuacao (texto livre) |
| description | Descricao | TEXT | Nao | - | Bio/descricao da empresa |
| avatar_url | URL do avatar | TEXT | Nao | - | Foto de perfil (URL do Storage) |
| role | Papel | user_role | Sim | 'user' | Papel: usuario ou admin |
| status | Situacao | user_status | Sim | 'pending' | Pendente, ativo ou inativo |
| score | Pontuacao | INTEGER | Sim | 0 | Atualizado por gatilhos (+10 reuniao, +50 indicacao) |
| meetings_count | Total de reunioes | INTEGER | Sim | 0 | Usado para calcular nivel |
| referral_code | Codigo de indicacao | TEXT (unico) | Nao | Gerado automaticamente | Ex: "LUCAS8829" |
| metadata | Metadados | JSONB | Nao | '{}' | Dados flexiveis de campanha |
| created_at | Criado em | TIMESTAMPTZ | Sim | agora | Data de cadastro |
| updated_at | Atualizado em | TIMESTAMPTZ | Sim | agora | Ultima atualizacao |

---

### 2. gallery_images (Imagens da Galeria)

Portfolio/galeria de imagens do usuario.

| Coluna (banco) | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|----------------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID | Sim | Gerado automaticamente | - |
| user_id | ID do usuario | UUID | Sim | - | Dono da imagem |
| image_url | URL da imagem | TEXT | Sim | - | URL no Storage |
| sort_order | Ordem | INTEGER | Sim | 0 | Posicao na galeria |
| created_at | Criado em | TIMESTAMPTZ | Sim | agora | - |

---

### 3. likes (Curtidas)

Curtida direcional de um usuario para outro (estilo Tinder).

| Coluna (banco) | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|----------------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID | Sim | Gerado automaticamente | - |
| from_user_id | De (quem curtiu) | UUID | Sim | - | Usuario que enviou a curtida |
| to_user_id | Para (quem recebeu) | UUID | Sim | - | Usuario que recebeu a curtida |
| created_at | Criado em | TIMESTAMPTZ | Sim | agora | - |

**Restricoes:**
- Nao pode curtir a si mesmo
- Par (de, para) e unico - nao pode curtir a mesma pessoa duas vezes

**Gatilho:** Quando inserida, verifica se existe curtida inversa. Se sim, cria conexao automaticamente.

---

### 4. matches (Conexoes)

Conexao bidirecional entre dois usuarios.

| Coluna (banco) | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|----------------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID | Sim | Gerado automaticamente | - |
| user1_id | Usuario 1 | UUID | Sim | - | Sempre o menor UUID |
| user2_id | Usuario 2 | UUID | Sim | - | Sempre o maior UUID |
| source | Origem | match_source | Sim | 'manual' | Como a conexao foi criada |
| created_at | Criado em | TIMESTAMPTZ | Sim | agora | - |

**Restricoes:**
- Nao pode conectar consigo mesmo
- user1_id sempre < user2_id (evita duplicatas invertidas)
- Par (user1, user2) e unico

---

### 5. messages (Mensagens)

Mensagens de chat dentro de uma conexao.

| Coluna (banco) | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|----------------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID | Sim | Gerado automaticamente | - |
| match_id | ID da conexao | UUID | Sim | - | Conversa a qual pertence |
| sender_id | ID do remetente | UUID | Sim | - | Quem enviou |
| text | Texto | TEXT | Sim | - | Conteudo da mensagem |
| read | Lida | BOOLEAN | Sim | FALSE | Se ja foi lida pelo destinatario |
| created_at | Criado em | TIMESTAMPTZ | Sim | agora | - |

**Tempo real habilitado** - substitui o polling de 2 segundos do sistema antigo.

---

### 6. notifications (Notificacoes)

Sistema de notificacoes dentro do app.

| Coluna (banco) | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|----------------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID | Sim | Gerado automaticamente | - |
| user_id | ID do usuario | UUID | Sim | - | Quem recebe a notificacao |
| type | Tipo | notification_type | Sim | - | Conexao, mensagem, curtida ou sistema |
| content | Conteudo | TEXT | Sim | - | Texto da notificacao |
| read | Lida | BOOLEAN | Sim | FALSE | Se ja foi lida |
| created_at | Criado em | TIMESTAMPTZ | Sim | agora | - |

---

### 7. deals (Negocios Fechados - Mural de Conquistas)

Negocios reportados pelos usuarios.

| Coluna (banco) | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|----------------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID | Sim | Gerado automaticamente | - |
| author_id | ID do autor | UUID | Sim | - | Quem reportou o negocio |
| partner_company_name | Nome da empresa parceira | TEXT | Sim | - | Texto livre (pode nao ser usuario) |
| value_brl | Valor (R$) | NUMERIC(15,2) | Sim | - | Valor do negocio (minimo 0) |
| deal_date | Data do negocio | DATE | Sim | Data atual | - |
| description | Descricao | TEXT | Nao | - | Detalhes do negocio |
| created_at | Criado em | TIMESTAMPTZ | Sim | agora | - |

---

### 8. daily_matches (Contatos Diarios)

Sugestao diaria de contato para cada usuario.

| Coluna (banco) | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|----------------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID | Sim | Gerado automaticamente | - |
| user_id | ID do usuario | UUID | Sim | - | Quem recebe a sugestao |
| matched_user_id | ID do usuario sugerido | UUID | Sim | - | Quem foi sugerido |
| match_date | Data | DATE | Sim | Data atual | - |
| suggested_time | Horario sugerido | TIME | Nao | - | Horario para o contato |
| status | Situacao | daily_match_status | Sim | 'pending' | Pendente ou realizado |
| assigned_by | Atribuido por | UUID | Nao | - | NULL = automatico; preenchido = admin que definiu |
| created_at | Criado em | TIMESTAMPTZ | Sim | agora | - |

**Restricoes:**
- Nao pode sugerir a si mesmo
- Maximo 1 sugestao por usuario por dia

---

### 9. daily_match_history (Historico de Contatos Diarios)

Evita repetir sugestoes.

| Coluna (banco) | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|----------------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID | Sim | Gerado automaticamente | - |
| user_id | ID do usuario | UUID | Sim | - | Quem recebeu a sugestao |
| shown_user_id | ID do usuario exibido | UUID | Sim | - | Quem foi exibido |
| shown_date | Data exibida | DATE | Sim | Data atual | - |

---

### 10. meetings (Reunioes)

Reunioes de networking agendadas ou realizadas.

| Coluna (banco) | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|----------------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID | Sim | Gerado automaticamente | - |
| organizer_id | ID do organizador | UUID | Sim | - | Quem criou a reuniao |
| partner_id | ID do parceiro | UUID | Nao | - | Outro participante (se for usuario) |
| partner_name | Nome do parceiro | TEXT | Nao | - | Fallback se parceiro nao e usuario |
| partner_role | Cargo do parceiro | TEXT | Nao | - | - |
| meeting_date | Data da reuniao | DATE | Sim | - | - |
| meeting_time | Horario | TIME | Sim | - | - |
| duration_minutes | Duracao (minutos) | INTEGER | Nao | 45 | - |
| platform | Plataforma | meeting_platform | Nao | 'google_meet' | Onde acontece |
| meeting_link | Link da reuniao | TEXT | Nao | - | URL de acesso |
| status | Situacao | meeting_status | Sim | 'scheduled' | Agendada, realizada ou cancelada |
| topics | Pautas | TEXT[] | Nao | '{}' | Lista de assuntos |
| rating | Avaliacao | SMALLINT | Nao | - | Nota de 0 a 5 estrelas |
| notes | Observacoes | TEXT | Nao | - | Anotacoes pos-reuniao |
| created_at | Criado em | TIMESTAMPTZ | Sim | agora | - |
| updated_at | Atualizado em | TIMESTAMPTZ | Sim | agora | - |

---

### 11. referrals (Indicacoes)

Programa de indicacoes.

| Coluna (banco) | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|----------------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID | Sim | Gerado automaticamente | - |
| referrer_id | ID de quem indicou | UUID | Sim | - | Usuario que fez a indicacao |
| referred_name | Nome do indicado | TEXT | Sim | - | - |
| referred_email | E-mail do indicado | TEXT | Nao | - | - |
| referred_user_id | ID do indicado (se cadastrou) | UUID | Nao | - | Preenchido se o indicado se registrar |
| status | Situacao | referral_status | Sim | 'pending' | Pendente, ativa ou concluida |
| points_awarded | Pontos concedidos | INTEGER | Sim | 0 | 50 pontos quando concluida |
| meetings_awarded | Reunioes bonus | INTEGER | Sim | 0 | +1 ao indicador |
| created_at | Criado em | TIMESTAMPTZ | Sim | agora | - |
| updated_at | Atualizado em | TIMESTAMPTZ | Sim | agora | - |

---

### 12. subscriptions (Assinaturas)

Assinaturas e controle de pagamento.

| Coluna (banco) | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|----------------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID | Sim | Gerado automaticamente | - |
| user_id | ID do usuario | UUID | Sim | - | Assinante |
| plan | Plano | subscription_plan | Sim | - | Mensal, anual ou visionario |
| status | Situacao | subscription_status | Sim | 'active' | Ativa, atrasada, cancelada, etc. |
| price_brl | Preco (R$) | NUMERIC(10,2) | Sim | - | Valor cobrado |
| starts_at | Inicio | TIMESTAMPTZ | Sim | agora | Data de inicio |
| ends_at | Fim | TIMESTAMPTZ | Nao | - | Data de expiracao |
| external_payment_id | ID externo pagamento | TEXT | Nao | - | ID da transacao no InfinitePay |
| external_payment_url | URL do pagamento | TEXT | Nao | - | Link de pagamento |
| payment_confirmed_at | Pagamento confirmado em | TIMESTAMPTZ | Nao | - | NULL = nao confirmado |
| admin_approved_at | Aprovado pelo admin em | TIMESTAMPTZ | Nao | - | NULL = nao aprovado |
| admin_approved_by | Aprovado por (admin) | UUID | Nao | - | Qual admin aprovou |
| created_at | Criado em | TIMESTAMPTZ | Sim | agora | - |
| updated_at | Atualizado em | TIMESTAMPTZ | Sim | agora | - |

### Fluxo de ativacao:
```
1. Usuario se cadastra         → perfil com situacao = 'pendente'
2. Usuario realiza pagamento   → assinatura.pagamento_confirmado_em = agora
3. Admin aprova                → assinatura.aprovado_pelo_admin_em = agora
                               → perfil.situacao = 'ativo'
```

---

### 13. campaign_leads (Leads de Campanha)

Leads captados em campanhas de marketing (ex: Ano Novo).

| Coluna (banco) | Traducao | Tipo | Obrigatorio | Padrao | Descricao |
|----------------|----------|------|-------------|--------|-----------|
| id | Identificador | UUID | Sim | Gerado automaticamente | - |
| full_name | Nome completo | TEXT | Sim | - | - |
| email | E-mail | TEXT | Sim | - | - |
| phone | Telefone | TEXT | Nao | - | - |
| segment | Segmento | TEXT | Nao | - | Area de atuacao |
| potential_connection | Conexao desejada | TEXT | Nao | - | Que tipo de parceiro busca |
| age_range | Faixa etaria | TEXT | Nao | - | - |
| region | Regiao | TEXT | Nao | - | - |
| campaign_name | Nome da campanha | TEXT | Sim | - | Ex: "Ano Novo 2026" |
| campaign_source | Origem da campanha | TEXT | Nao | - | Ex: "anonovo" |
| converted_user_id | ID do usuario convertido | UUID | Nao | - | Preenchido se virou usuario |
| metadata | Metadados | JSONB | Nao | '{}' | Dados extras |
| created_at | Criado em | TIMESTAMPTZ | Sim | agora | - |

---

## Views

### v_leaderboard (Ranking)

| Campo | Descricao |
|-------|-----------|
| id | ID do usuario |
| full_name | Nome completo |
| company_name | Nome da empresa |
| avatar_url | Foto de perfil |
| segment | Segmento |
| score | Pontuacao total |
| meetings_count | Total de reunioes |
| total_deal_value | Valor total em negocios (R$) |
| deal_count | Quantidade de negocios |
| level | Nivel: Platina, Safira ou Diamante |
| rank_position | Posicao no ranking |

### v_user_stats (Estatisticas do Usuario)

| Campo | Descricao |
|-------|-----------|
| user_id | ID do usuario |
| full_name | Nome completo |
| company_name | Nome da empresa |
| score | Pontuacao |
| meetings_count | Total de reunioes |
| level | Nivel calculado |
| total_deal_value | Valor total em negocios (R$) |
| deal_count | Quantidade de negocios |
| match_count | Quantidade de conexoes |
| referral_count | Quantidade de indicacoes |
| referral_points | Pontos de indicacao |

### v_platform_totals (Totais da Plataforma)

| Campo | Descricao |
|-------|-----------|
| total_deal_value | Valor total de todos os negocios (R$) |
| total_deals | Quantidade total de negocios |
| active_users | Usuarios ativos |
| total_matches | Total de conexoes |

---

## Gatilhos e Funcoes

| Gatilho | Quando dispara | O que faz |
|---------|----------------|-----------|
| Novo usuario cadastrado | Ao criar conta na autenticacao | Cria perfil automaticamente com codigo de indicacao |
| Nova curtida | Ao inserir curtida | Verifica curtida mutua → cria conexao + notifica ambos |
| Reuniao realizada | Ao marcar reuniao como 'completed' | +10 pontos e +1 reuniao no perfil do organizador |
| Contato diario realizado | Ao marcar contato diario como 'completed' | +10 pontos, +1 reuniao, cria conexao social |
| Indicacao concluida | Ao marcar indicacao como 'completed' | +50 pontos ao indicador |
| Nova mensagem | Ao enviar mensagem | Cria notificacao para o destinatario |
| Atualizacao de registro | Ao atualizar perfil/reuniao/assinatura/indicacao | Atualiza campo "atualizado_em" automaticamente |

### Funcoes auxiliares

| Funcao | O que faz |
|--------|-----------|
| is_admin() | Retorna verdadeiro se o usuario autenticado e administrador |
| is_super_admin() | Retorna verdadeiro se o e-mail e um dos super admins protegidos |

**Super admins protegidos:**
- lucasreccchia@companyconexaoplay.com
- lucasreccchia@gmail.com

---

## Seguranca por Linha

### Quem pode fazer o que em cada tabela

| Tabela | Ver | Criar | Editar | Excluir |
|--------|-----|-------|--------|---------|
| **Perfis** | Ativos veem ativos + proprio; Admin ve todos | Automatico (gatilho) | Proprio perfil (sem mudar papel/situacao); Admin edita qualquer | Admin (exceto super admins) |
| **Galeria** | Qualquer pessoa | Dono da galeria | Dono da galeria | Dono da galeria |
| **Curtidas** | Proprias curtidas + admin | Quem curtiu = usuario logado | - | Proprias curtidas |
| **Conexoes** | Participantes + admin | Via gatilho/admin | - | - |
| **Mensagens** | Participantes da conexao + admin | Remetente = logado + membro da conexao | Marcar como lida (so mensagens de outros) | - |
| **Notificacoes** | Proprio usuario | Via gatilho/admin | Marcar como lida | - |
| **Negocios** | Usuarios ativos + admin | Autor = usuario logado | Autor = usuario logado | Autor + admin |
| **Contatos Diarios** | Proprio + admin | Admin ou proprio | Proprio usuario | - |
| **Historico Contatos** | Proprio + admin | Proprio ou admin | - | - |
| **Reunioes** | Organizador ou parceiro + admin | Organizador = usuario logado | Organizador ou parceiro | - |
| **Indicacoes** | Proprio + admin | Indicador = usuario logado | Apenas admin | - |
| **Assinaturas** | Proprio + admin | Admin/webhook | Admin | - |
| **Leads Campanha** | Apenas admin | Qualquer visitante (nao precisa estar logado) | Admin | Admin |

### Principios de seguranca
- Usuarios **nunca** podem alterar seu proprio papel ou situacao
- Super admins **nunca** podem ser excluidos
- Mensagens so podem ser enviadas dentro de conexoes existentes
- Assinaturas so sao criadas por admin ou webhook do servidor
- Leads de campanha podem ser inseridos por visitantes nao autenticados

---

## Tempo Real

Tabelas com atualizacao em tempo real habilitada:

| Tabela | Motivo |
|--------|--------|
| **Mensagens** | Chat em tempo real (substitui polling antigo de 2 segundos) |
| **Notificacoes** | Notificacoes instantaneas dentro do app |
| **Conexoes** | Alertar novo match imediatamente |
| **Contatos Diarios** | Atualizar quando admin atribui contato |

> Apenas estas 4 tabelas precisam de tempo real. Adicionar mais desperdicaria recursos.

---

## Armazenamento de Arquivos

| Pasta (Bucket) | Publico | Tamanho Maximo | Tipos Permitidos | Uso |
|-----------------|---------|----------------|------------------|-----|
| **avatars** | Sim | 2MB | JPEG, PNG, WebP, GIF | Fotos de perfil |
| **gallery** | Sim | 2MB | JPEG, PNG, WebP, GIF | Portfolio/galeria |

### Estrutura de pastas
```
avatars/
  {id_do_usuario}/
    avatar.jpg

gallery/
  {id_do_usuario}/
    img_001.jpg
    img_002.jpg
```

### Permissoes
- Qualquer pessoa pode **visualizar** (pastas publicas)
- Usuarios so podem **enviar/atualizar/excluir** arquivos em sua propria pasta

---

## Regras de Negocio

### Pontuacao
| Acao | Pontos ganhos |
|------|---------------|
| Reuniao realizada | +10 |
| Contato diario realizado | +10 |
| Indicacao concluida | +50 |

### Niveis (calculados automaticamente, nao armazenados)
| Nivel | Requisito |
|-------|-----------|
| Platina | Menos de 50 reunioes |
| Safira | 50 ou mais reunioes |
| Diamante | 151 ou mais reunioes |

### Fluxo completo de ativacao
```
1. Visitante acessa a landing page
2. Preenche cadastro               → Perfil criado com situacao "pendente"
3. Escolhe plano e paga             → Assinatura criada, pagamento_confirmado_em preenchido
4. Admin verifica e aprova          → aprovado_pelo_admin_em preenchido, perfil vira "ativo"
5. Usuario acessa o dashboard       → Todas as funcionalidades liberadas
```

### Planos disponiveis
| Plano | Preco | Periodo | Destaques |
|-------|-------|---------|-----------|
| Mensal | R$ 59,99/mes | Mensal | Acesso basico, 1 perfil/dia, suporte |
| Anual | R$ 497,00 (R$ 41,42/mes) | 12 meses | 2 reunioes/dia, badge fundador, prioridade em eventos |
| Start 2026 | R$ 365,00 (pagamento unico) | 365 dias | 365 conexoes, mentoria exclusiva, grupo VIP |

### Regra do match (conexao)
```
Usuario A curte Usuario B
    |
    v
Existe curtida inversa (B → A)?
    |
    ├── SIM → Cria conexao automatica + notifica ambos
    |
    └── NAO → Notifica B que alguem demonstrou interesse
```

### Contato diario (misto)
```
Todo dia, para cada usuario ativo:
    |
    ├── Admin definiu manualmente? → Usa a definicao do admin
    |
    └── Nao? → Algoritmo sugere usuario baseado em:
                - Segmento compativel
                - Nao foi sugerido recentemente (historico)
                - Usuario ativo com assinatura valida
```
