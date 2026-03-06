## Context

O CNX Play e uma plataforma de networking empresarial construida com Next.js (App Router), Supabase (banco + auth + storage), e componentes shadcn/ui. O painel admin fica em `(admin)/admin/` com verificacao de role/SUPER_ADMINS. Services ficam em `src/services/`, tipos em `src/types/index.ts`, e o Supabase client em `src/lib/supabase.ts` (browser) e `src/lib/supabase-server.ts` (server).

A nova funcionalidade de revista digital precisa se integrar a essa arquitetura existente sem dependencias externas (tipo Issuu), gerando a revista dinamicamente a partir de dados no banco.

## Goals / Non-Goals

**Goals:**
- Criar tabela `magazine_entrepreneurs` no Supabase com campos limitados para layout fixo
- Painel admin para CRUD de empresarios da revista com controle de ordem e status
- Viewer publico da revista com navegacao por paginas e layout fixo por empresario
- Upload de foto do empresario para Supabase Storage
- Responsividade desktop e mobile

**Non-Goals:**
- Geracao/download de PDF (estrutura preparada, mas implementacao futura)
- Multiplas edicoes da revista (v1 tera uma unica revista ativa)
- Editor WYSIWYG para personalizar layout por pagina
- Integracao com ferramentas externas

## Decisions

### 1. Estrutura da tabela `magazine_entrepreneurs`

Campos com limites de caracteres para garantir layout fixo:

| Campo | Tipo | Limite | Obrigatorio |
|-------|------|--------|-------------|
| id | uuid (PK) | - | sim |
| name | varchar | 60 chars | sim |
| company_name | varchar | 80 chars | sim |
| role_title | varchar | 60 chars | sim |
| photo_url | text | - | sim |
| bio | text | 300 chars | sim |
| institutional_text | text | 500 chars | nao |
| display_order | integer | - | sim |
| is_active | boolean | default true | sim |
| created_at | timestamptz | - | auto |
| updated_at | timestamptz | - | auto |

**Alternativa considerada:** Usar uma tabela de edicoes (magazine_editions) com relacao N:N. Descartado por complexidade desnecessaria na v1 — uma unica revista ativa e suficiente.

### 2. Storage para fotos

Criar bucket `magazine-photos` no Supabase Storage com policy publica de leitura. Upload feito via admin com validacao de tipo (JPEG/PNG/WebP) e tamanho maximo (2MB). Imagem redimensionada/comprimida no client antes do upload.

**Alternativa considerada:** Salvar imagem em base64 no banco. Descartado por impacto no tamanho do banco e performance.

### 3. Viewer da revista — react-pageflip

Usar a biblioteca `react-pageflip` (wrapper do turn.js em React) para o efeito de virar paginas. E leve, open-source, e funciona bem com React.

Estrutura das paginas:
1. **Capa** — componente fixo com logo/titulo da revista
2. **Paginas dos empresarios** — 1 por pagina, ordenados por `display_order`
3. **Pagina final** — componente fixo com info de contato/creditos

Cada pagina tera dimensoes fixas (proporcionais a A4: 210x297mm) com CSS que garante que o conteudo nunca ultrapasse os limites.

**Alternativa considerada:** Implementacao CSS pura com scroll snap. Descartado por nao ter o efeito visual de revista (page flip).

### 4. Rota admin

Nova rota `(admin)/admin/revista/page.tsx` seguindo o padrao existente:
- Client component com "use client"
- Usa `admin.service.ts` (ou novo `magazine.service.ts`) para operacoes CRUD
- Componentes shadcn/ui (Table, Dialog, Input, Button)
- Toast para feedback

### 5. Rota publica da revista

Nova rota `(marketing)/revista/page.tsx` — pagina publica sem necessidade de autenticacao. Busca apenas empresarios com `is_active = true`, ordenados por `display_order`.

### 6. RLS Policies

- **SELECT**: Publico pode ler registros com `is_active = true`
- **INSERT/UPDATE/DELETE**: Apenas usuarios com `role = 'admin'` ou email em SUPER_ADMINS

## Risks / Trade-offs

- **[Performance com muitas fotos]** → Usar lazy loading nas imagens e tamanho maximo de 2MB por foto. Comprimir no client antes do upload.
- **[react-pageflip em mobile]** → A lib suporta touch/swipe, mas o efeito de flip pode ser pesado em dispositivos antigos. Fallback: navegacao simples com botoes prev/next sem animacao 3D.
- **[Limites de caracteres rígidos]** → Podem frustrar o admin se o texto nao couber. Mitigacao: mostrar contador de caracteres em tempo real e preview da pagina no admin.
- **[Unica edicao]** → Se no futuro quiserem multiplas edicoes, sera necessario refatorar com tabela de edicoes. Aceitavel para v1.
