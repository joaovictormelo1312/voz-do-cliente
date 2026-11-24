# Guia rápido em português

Este guia descreve a versão atual, que usa Supabase para autenticação e persistência.

## Executar localmente

Requisitos: Node.js 22.18 ou superior, npm, projeto Supabase e widget Cloudflare Turnstile.

```bash
npm ci
```

Copie `.env.example` para `.env.local`, configure as chaves do Supabase e do Turnstile e use `SITE_URL=http://localhost:3000`. Aplique as migrações no projeto Supabase correto antes de testar as operações de dados.

```bash
npm run dev
```

Abra `http://localhost:3000`, crie uma conta, confirme o e-mail e entre no painel. O painel cria pesquisas padrão com nota obrigatória de 1 a 5 e comentário opcional. Ative a pesquisa para usar o link público.

## Testes e qualidade

```bash
npm test
npm run lint
npm run build
```

## Como o sistema funciona

- A área administrativa usa autenticação por sessão Supabase.
- Pesquisas e respostas são persistidas no PostgreSQL e protegidas com RLS.
- Respondentes não precisam de conta, mas cada envio exige verificação Turnstile no servidor.
- O painel calcula resultados dos dados armazenados e atualiza via SSE/Realtime.
- Comentários são consultados manualmente; não há análise automática de sentimento.

## Referências

- [README principal](../README.md) para instruções completas e telas.
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) para endpoints e formatos.
- [SUPABASE_INTEGRATION.md](./SUPABASE_INTEGRATION.md) para migrações, variáveis e Realtime.
- [GUIA_PRODUCAO.md](./GUIA_PRODUCAO.md) para publicação.

Não use dados de produção em testes sem autorização. Nunca exponha `SUPABASE_SECRET_KEY` ou `TURNSTILE_SECRET_KEY` ao navegador.
