# Paginação server-side em listagens

**Status:** pendente
**Criado em:** 2026-05-03
**Prioridade:** alta — escala mal a partir de ~200-300 registros por entidade

## Problema

Várias páginas de listagem hoje fazem `SELECT` na tabela inteira sem `.limit()` nem `.range()`. A paginação que existe é só visual (esconde no DOM), mas o payload já chegou todo no cliente.

Isso é OK no volume atual mas degrada conforme a base cresce:

| Volume da entidade | Impacto |
|---|---|
| Hoje (até ~50) | Imperceptível |
| ~100 | Imperceptível |
| ~300 | Início engasga (~1-2s) |
| ~500-1000+ | Problema real: payload grande, parsing lento, navegador segura tudo em memória |

## Volumes hoje (snapshot 2026-05-03)

| Tabela | Rows | Crescimento |
|---|---:|---|
| `users` | 26 | linear com cadastros |
| `companies` | 23 | linear com cadastros |
| `connections` | 22 | quase quadrático (cada user conecta com vários) |
| `meetings` | 63 | uso da plataforma |
| `daily_matches` | **438** | **diário** — 1 par/dia/user ativo |
| `daily_match_history` | **474** | **diário** |
| `notifications` | 70 | uso (com cleanup cron de 7 dias) |
| `magazine_entrepreneurs` | 43 | curado, estável |
| `deals` | 1 | uso (lento) |
| `referrals` | 2 | uso (lento) |

## Mapa de páginas e prioridade

### 🔴 Alta prioridade — fazer logo

| Página | Por quê |
|---|---|
| `/admin/users` | Admin acessa toda hora. Em 100-200 cadastros já fica lenta |
| `/admin/empresas` | Mesma escala de users, admin gerencia o tempo todo |
| `/admin/conexoes` (matches admin) | Já tem **438 rows** e cresce DIÁRIO. Volume desconfortável hoje |
| `/search` | Única do lado usuário no grupo crítico. UX pesa mais aqui |

### 🟡 Média prioridade

| Página | Observação |
|---|---|
| `/dashboard` (leaderboard via `v_user_stats`) | Fácil de resolver: `.limit(10)` no SQL. 5 minutos de trabalho |
| `/admin/agendas` | Conferir se já filtra por data; se sim, só falta paginar dentro da data |
| `/admin/pontuacao` | Relevante quando a base crescer |
| `/admin/indicacoes`, `/admin/negocios` | Cresce devagar mas mesma falta de paginação |

### 🟢 Baixa prioridade

| Página | Observação |
|---|---|
| `/conexoes` | Paginação client-side já adicionada (commit `eff7b4c`); fetch ainda traz tudo. Em escala maior, evoluir para server-side |
| `/referral` | Apenas as próprias indicações (filtradas por user) |
| `/meetings` | Apenas as próprias |
| `/admin/revista` | Curado, ~43 rows, cresce devagar |

## Padrão de resolução

Para todas as páginas, a receita é a mesma:

```ts
// State: page atual + termo de busca debounced
const [page, setPage] = useState(0)
const [debouncedTerm, setDebouncedTerm] = useState("")

const ITEMS_PER_PAGE = 25
const from = page * ITEMS_PER_PAGE
const to = from + ITEMS_PER_PAGE - 1

const { data, count, error } = await supabase
  .from('table')
  .select('id, name, ...', { count: 'exact' })  // count para saber total de páginas
  .ilike('name', `%${debouncedTerm}%`)           // busca server-side
  .eq('category_id', activeCategory)             // filtro server-side
  .order('created_at', { ascending: false })
  .range(from, to)

const totalPages = Math.ceil((count ?? 0) / ITEMS_PER_PAGE)
```

### Pontos de atenção

1. **Debounce na busca** (300-500ms) para não pingar o banco a cada tecla.
2. **`count: 'exact'`** custa um `COUNT(*)` por query — tudo bem em volume médio. Em volumes muito altos (10k+) pode ser caro. Alternativa: `count: 'estimated'`.
3. **Joins** (ex: `companies → categories → users`) ficam mais delicados com filtro/busca em campos joinados. O Supabase suporta `.ilike('users.full_name', ...)` mas o comportamento de filtro com joins inner pode mudar o set retornado.
4. **Relacionamentos quadráticos** (ex: `connections`): paginar a tabela base já resolve. O enriquecimento com nomes/empresas é uma segunda query `.in('id', userIds)` — cresce só com a página, não com o total.
5. **Empresa do próprio usuário fixa no topo** em `/search` — fazer query separada pequena que sempre vai junto (fora da paginação principal).

## Sugestão de ordem de ataque

1. Os 4 vermelhos juntos num único pacote (~3-4h, mesmo padrão repetido)
2. Os amarelos depois conforme aparecer demanda real
3. `/conexoes` evolui para server-side quando o volume da própria base exigir

## Implementação adiada — quando retomar

Reabrir esse doc quando:
- Total de **users** passar de ~150
- Ou total de **companies** passar de ~150
- Ou tempo de carregamento de qualquer página crítica passar de 1.5s no test
- Ou abrir um novo issue de UX/perf reclamando de listagem lenta

## Referências do código atual

- `/search` — `src/app/(dashboard)/search/page.tsx` (paginação `visibleCount` só visual)
- `/conexoes` — `src/app/(dashboard)/conexoes/page.tsx` (usa `usePagination` client-side, fetch ainda traz tudo)
- Hook `usePagination` — `src/hooks/use-pagination.ts` (client-side, OK para uso atual)
- Services que listam: `admin.service.ts`, `company.service.ts`, `connection.service.ts`, `dashboard.service.ts`
