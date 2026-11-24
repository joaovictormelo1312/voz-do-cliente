# Visão executiva

## O produto

Voz do Cliente é uma aplicação web para criar pesquisas de satisfação, compartilhar formulários públicos e consultar respostas e indicadores em um painel autenticado.

## Situação

A aplicação está implementada com Next.js, React e TypeScript. Supabase Auth fornece autenticação; PostgreSQL armazena pesquisas e respostas com políticas RLS. O envio público requer Cloudflare Turnstile validado no servidor. Não é um protótipo apenas com armazenamento em memória, embora ainda existam dados fictícios em recursos de demonstração e capturas de tela.

Novas pesquisas usam uma nota obrigatória de 1 a 5 e um comentário opcional. O painel calcula indicadores a partir das respostas persistidas e recebe atualizações por Supabase Realtime através de SSE.

## Limites importantes

- Não há análise automática de sentimento ou assuntos.
- Não há cálculo de taxa de conclusão.
- Relatórios não têm filtros por período nem exportação estruturada.
- Não há gestão de papéis ou isolamento entre organizações.
- As preferências de notificações e privacidade são demonstrativas.
- A hospedagem deve suportar a conexão SSE; Turnstile não é proteção contra todo tráfego abusivo.

## Operação

O repositório contém migrações SQL, testes Node.js, configuração Docker de desenvolvimento e produção e exemplo de variáveis em `.env.example`. Antes de publicar, configure o projeto Supabase, aplique as migrações e valide os fluxos de autenticação e resposta.

Detalhes técnicos: [API](./API_DOCUMENTATION.md), [integração Supabase](./SUPABASE_INTEGRATION.md), [guia de produção](./GUIA_PRODUCAO.md) e [status do backend](./BACKEND_STATUS.md).
