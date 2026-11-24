# Backend Voz do Cliente

O backend está integrado à aplicação Next.js. Route Handlers autenticam usuários com a sessão Supabase, validam entradas e acessam o PostgreSQL com políticas RLS. Não é necessário manter um serviço Express separado.

## Funcionalidades atuais

- Autenticação, cadastro, confirmação e recuperação de senha via Supabase Auth.
- CRUD autenticado de pesquisas e perguntas, condicionado às regras do formulário e às respostas já recebidas.
- Formulário público consultado por slug; o envio exige desafio Cloudflare Turnstile validado no servidor.
- Persistência Supabase/PostgreSQL e funções SQL para operações que precisam ser transacionais.
- Resultados protegidos por autenticação, incluindo submissões e agregados por pergunta.
- Atualizações automáticas do painel por SSE e Supabase Realtime.

Novas pesquisas usam uma nota obrigatória de 1 a 5 e um comentário opcional. Pesquisas existentes podem conservar tipos de perguntas legados. Confira as regras completas na [referência da API](./API_DOCUMENTATION.md).

## Segurança e configuração

As operações administrativas usam cookies de sessão e RLS. O endpoint público de envio valida Turnstile no servidor e utiliza `SUPABASE_SECRET_KEY` exclusivamente nesse ambiente. Não exponha essa chave nem a chave secreta do Turnstile ao cliente.

Configure as variáveis de [.env.example](../.env.example), aplique as migrações de `supabase/migrations/` no projeto Supabase correto e valide a publicação antes de aceitar respostas reais. O guia está em [SUPABASE_INTEGRATION.md](./SUPABASE_INTEGRATION.md).

## Verificações

```bash
npm test
npm run lint
npm run build
```

Para executar localmente, use Node.js 22.18 ou superior, `npm ci`, configure `.env.local` e rode `npm run dev`. Para produção, consulte [GUIA_PRODUCAO.md](./GUIA_PRODUCAO.md).
