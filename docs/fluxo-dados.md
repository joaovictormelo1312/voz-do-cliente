# Fluxo de dados atual

Este documento descreve o comportamento implementado. Para requisitos ainda planejados, consulte [requisitos.md](./requisitos.md).

## Componentes e persistência

```text
Navegador autenticado
  -> painel Next.js
  -> /api/surveys e /api/surveys/[id]/results
  -> cliente Supabase server-side com sessão
  -> PostgreSQL com RLS

Respondente
  -> formulário público /pesquisa/[slug]
  -> GET /api/surveys/by-slug/[slug]
  -> POST /api/surveys/[id]/submit
  -> Turnstile verificado no servidor
  -> função SQL transacional
  -> PostgreSQL
```

O painel e o formulário público são fluxos reais ligados ao Supabase. O arquivo `src/lib/mock-data.ts` contém dados fictícios de demonstração; esses valores não são a fonte dos resultados exibidos pelo painel autenticado. As imagens em `public/screenshots/` são capturas de exemplo.

## Criar e publicar pesquisa

1. O gestor entra com uma sessão Supabase válida.
2. O painel carrega as pesquisas e seus resultados pela API, com paginação.
3. Ao criar pesquisa, o servidor valida os dados e usa a função SQL `create_standard_survey`.
4. A pesquisa nova recebe uma avaliação obrigatória de 1 a 5 e um comentário opcional.
5. O proprietário edita os textos padrão antes do primeiro envio e ativa a pesquisa pelo painel.
6. O link público usa o slug da pesquisa. Rascunhos, pesquisas encerradas e pesquisas fora da janela configurada não recebem respostas.

Pesquisas antigas podem ter tipos de pergunta legados. Sua estrutura fica bloqueada depois do primeiro envio. Criar uma versão gera uma pesquisa separada; o original e suas respostas são preservados.

## Enviar resposta pública

1. O formulário consulta a pesquisa por slug e recebe somente campos públicos necessários para responder.
2. O respondente preenche as perguntas sem criar uma conta.
3. A API valida o tamanho e o formato do corpo; o servidor valida o token Turnstile com hostname e ação esperados.
4. O servidor envia o resultado validado a uma função SQL que verifica disponibilidade, respostas e reutilização do desafio, então grava envio e respostas em uma transação.
5. A interface confirma somente após a gravação bem-sucedida. Falhas de verificação, validação ou banco não são apresentadas como sucesso.

Respostas não recebem nome ou e-mail automaticamente. O respondente ainda pode inserir dados pessoais em texto livre.

## Resultados e indicadores

O painel consulta resultados da conta autenticada e calcula seus resumos a partir dos envios persistidos. As notas válidas de perguntas de avaliação alimentam média e distribuição; comentários não alteram esses indicadores. O total de respostas conta envios. Pesquisas antigas com várias perguntas de avaliação podem contribuir com mais de uma nota por envio.

O gráfico de volume diário cobre os últimos sete dias no fuso local do navegador. Comentários podem ser lidos e buscados manualmente; não há classificação automática. A taxa de conclusão é `null`: o sistema não registra início nem abandono do formulário.

Com o painel visível, a rota autenticada `/api/surveys/events` envia avisos SSE baseados em inserções no Supabase Realtime. O navegador atualiza os resultados afetados, agrupa avisos próximos e tenta reconectar após falhas. A conexão pausa quando a aba fica oculta.

## Limitações e cuidados

- Não há papéis de usuário ou isolamento multiempresa.
- Preferências de notificações e privacidade são demonstrativas.
- Relatórios não filtram por pesquisa ou período e não oferecem exportação estruturada; a impressão usa o navegador.
- A busca de comentários não faz análise de sentimento.
- Turnstile ajuda a reduzir automação, mas não substitui WAF, limites na hospedagem ou proteção do acesso direto ao Supabase.
- As migrações em `supabase/migrations/` precisam estar aplicadas. Mocks e capturas de demonstração não são importados como dados reais.

Consulte [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) para contratos e [SUPABASE_INTEGRATION.md](./SUPABASE_INTEGRATION.md) para configuração do serviço.
