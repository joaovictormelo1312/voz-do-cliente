# Resumo atual do projeto

**Atualizado em:** 24 de novembro de 2026

Voz do Cliente é uma aplicação Next.js integrada a Supabase Auth e PostgreSQL. O painel autenticado gerencia pesquisas e consulta resultados; respondentes acessam formulários públicos por slug e enviam respostas após verificação Turnstile.

## Capacidades implementadas

- API autenticada de pesquisas, perguntas, opções e resultados.
- Criação padrão de pesquisa com avaliação de 1 a 5 e comentário opcional.
- Validação e persistência transacional dos envios.
- Indicadores baseados nas respostas armazenadas.
- Atualizações do painel via Supabase Realtime e SSE autenticado.

## Limitações

Sem taxa de conclusão, sentimento automático, exportação estruturada, filtros temporais de relatório, papéis de usuário ou isolamento multiempresa. Notificações e preferências de privacidade são demonstrativas.

## Consulte

- [README principal](../README.md)
- [Índice da documentação](./ÍNDICE.md)
- [Referência da API](./API_DOCUMENTATION.md)
- [Integração Supabase](./SUPABASE_INTEGRATION.md)
- [Publicação](./GUIA_PRODUCAO.md)
