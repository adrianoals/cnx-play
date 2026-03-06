## ADDED Requirements

### Requirement: Tabela magazine_entrepreneurs
O sistema SHALL ter uma tabela `magazine_entrepreneurs` no Supabase com os campos: id (uuid PK), name (varchar 60), company_name (varchar 80), role_title (varchar 60), photo_url (text), bio (text, max 300 chars), institutional_text (text, max 500 chars, nullable), display_order (integer), is_active (boolean default true), created_at (timestamptz), updated_at (timestamptz).

#### Scenario: Tabela criada com campos corretos
- **WHEN** a migration e executada
- **THEN** a tabela `magazine_entrepreneurs` existe com todos os campos, tipos e constraints definidos

#### Scenario: Campos obrigatorios validados
- **WHEN** um INSERT e feito sem name, company_name, role_title, photo_url ou bio
- **THEN** o banco retorna erro de constraint NOT NULL

### Requirement: Storage bucket para fotos
O sistema SHALL ter um bucket `magazine-photos` no Supabase Storage com leitura publica e escrita restrita a admins.

#### Scenario: Upload de foto por admin
- **WHEN** um usuario admin faz upload de imagem para o bucket `magazine-photos`
- **THEN** o arquivo e salvo e a URL publica fica disponivel

#### Scenario: Leitura publica de fotos
- **WHEN** qualquer visitante acessa a URL de uma foto no bucket
- **THEN** a imagem e retornada sem necessidade de autenticacao

### Requirement: RLS policies de seguranca
O sistema SHALL ter policies RLS na tabela `magazine_entrepreneurs`: SELECT publico apenas para registros com `is_active = true`; INSERT, UPDATE e DELETE apenas para usuarios com role admin.

#### Scenario: Visitante le apenas empresarios ativos
- **WHEN** um usuario nao autenticado faz SELECT na tabela
- **THEN** apenas registros com `is_active = true` sao retornados

#### Scenario: Admin tem acesso completo
- **WHEN** um usuario com role admin faz INSERT, UPDATE ou DELETE
- **THEN** a operacao e permitida

#### Scenario: Usuario comum nao pode modificar
- **WHEN** um usuario com role user tenta INSERT, UPDATE ou DELETE
- **THEN** a operacao e negada

### Requirement: Service layer para magazine
O sistema SHALL ter um arquivo `src/services/magazine.service.ts` com funcoes para buscar empresarios ativos (publico), e CRUD completo (admin).

#### Scenario: Buscar empresarios ativos ordenados
- **WHEN** a funcao `fetchActiveMagazineEntrepreneurs` e chamada
- **THEN** retorna apenas empresarios com `is_active = true` ordenados por `display_order` ascendente

#### Scenario: Criar empresario
- **WHEN** a funcao `createMagazineEntrepreneur` e chamada com dados validos
- **THEN** um novo registro e inserido na tabela e retornado

#### Scenario: Atualizar empresario
- **WHEN** a funcao `updateMagazineEntrepreneur` e chamada com id e dados
- **THEN** o registro e atualizado e retornado

#### Scenario: Deletar empresario
- **WHEN** a funcao `deleteMagazineEntrepreneur` e chamada com id
- **THEN** o registro e removido da tabela
