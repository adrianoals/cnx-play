## 1. Banco de Dados e Storage

- [x] 1.1 Criar tabela `magazine_entrepreneurs` no Supabase com todos os campos (id, name, company_name, role_title, photo_url, bio, institutional_text, display_order, is_active, created_at, updated_at) e constraints de tamanho
- [x] 1.2 Configurar RLS policies: SELECT publico para `is_active = true`, INSERT/UPDATE/DELETE apenas para admins
- [x] 1.3 Criar bucket `magazine-photos` no Supabase Storage com policy de leitura publica e escrita restrita a admins

## 2. Service Layer e Tipos

- [x] 2.1 Adicionar tipo `MagazineEntrepreneur` em `src/types/index.ts`
- [x] 2.2 Criar `src/services/magazine.service.ts` com funcoes: fetchAllMagazineEntrepreneurs, fetchActiveMagazineEntrepreneurs, createMagazineEntrepreneur, updateMagazineEntrepreneur, deleteMagazineEntrepreneur, uploadMagazinePhoto, reorderMagazineEntrepreneurs

## 3. Painel Admin da Revista

- [x] 3.1 Criar pagina `src/app/(admin)/admin/revista/page.tsx` com listagem de empresarios em tabela (nome, empresa, cargo, ordem, status, acoes)
- [x] 3.2 Implementar modal/dialog de cadastro de novo empresario com campos limitados e contador de caracteres
- [x] 3.3 Implementar modal/dialog de edicao de empresario existente
- [x] 3.4 Implementar dialog de confirmacao para exclusao de empresario
- [x] 3.5 Implementar toggle de status ativo/inativo na listagem
- [x] 3.6 Implementar upload de foto com preview e validacao (tipo e tamanho max 2MB)
- [x] 3.7 Instalar `@dnd-kit/core` e `@dnd-kit/sortable` e implementar drag-and-drop para reordenar empresarios na listagem

## 4. Adicionar link na Sidebar do Admin

- [x] 4.1 Adicionar item "Revista" na sidebar/navegacao do painel admin apontando para `/admin/revista`

## 5. Viewer Publico da Revista

- [x] 5.1 Instalar `react-pageflip` como dependencia
- [x] 5.2 Criar componente de capa da revista (`MagazineCover`)
- [x] 5.3 Criar componente de pagina do empresario (`MagazineEntrepreneurPage`) com layout fixo (foto, nome, empresa, cargo, bio, texto institucional)
- [x] 5.4 Criar componente de pagina final da revista (`MagazineBackCover`)
- [x] 5.5 Criar pagina publica `src/app/(marketing)/revista/page.tsx` com o viewer da revista usando react-pageflip, navegacao prev/next e responsividade (spread em desktop, single em mobile)
