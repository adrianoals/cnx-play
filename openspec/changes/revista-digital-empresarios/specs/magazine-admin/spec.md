## ADDED Requirements

### Requirement: Pagina admin da revista
O sistema SHALL ter uma pagina em `(admin)/admin/revista` acessivel apenas por admins, seguindo o layout e padrao de autenticacao existente do painel admin.

#### Scenario: Admin acessa a pagina
- **WHEN** um usuario admin navega para `/admin/revista`
- **THEN** a pagina carrega com a lista de empresarios cadastrados na revista

#### Scenario: Usuario nao admin e redirecionado
- **WHEN** um usuario sem role admin tenta acessar `/admin/revista`
- **THEN** e redirecionado para `/dashboard` com toast de acesso negado

### Requirement: Listagem de empresarios
O sistema SHALL exibir uma tabela com todos os empresarios cadastrados (ativos e inativos), mostrando nome, empresa, cargo, ordem, status e acoes.

#### Scenario: Lista carregada com sucesso
- **WHEN** a pagina admin da revista carrega
- **THEN** todos os empresarios sao listados em tabela ordenados por `display_order`

#### Scenario: Lista vazia
- **WHEN** nao ha empresarios cadastrados
- **THEN** exibe mensagem indicando que nenhum empresario foi cadastrado

### Requirement: Cadastrar empresario
O sistema SHALL permitir que o admin cadastre um novo empresario via modal/dialog com os campos: nome (max 60), empresa (max 80), cargo (max 60), foto (upload), bio (max 300), texto institucional (max 500), ordem e status.

#### Scenario: Cadastro com dados validos
- **WHEN** o admin preenche todos os campos obrigatorios e clica em salvar
- **THEN** o empresario e criado no banco, a lista atualiza, e um toast de sucesso aparece

#### Scenario: Cadastro com campo excedendo limite
- **WHEN** o admin tenta digitar alem do limite de caracteres em um campo
- **THEN** o input bloqueia a digitacao no limite e exibe contador de caracteres

#### Scenario: Upload de foto
- **WHEN** o admin seleciona uma imagem para upload
- **THEN** a imagem e enviada ao bucket `magazine-photos` e a URL e salva no registro

### Requirement: Editar empresario
O sistema SHALL permitir que o admin edite qualquer campo de um empresario existente.

#### Scenario: Edicao com sucesso
- **WHEN** o admin altera campos e clica em salvar
- **THEN** o registro e atualizado, a lista reflete as mudancas, e um toast de sucesso aparece

### Requirement: Excluir empresario
O sistema SHALL permitir que o admin exclua um empresario com confirmacao previa.

#### Scenario: Exclusao confirmada
- **WHEN** o admin clica em excluir e confirma no dialog de confirmacao
- **THEN** o registro e removido do banco e da lista

#### Scenario: Exclusao cancelada
- **WHEN** o admin clica em excluir mas cancela no dialog
- **THEN** nenhuma acao e executada

### Requirement: Controle de status ativo/inativo
O sistema SHALL permitir que o admin ative ou desative um empresario, controlando se ele aparece na revista publica.

#### Scenario: Desativar empresario
- **WHEN** o admin desativa um empresario ativo
- **THEN** o campo `is_active` e atualizado para false e o empresario nao aparece mais na revista publica

#### Scenario: Ativar empresario
- **WHEN** o admin ativa um empresario inativo
- **THEN** o campo `is_active` e atualizado para true e o empresario volta a aparecer na revista publica

### Requirement: Controle de ordem de exibicao
O sistema SHALL permitir que o admin defina a ordem de exibicao dos empresarios na revista atraves de um campo numerico editavel.

#### Scenario: Alterar ordem
- **WHEN** o admin altera o campo de ordem de um empresario
- **THEN** o `display_order` e atualizado e a revista publica reflete a nova ordenacao
