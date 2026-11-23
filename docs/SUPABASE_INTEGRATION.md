# Integração com Supabase

A API usa o cliente Supabase no servidor com a sessão do usuário e as políticas RLS. Pesquisas, perguntas, opções e respostas são armazenadas no PostgreSQL; o formulário público usa funções SQL com validação e gravação transacional.

## Configuração

1. Configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SITE_URL`, `TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY` no ambiente, conforme `.env.example`. A chave secreta do Supabase é usada somente no servidor para executar a função de envio verificado; ela contorna RLS e nunca pode ser exposta no navegador, incluída em código ou compartilhada no chat. As demais operações usam a chave publicável e a sessão do usuário.
2. Vincule a CLI ao projeto correto e confira as migrações:

   ```bash
   npx supabase link
   npx supabase migration list --remote
   npx supabase db push --remote --dry-run
   ```

3. Após confirmar o projeto e revisar a prévia, aplique as migrações:

   ```bash
   npx supabase db push --remote
   ```

4. Execute `npm run dev`, entre com uma conta, crie e ative uma pesquisa, responda pelo link público e confira os resultados. Verifique também o isolamento entre duas contas.

As migrações em `supabase/migrations/` precisam estar aplicadas **antes** de usar a API. Os dados armazenados anteriormente em memória não são migrados e não persistem após reinicialização.

## Atualização automática do painel

A migração `20261123010000_realtime_submissions.sql` adiciona `public.submissions` à publicação `supabase_realtime`. O servidor assina eventos de inserção apenas para as pesquisas da conta autenticada, respeitando a RLS, e encaminha ao navegador apenas o identificador da pesquisa. O token de sessão permanece no servidor.

Com a aba visível, avisos próximos são agrupados e o painel consulta os resultados das pesquisas afetadas. Ao reconectar ou voltar à aba, sincroniza o painel; com a aba oculta, encerra a conexão. Se o canal ou uma consulta falhar, avisa o usuário, tenta sincronizar e reconecta após até um minuto. A atualização manual continua disponível.

A hospedagem e o proxy precisam permitir respostas HTTP em streaming e conexões com Supabase Realtime. Limites de duração ou buffering podem causar reconexões e devem ser testados no ambiente publicado. Cada painel visível mantém uma conexão com a aplicação e um canal no Supabase, com um filtro por pesquisa; monitore conexões, eventos e o custo de carregar resultados em contas com muitas pesquisas ou respostas. O mecanismo reduz consultas desnecessárias, mas não garante ausência de sobrecarga.

## Proteção dos envios

Crie um widget [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/get-started/) em modo **Managed**, registre o domínio da aplicação e configure suas chaves no ambiente. `TURNSTILE_SITE_KEY` é pública e enviada ao navegador; a chave secreta só fica no servidor. `SITE_URL` precisa corresponder ao domínio registrado e ao hostname retornado pela verificação. Configure também a política de privacidade e, se houver CSP, permita os domínios exigidos pelo Turnstile.

Cada envio exige token, validado pelo servidor via Siteverify com hostname e ação `survey_submit`. O banco registra temporariamente um hash para impedir reutilização simultânea. Os tokens expirados precisam de nova verificação. Se a verificação estiver indisponível, o envio é recusado com HTTP 503 para ser tentado novamente. Nunca use chaves de teste em produção; as chaves oficiais de teste retornam hostname e ação fictícios e não passam por esta validação.

**Implantação coordenada:** a migração `20261122231000_verify_public_submissions.sql` revoga o envio direto dos papéis `anon` e `authenticated` e substitui os limites compartilhados de leitura e envio pelo fluxo de verificação. A API nova depende da migração, das chaves do Turnstile e da chave secreta do Supabase; versões antigas e integrações que chamam o RPC antigo deixarão de enviar após a migração. Prepare ambiente e publicação juntos, em uma janela planejada, e teste primeiro em um projeto de teste. Até a migração e a publicação estarem prontas, mantenha a versão anterior em funcionamento.

## Limitações

- Perguntas e opções ficam bloqueadas após a pesquisa receber respostas.
- Novas pesquisas usam um formulário padrão com nota obrigatória de 1 a 5 e comentário opcional; somente os textos podem ser alterados antes da primeira resposta. Nova versão cria pesquisa separada, sem respostas copiadas. Pesquisas anteriores mantêm sua estrutura.
- O Turnstile reduz automação, mas pode apresentar desafio, falhar ou bloquear visitantes legítimos; ele não garante disponibilidade em picos nem impede toda automação.
- A API limita envios a 5.000.000 bytes e 200 respostas. Leituras públicas e requisições à aplicação não possuem limite por IP; configure WAF, proxy reverso e controle de tráfego adequado na hospedagem e proteja também o acesso direto ao Supabase. O limite de corpo da API não se aplica a chamadas diretas ao Supabase.
- A taxa de conclusão não é calculada, pois o sistema não registra acessos ou abandonos.
- A autenticação usa cookies de sessão Supabase; o servidor não aceita um token arbitrário no cabeçalho como alternativa.
