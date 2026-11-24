# Status do backend

**Atualizado em:** 24 de novembro de 2026

## Situação atual

O backend está implementado na aplicação Next.js e usa Supabase Auth e PostgreSQL. As operações de pesquisas e resultados não usam armazenamento em memória.

| Área | Estado |
|---|---|
| Autenticação e sessão | Implementadas com Supabase Auth e cookies validados no servidor. |
| Pesquisas | API autenticada para criar, listar, consultar, atualizar e excluir. Novas pesquisas recebem o formulário padrão. |
| Perguntas e opções | API autenticada. Formulários padrão têm estrutura limitada; pesquisas antigas podem manter os tipos anteriores. |
| Resposta pública | Consulta por slug e envio com validação server-side do Cloudflare Turnstile. |
| Persistência e autorização | PostgreSQL/Supabase com migrações e políticas RLS; envio público transacional via função SQL. |
| Resultados | Consultas autenticadas com totais, respostas e resultados por pergunta. A taxa de conclusão é `null`, pois inícios não são registrados. |
| Atualização automática | SSE autenticado no endpoint `/api/surveys/events`, apoiado pelo Supabase Realtime. |
| Testes | Testes automatizados com o runner nativo do Node.js (`npm test`). |

## Limitações conhecidas

- As telas de notificações e privacidade são demonstrativas; não há gestão de papéis nem isolamento multiempresa.
- A análise de comentários é manual. Não há classificação automática de sentimento ou assunto.
- O relatório não tem filtro por pesquisa ou período e não há exportação estruturada; a impressão usa o navegador.
- A conclusão não é calculada, pois o sistema não registra início nem abandono de formulário.
- Turnstile não substitui proteção contra tráfego volumétrico. Leituras públicas e requisições da aplicação precisam de controles de infraestrutura.

Para a referência de rotas, consulte [API_DOCUMENTATION.md](./API_DOCUMENTATION.md). Para configuração e implantação, consulte [SUPABASE_INTEGRATION.md](./SUPABASE_INTEGRATION.md) e [GUIA_PRODUCAO.md](./GUIA_PRODUCAO.md).
