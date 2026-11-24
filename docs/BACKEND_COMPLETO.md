# Implementação do backend

**Atualizado em:** 24 de novembro de 2026

## Arquitetura implementada

```text
Navegador
  -> Next.js App Router
  -> Route Handlers + validação
  -> cliente Supabase com sessão e RLS
  -> PostgreSQL
```

O endpoint público de envio é uma exceção controlada: o servidor valida o Turnstile e chama uma função SQL transacional usando a chave secreta do Supabase. O cliente nunca recebe essa chave. O painel recebe eventos de novas respostas por SSE autenticado, encaminhados pelo servidor a partir do Supabase Realtime.

## Operações

- Pesquisas: listar com paginação, criar, consultar, atualizar e excluir.
- Perguntas: listar, criar, editar e excluir, sujeitos às regras de bloqueio e aos tipos de pesquisa.
- Opções: criar, editar e excluir para perguntas legadas de escolha única.
- Respostas: enviar sem conta do respondente, mas com verificação Turnstile; a gravação ocorre em transação.
- Resultados: consultar respostas e agregados por pergunta como proprietário autenticado.
- Formulário público: obter os dados públicos de uma pesquisa ativa por slug.

O inventário exato de rotas e contratos está em [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## Formulários e resultados

Novas pesquisas são criadas com duas perguntas padrão: avaliação obrigatória de 1 a 5 e comentário opcional. Os textos podem ser alterados antes da primeira resposta; a estrutura fica bloqueada depois disso. Uma nova versão cria outra pesquisa e preserva a anterior. Pesquisas antigas mantêm seus tipos de pergunta.

Os indicadores gerais usam respostas persistidas. Comentários não alteram a média ou a distribuição numérica. A taxa de conclusão não é medida, pois não há registro de início ou abandono.

## Banco e proteção

O esquema, as políticas RLS, as funções SQL e a publicação Realtime ficam em `supabase/migrations/`. A aplicação depende dessas migrações. A configuração das variáveis e a implantação coordenada estão em [SUPABASE_INTEGRATION.md](./SUPABASE_INTEGRATION.md).

## Testes

```bash
npm test
npm run lint
npm run build
```

Os testes automatizados verificam validações, operações de dados, cálculos do painel e tratamento de erros. Testes com Supabase exigem um ambiente configurado e dados de teste.
