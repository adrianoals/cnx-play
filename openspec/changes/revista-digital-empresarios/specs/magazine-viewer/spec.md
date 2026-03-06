## ADDED Requirements

### Requirement: Pagina publica da revista
O sistema SHALL ter uma pagina publica em `(marketing)/revista` acessivel sem autenticacao que exibe a revista digital.

#### Scenario: Visitante acessa a revista
- **WHEN** qualquer pessoa navega para `/revista`
- **THEN** a revista digital e exibida com capa, paginas de empresarios e pagina final

#### Scenario: Nenhum empresario ativo
- **WHEN** nao ha empresarios com `is_active = true`
- **THEN** a revista exibe apenas a capa e pagina final com mensagem adequada

### Requirement: Capa da revista
O sistema SHALL exibir uma capa fixa como primeira pagina da revista, com logo e titulo da revista.

#### Scenario: Capa renderizada
- **WHEN** a revista e carregada
- **THEN** a primeira pagina visivel e a capa com logo CNX Play e titulo "Revista Digital"

### Requirement: Pagina final da revista
O sistema SHALL exibir uma pagina final fixa como ultima pagina da revista, com informacoes de contato e creditos.

#### Scenario: Pagina final renderizada
- **WHEN** o usuario navega ate a ultima pagina
- **THEN** a pagina final com informacoes de contato e creditos e exibida

### Requirement: Pagina do empresario com layout fixo
O sistema SHALL renderizar cada empresario ativo em exatamente 1 pagina da revista com layout padronizado contendo: foto, nome, empresa, cargo, bio e texto institucional. O layout MUST ter dimensoes fixas e nao pode ultrapassar os limites da pagina.

#### Scenario: Empresario renderizado em pagina fixa
- **WHEN** a revista carrega com empresarios ativos
- **THEN** cada empresario ocupa exatamente 1 pagina com layout consistente

#### Scenario: Conteudo dentro dos limites
- **WHEN** os campos do empresario estao dentro dos limites de caracteres
- **THEN** o conteudo cabe na pagina sem overflow ou quebra de layout

### Requirement: Navegacao por paginas
O sistema SHALL permitir navegacao entre paginas com efeito de virar pagina (page flip) usando react-pageflip, suportando clique em botoes prev/next e swipe em mobile.

#### Scenario: Virar pagina adiante
- **WHEN** o usuario clica no botao "proximo" ou faz swipe para esquerda
- **THEN** a proxima pagina e exibida com animacao de flip

#### Scenario: Virar pagina para tras
- **WHEN** o usuario clica no botao "anterior" ou faz swipe para direita
- **THEN** a pagina anterior e exibida com animacao de flip

#### Scenario: Primeira pagina
- **WHEN** o usuario esta na capa
- **THEN** o botao "anterior" esta desabilitado

#### Scenario: Ultima pagina
- **WHEN** o usuario esta na pagina final
- **THEN** o botao "proximo" esta desabilitado

### Requirement: Responsividade
O sistema SHALL adaptar a revista para desktop e mobile mantendo proporcoes fixas e legibilidade.

#### Scenario: Visualizacao desktop
- **WHEN** a revista e exibida em tela >= 768px
- **THEN** a revista mostra duas paginas lado a lado (spread view)

#### Scenario: Visualizacao mobile
- **WHEN** a revista e exibida em tela < 768px
- **THEN** a revista mostra uma pagina por vez com tamanho ajustado a tela

### Requirement: Ordenacao por display_order
O sistema SHALL exibir as paginas dos empresarios na ordem definida pelo campo `display_order` (ascendente).

#### Scenario: Ordem correta
- **WHEN** a revista e montada com empresarios ativos
- **THEN** as paginas seguem a ordem crescente de `display_order` entre a capa e a pagina final
