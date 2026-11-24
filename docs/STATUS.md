# Status do projeto

**Atualizado em:** 24 de novembro de 2026

## Implementado

- Aplicação Next.js com páginas de cadastro, login, recuperação de senha, painel e formulário público.
- Supabase Auth e PostgreSQL com migrações e políticas RLS.
- Gestão de pesquisas e perguntas via API autenticada.
- Envio público com desafio Turnstile validado no servidor e gravação transacional.
- Resultados por pesquisa e indicadores do painel derivados das respostas reais.
- Atualizações automáticas pelo Supabase Realtime via rota SSE autenticada.
- Testes automatizados executados por `npm test`.

## Ainda não implementado ou limitado

- Taxa de conclusão: não há coleta de início/abandono.
- Análise de sentimento ou classificação de comentários: inexistente.
- Filtro por período nos relatórios e exportação estruturada: inexistentes.
- Papéis de usuário e isolamento multiempresa: inexistentes.
- Configurações de notificações e privacidade: demonstrativas.
- Controles contra tráfego volumétrico: dependem da infraestrutura; Turnstile não é suficiente por si só.

## Comandos

```bash
npm test
npm run lint
npm run build
```

Consulte [README.md](../README.md) para executar localmente, [SUPABASE_INTEGRATION.md](./SUPABASE_INTEGRATION.md) para preparar o banco e [GUIA_PRODUCAO.md](./GUIA_PRODUCAO.md) para publicar.
