# Resumo rápido

Voz do Cliente é uma aplicação full-stack Next.js que persiste pesquisas e respostas no Supabase/PostgreSQL.

- Painel administrativo autenticado por Supabase Auth.
- Pesquisas novas com nota obrigatória de 1 a 5 e comentário opcional.
- Resposta pública verificada por Cloudflare Turnstile.
- Resultados e indicadores calculados a partir dos dados persistidos.
- Atualizações do painel por SSE e Supabase Realtime.

## Executar

```bash
npm ci
npm run dev
```

Configure antes `.env.local` com as variáveis de `.env.example` e aplique as migrações do Supabase.

## Verificar

```bash
npm test
npm run lint
npm run build
```

## Limitações principais

Não há taxa de conclusão, análise automática de texto, exportação estruturada, filtros temporais de relatório, papéis administrativos ou isolamento multiempresa. Consulte [BACKEND_STATUS.md](./BACKEND_STATUS.md) e [README.md](../README.md).

Para contratos, veja [API_DOCUMENTATION.md](./API_DOCUMENTATION.md); para publicação, veja [GUIA_PRODUCAO.md](./GUIA_PRODUCAO.md).
