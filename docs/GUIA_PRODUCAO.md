# Guia de publicação em produção

Este guia reflete as variáveis e configurações presentes em `.env.example`, `Dockerfile` e `compose.production.yaml`. A publicação exige projeto Supabase e configuração real do Cloudflare Turnstile.

## 1. Preparar o ambiente

Use Node.js 22.18 ou superior para instalar, testar e compilar. Defina no ambiente do servidor as seis variáveis:

| Variável | Uso |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase. |
| `SUPABASE_PUBLISHABLE_KEY` | Chave publicável usada com a sessão Supabase. |
| `SUPABASE_SECRET_KEY` | Chave secreta usada exclusivamente no servidor para o envio verificado. |
| `SITE_URL` | Origem HTTPS pública, sem caminho, query ou barra final. |
| `TURNSTILE_SITE_KEY` | Chave pública do widget entregue ao navegador. |
| `TURNSTILE_SECRET_KEY` | Chave secreta usada pelo servidor para validar o desafio. |

Use a chave de teste do Turnstile somente em desenvolvimento. Não configure `SUPABASE_SECRET_KEY` nem `TURNSTILE_SECRET_KEY` em variáveis client-side, no código, em logs ou no repositório. Não é necessário configurar `SUPABASE_SERVICE_ROLE_KEY`; o código espera `SUPABASE_SECRET_KEY`.

## 2. Configurar Supabase e Turnstile

1. Use um projeto Supabase separado para produção e outro para testes, se possível.
2. Habilite cadastro e autenticação por e-mail e senha. Configure confirmação de e-mail e SMTP adequado.
3. Configure `SITE_URL` com a origem HTTPS e inclua os redirects de callback e recuperação de senha usados pela aplicação em Authentication > URL Configuration.
4. Crie um widget Cloudflare Turnstile em modo Managed e autorize o domínio de produção.
5. Configure as chaves correspondentes no ambiente da aplicação.

## 3. Aplicar e revisar migrações

Confirme o projeto vinculado antes de qualquer alteração. Na raiz do repositório:

```bash
npx --yes supabase login
npx --yes supabase link
npx --yes supabase db push --remote --dry-run
npx --yes supabase db push --remote
```

Revise a prévia do `dry-run` e confirme que o projeto remoto é o correto antes de aplicar. As migrações incluem RLS, funções de leitura e envio, bloqueios do formulário padrão, validação do envio e inclusão de `submissions` na publicação `supabase_realtime`. Faça backup e teste em staging antes de migrar uma base com dados reais.

## 4. Executar verificações

```bash
npm ci
npm test
npm run lint
npm run build
```

Teste cadastro, confirmação e recuperação de senha, criação e ativação de pesquisas, formulário público com Turnstile, envio, resultados, isolamento entre contas e pesquisa fora do período. Teste também a reconexão do painel.

## 5. Publicar

A aplicação usa `output: "standalone"` e inclui uma configuração Docker de produção. Para usar Docker Compose, coloque as seis variáveis em um arquivo local protegido, por exemplo `.env.local`, e execute:

```bash
docker compose --env-file .env.local -f compose.production.yaml up --build -d
docker compose -f compose.production.yaml logs -f web
```

Para parar:

```bash
docker compose -f compose.production.yaml down
```

Também é possível publicar em uma hospedagem compatível com Next.js. Configure as mesmas variáveis secretas no painel da hospedagem, HTTPS e os redirects do Supabase. Como o painel usa Server-Sent Events para atualizações automáticas, confirme que a hospedagem e os proxies permitem respostas em streaming e não armazenam o fluxo em buffer. Teste limites de duração e reconexão no ambiente publicado.

## 6. Proteções e operação

- Configure WAF/proxy e limites de tráfego para a aplicação, especialmente para leituras públicas e identificadores inválidos. Turnstile não é uma proteção contra ataques volumétricos.
- Proteja também o acesso direto ao Supabase; o limite de corpo da API não se aplica a chamadas diretas ao banco/API Supabase.
- Monitore erros de autenticação, falhas de verificação, reconexões Realtime/SSE, consumo do banco e eventos.
- Defina backup, retenção e recuperação antes de receber dados reais.
- Não considere o deploy validado até testar autenticação, envio, RLS e comportamento de falha no ambiente real.

Consulte [SUPABASE_INTEGRATION.md](./SUPABASE_INTEGRATION.md) para detalhes do fluxo e [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) para contratos e erros.
