This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

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

## Executar com Docker

Com Docker e Docker Compose instalados, execute na pasta `sistema-web`:

```bash
docker compose up --build -d
```

O container de desenvolvimento estará em [http://localhost:3000](http://localhost:3000), com hot reload para alterações em `src` e `public`. O monitoramento usa polling para detectar alterações em pastas compartilhadas no Docker Desktop. Após alterar dependências em `package.json` ou `package-lock.json`, execute o mesmo comando novamente para reconstruir a imagem. As alterações em `next.config.ts` e `tsconfig.json` também ficam disponíveis no container; reinicie-o se necessário.

Para acompanhar os logs ou parar o container:

```bash
docker compose logs -f web
docker compose down
```

Para executar a versão de produção, sem hot reload, use a configuração separada. Os dois modos usam a porta 3000 e não podem rodar ao mesmo tempo:

```bash
docker compose -f compose.production.yaml up --build -d
docker compose -f compose.production.yaml down
```

Os dados da aplicação ainda são mock; a integração com banco de dados e autenticação não foi implementada.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
