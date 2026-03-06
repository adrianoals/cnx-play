## Why

A plataforma CNX Play precisa de uma revista digital nativa para apresentar os empresários da rede de forma profissional e dinâmica. Atualmente não existe essa funcionalidade, e depender de ferramentas externas (como Issuu) tira o controle sobre o conteúdo e a experiência. Uma revista integrada ao sistema, com conteúdo vindo do banco de dados, permite que administradores gerenciem edições de forma autônoma, mantendo a identidade visual da plataforma.

## What Changes

- Criar nova tabela `magazine_entrepreneurs` no Supabase para armazenar os dados dos empresários da revista (nome, empresa, cargo, foto, textos, ordem, status)
- Criar nova página administrativa em `(admin)/admin/revista` com CRUD completo para gerenciar empresários da revista
- Implementar visualização pública da revista digital com navegação por páginas (flipbook), onde cada empresário ocupa exatamente 1 página fixa
- Definir limites de caracteres nos campos para garantir layout fixo e previsível por página
- Incluir capa e página final fixas na revista
- Layout responsivo (desktop e mobile) com tamanho fixo por página
- Preparar estrutura para futura exportação/download em PDF

## Capabilities

### New Capabilities
- `magazine-data`: Tabela no banco de dados, storage para fotos, e camada de acesso (queries/mutations) para os dados dos empresários da revista
- `magazine-admin`: Painel administrativo para CRUD de empresários da revista, com controle de ordem, status e upload de foto
- `magazine-viewer`: Visualizacao publica da revista digital com navegacao por paginas estilo flipbook, capa, pagina final, layout fixo por pagina e responsividade

### Modified Capabilities

Nenhuma capability existente precisa ser modificada.

## Impact

- **Banco de dados**: Nova tabela `magazine_entrepreneurs` + bucket de storage para fotos
- **Rotas**: Nova rota admin `(admin)/admin/revista` e nova rota publica para visualizacao da revista
- **Componentes**: Novos componentes para o viewer de revista (flipbook, pagina do empresario, capa, pagina final)
- **Dependencias**: Possivel adicao de biblioteca para efeito de virar pagina (ex: turn.js ou react-pageflip) ou implementacao CSS pura
- **RLS**: Policies de seguranca na nova tabela (admin full access, publico read-only para ativos)
