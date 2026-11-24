# Índice técnico do backend

O backend faz parte da aplicação Next.js e utiliza Supabase Auth e PostgreSQL. Este índice descreve o código atual; não é um plano de integração futura.

## Referências

- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md): métodos, autenticação, payloads, eventos e erros.
- [SUPABASE_INTEGRATION.md](./SUPABASE_INTEGRATION.md): variáveis, migrações, Realtime e Turnstile.
- [GUIA_PRODUCAO.md](./GUIA_PRODUCAO.md): checklist de publicação.
- [BACKEND_STATUS.md](./BACKEND_STATUS.md): capacidades implementadas e limitações.

## Código principal

| Caminho | Responsabilidade |
|---|---|
| `src/app/api/surveys/` | Route Handlers para pesquisas, perguntas, opções, envios e resultados. |
| `src/app/api/surveys/events/route.ts` | Fluxo SSE autenticado de avisos de novos envios. |
| `src/lib/database.ts` | Consultas Supabase, regras de persistência e resultados. |
| `src/lib/supabase/server.ts` | Cliente Supabase associado à sessão no servidor. |
| `src/lib/validation.ts` | Esquemas Zod usados para validar entradas. |
| `src/lib/dashboard-data.ts` | Carregamento paginado do painel e cálculo dos indicadores exibidos. |
| `src/components/use-dashboard-updates.ts` | Conexão SSE do painel, sincronização e reconexão. |
| `src/lib/turnstile.ts` | Verificação server-side dos desafios dos envios públicos. |
| `supabase/migrations/` | Esquema, RLS, funções transacionais, proteção de envios e publicação Realtime. |

## Rotas

As rotas REST abaixo totalizam 15 métodos. O fluxo SSE é uma rota adicional.

| Método | Rota | Acesso |
|---|---|---|
| GET, POST | `/api/surveys` | Sessão autenticada |
| GET, PATCH, DELETE | `/api/surveys/[id]` | Sessão autenticada |
| GET, POST | `/api/surveys/[id]/questions` | Sessão autenticada |
| PATCH, DELETE | `/api/surveys/[id]/questions/[qid]` | Sessão autenticada |
| POST | `/api/surveys/[id]/questions/[qid]/options` | Sessão autenticada |
| PATCH, DELETE | `/api/surveys/[id]/questions/[qid]/options/[oid]` | Sessão autenticada |
| POST | `/api/surveys/[id]/submit` | Público; requer Turnstile válido |
| GET | `/api/surveys/[id]/results` | Sessão autenticada |
| GET | `/api/surveys/by-slug/[slug]` | Público; pesquisa disponível |
| GET | `/api/surveys/events` | Sessão autenticada; SSE |

## Dados e autenticação

- A API usa a sessão Supabase em cookie; um cabeçalho Bearer isolado não autentica essas rotas.
- O cliente Supabase associado à sessão é usado para operações administrativas e consultas protegidas por RLS.
- O envio público valida o Turnstile no servidor e chama uma função SQL com a chave secreta do Supabase. Essa chave nunca deve chegar ao navegador.
- O envio é validado e persistido em transação. As respostas e perguntas estão vinculadas no PostgreSQL.
- As novas pesquisas usam uma nota obrigatória de 1 a 5 e comentário opcional. Pesquisas antigas podem manter perguntas legadas.

## Verificação local

```bash
npm test
npm run lint
npm run build
```

O fluxo completo também exige variáveis válidas, migrações aplicadas e um projeto Supabase configurado.
