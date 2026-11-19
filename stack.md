# Stack Tecnológica

## 1. Visão geral

A aplicação será desenvolvida como um sistema web para criação de pesquisas de satisfação, coleta de respostas e análise da experiência do cliente. A stack proposta prioriza tecnologias atuais, integração entre os componentes e um escopo viável para desenvolvimento acadêmico.

## 2. Tecnologias propostas

| Camada | Tecnologia | Finalidade |
|---|---|---|
| Aplicação web | Next.js, React e TypeScript | Construção das páginas, componentes e funcionalidades do sistema. |
| Estilização | Tailwind CSS | Desenvolvimento de uma interface responsiva. |
| Componentes visuais | shadcn/ui | Componentes reutilizáveis para formulários, tabelas, botões e diálogos. |
| Banco de dados | PostgreSQL, disponibilizado pelo Supabase | Armazenamento relacional de usuários administrativos, pesquisas, perguntas e respostas. |
| Autenticação | Supabase Auth | Login e gerenciamento de acesso dos usuários administrativos. |
| Validação de dados | Zod | Validação dos dados recebidos em formulários e operações do servidor. |
| Gráficos | Recharts | Apresentação visual dos indicadores e resultados das pesquisas. |
| Testes unitários | Vitest | Testes de funções e regras de negócio. |
| Testes de interface | Playwright | Testes dos principais fluxos da aplicação pelo navegador. |
| Hospedagem da aplicação | Vercel | Publicação da aplicação web. |
| Hospedagem do banco e autenticação | Supabase | Disponibilização do PostgreSQL e dos serviços de autenticação. |

## 3. Justificativa das escolhas

### Next.js, React e TypeScript

React permite construir a interface utilizando componentes reutilizáveis. Next.js fornece uma estrutura para desenvolver a aplicação web e suas funcionalidades de servidor em um único projeto, evitando a necessidade de separar a primeira versão em vários serviços. TypeScript acrescenta tipagem estática, ajudando a detectar inconsistências durante o desenvolvimento.

### Tailwind CSS e shadcn/ui

Tailwind CSS facilita a criação de interfaces responsivas por meio de classes utilitárias. O shadcn/ui oferece componentes reutilizáveis que podem ser adaptados ao visual e às necessidades do sistema.

### Supabase e PostgreSQL

PostgreSQL é um banco de dados relacional adequado para representar as relações entre pesquisas, perguntas e respostas. O Supabase oferece PostgreSQL gerenciado e autenticação, reduzindo o trabalho de configuração da infraestrutura durante o desenvolvimento.

### Zod

Zod permite definir e reutilizar esquemas de validação para os dados recebidos. As validações devem ser aplicadas no servidor, mesmo quando também houver validação na interface.

### Recharts

Recharts pode ser utilizado para apresentar indicadores como quantidade de respostas, médias e distribuição de avaliações em gráficos.

### Vitest e Playwright

Vitest pode testar regras de negócio e funções isoladas. Playwright pode automatizar cenários completos, como o acesso a uma pesquisa, o envio de uma resposta e a consulta de resultados por um usuário administrativo.

## 4. Organização proposta

A aplicação pode ser organizada em uma única base de código, com áreas distintas para:

- **Interface pública:** acesso e resposta às pesquisas ativas.
- **Área administrativa:** autenticação, criação e gerenciamento de pesquisas.
- **Resultados:** consulta de respostas e visualização de indicadores.
- **Camada de servidor:** validação das operações, aplicação das regras de negócio e comunicação com o banco de dados.
- **Banco de dados:** persistência das entidades e relações da aplicação.

## 5. Segurança e privacidade

- As funções administrativas devem exigir autenticação e autorização.
- As operações que criam, alteram ou encerram pesquisas devem ser executadas e validadas no servidor.
- Pesquisas públicas devem expor somente os dados necessários para sua exibição e resposta.
- A chave administrativa do Supabase não deve ser incluída no código executado pelo navegador.
- O sistema deve validar no servidor se a pesquisa está ativa e se as respostas obrigatórias foram preenchidas.
- A coleta de dados pessoais deve ser evitada quando não for necessária. Se houver identificação dos respondentes, essa decisão deve ser documentada e tratada conforme os requisitos de privacidade e a LGPD.

## 6. Escopo tecnológico da primeira versão

Para manter o projeto viável, a primeira versão pode contemplar:

- Acesso administrativo autenticado.
- Criação e gerenciamento de pesquisas.
- Perguntas de escala, múltipla escolha e resposta aberta.
- Acesso público às pesquisas por link.
- Registro das respostas.
- Painel com totais, médias e distribuição das avaliações.
- Testes dos fluxos essenciais.

Envio automático por e-mail, integração com sistemas externos, análise automática de sentimentos e relatórios avançados podem ser considerados como evoluções futuras.

## 7. Texto para inclusão no trabalho acadêmico

> O sistema será desenvolvido utilizando Next.js, React e TypeScript para a construção da aplicação web. A interface será estilizada com Tailwind CSS e utilizará componentes do shadcn/ui. Os dados serão armazenados em um banco de dados PostgreSQL disponibilizado pelo Supabase, que também será utilizado para autenticação dos usuários administrativos. A validação dos dados será realizada com Zod, e a apresentação dos indicadores será implementada com a biblioteca Recharts. Para a verificação da aplicação, serão utilizados Vitest em testes unitários e Playwright em testes dos principais fluxos pelo navegador. A aplicação poderá ser hospedada na Vercel, com o banco de dados e os serviços de autenticação hospedados no Supabase.
