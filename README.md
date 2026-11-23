This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Configure o Supabase conforme a seção **Login e gerenciamento de conta** abaixo. Depois, execute:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Telas da aplicação

### Login

<p align="center">
  <img src="public/screenshots/login.png" alt="Tela de login" width="600">
</p>

*A tela de login permite entrar com e-mail e senha, recuperar a senha ou acessar o cadastro.*

### Cadastro

<p align="center">
  <img src="public/screenshots/cadastro.png" alt="Tela de cadastro" width="600">
</p>

*A tela de cadastro reúne nome, e-mail, senha e confirmação de senha para criar uma conta.*

### Recuperação de senha

<p align="center">
  <img src="public/screenshots/recuperar-senha.png" alt="Tela de recuperação de senha" width="600">
</p>

*A tela de recuperação de senha solicita o e-mail cadastrado e envia um link para redefinição.*

### Redefinição de senha

<p align="center">
  <img src="public/screenshots/redefinir-senha.png" alt="Tela de redefinição de senha" width="600">
</p>

*A tela de redefinição permite informar uma nova senha e confirmá-la antes de salvar.*

### Visão geral

<p align="center">
  <img src="public/screenshots/visao-geral.png" alt="Tela de visão geral" width="900">
</p>

*A visão geral reúne indicadores, volume de respostas, uma resposta em destaque e as pesquisas recentes.*

### Pesquisas

<p align="center">
  <img src="public/screenshots/pesquisas.png" alt="Tela de pesquisas" width="900">
</p>

*A tela de pesquisas permite criar, buscar e filtrar pesquisas por status.*

### Respostas

<p align="center">
  <img src="public/screenshots/respostas.png" alt="Tela de respostas" width="900">
</p>

*A tela de respostas apresenta comentários, notas, sentimentos e filtros por pesquisa.*

### Relatórios

<p align="center">
  <img src="public/screenshots/relatorios.png" alt="Tela de relatórios" width="900">
</p>

*A tela de relatórios consolida indicadores, gráficos de respostas e distribuição das avaliações.*

### Configurações

<p align="center">
  <img src="public/screenshots/configuracoes.png" alt="Tela de configurações" width="900">
</p>

*A tela de configurações reúne perfil, senha, notificações e preferências de privacidade.*

## Executar com Docker

Com Docker e Docker Compose instalados, execute na pasta `sistema-web`:

```bash
docker compose --env-file .env.local up --build -d
```

O container de desenvolvimento estará em [http://localhost:3000](http://localhost:3000), com hot reload para alterações em `src` e `public`. O monitoramento usa polling para detectar alterações em pastas compartilhadas no Docker Desktop. Após alterar dependências em `package.json` ou `package-lock.json`, execute o mesmo comando novamente para reconstruir a imagem. As alterações em `next.config.ts` e `tsconfig.json` também ficam disponíveis no container; reinicie-o se necessário.

Para acompanhar os logs ou parar o container:

```bash
docker compose logs -f web
docker compose down
```

## Testes automatizados

Os testes unitários usam o test runner nativo do Node.js e cobrem a validação de dados da conta e a filtragem de pesquisas e respostas (busca textual, status, sentimento e combinações de filtros). Requerem Node.js 22.18 ou superior; não é necessário instalar dependências adicionais.

Execute todos os testes na raiz do projeto:

```bash
npm test
```

Os casos estão em `tests/`. A verificação completa de cadastro, login, confirmação de e-mail e recuperação de senha exige um projeto Supabase configurado.

Para executar a versão de produção, sem hot reload, use a configuração separada. Os dois modos usam a porta 3000 e não podem rodar ao mesmo tempo:

```bash
docker compose --env-file .env.local -f compose.production.yaml up --build -d
docker compose -f compose.production.yaml down
```

## Login e gerenciamento de conta

1. Crie um projeto no Supabase e habilite autenticação por e-mail e senha, cadastro público e confirmação de e-mail em Authentication. Configure um provedor SMTP adequado para produção.
2. Copie `.env.example` para `.env.local` e informe a URL do projeto, a chave publicável (ou a chave legada `anon`) e a origem do site em `SITE_URL`. Não use a chave secreta ou `service_role`. Em produção, use a origem HTTPS pública, sem caminho final.
3. Em Authentication > URL Configuration, configure a Site URL com a mesma origem e permita os redirects `http://localhost:3000/auth/callback` e `http://localhost:3000/auth/callback?flow=recovery` (ou os endereços equivalentes de produção).
4. Execute `npm install` e `npm run dev`. Acesse `/cadastro` para criar uma conta; confirme o e-mail e abra o link no **mesmo navegador** que iniciou o cadastro. O mesmo requisito vale para a recuperação de senha, pois o fluxo usa PKCE.

O painel exige sessão validada no servidor. Em Configurações é possível editar nome e organização e alterar a senha; o botão Sair encerra a sessão. O e-mail é somente leitura. Caso o Supabase exija reautenticação para alteração de senha, siga as políticas configuradas no projeto. Redirecionamentos inválidos ou expirados exigem nova solicitação.

**Limitações:** o cadastro é público e toda conta autenticada acessa o mesmo painel demonstrativo; não há papéis, convites ou isolamento de organizações. Pesquisas, respostas, notificações e privacidade continuam simuladas e não persistem. Antes de usar dados reais, implemente autorização no servidor e políticas RLS adequadas, além de políticas de proteção contra abuso e limites de envio no Supabase.

## Migração inicial do banco

A migração em `supabase/migrations/` define pesquisas, perguntas, opções, envios e respostas. Ela habilita RLS: cada conta autenticada acessa apenas as próprias pesquisas e seus resultados. Envios não armazenam nome, e-mail ou conta do respondente; o conteúdo livre pode, ainda assim, conter dados pessoais.

Esta migração **não foi aplicada automaticamente** e não conecta a interface ao banco. O acesso público e a inserção de respostas permanecem bloqueados. Antes de coletar dados reais, é necessário implementar e testar um fluxo público que valide disponibilidade, obrigatoriedade, tipos e opções em uma transação, além de impedir alterações que comprometam o histórico das perguntas. Exclusões de pesquisas ou contas removem os dados associados.

Para aplicá-la, use uma conta autorizada na CLI do Supabase. Na raiz do projeto:

```bash
npx --yes supabase login
npx --yes supabase link
npx --yes supabase db push --remote --dry-run
npx --yes supabase db push --remote
```

No comando `link`, escolha o projeto correto e forneça a senha do banco quando solicitada no terminal, sem compartilhá-la no chat. Revise a prévia antes de confirmar a aplicação. A chave publicável não concede acesso administrativo ao banco. Consulte a [documentação de migrações](https://supabase.com/docs/guides/deployment/database-migrations) e teste o isolamento entre contas em um projeto de teste antes de aplicar em produção.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
