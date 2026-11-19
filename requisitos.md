# Análise de Requisitos

**Tema:** Desenvolvimento de um Sistema Web para Pesquisa de Satisfação e Análise da Experiência do Cliente

## 1. Visão geral do sistema

O sistema permitirá que uma organização crie e disponibilize pesquisas de satisfação para seus clientes. As respostas serão armazenadas e apresentadas em painéis e relatórios, apoiando a análise da experiência do cliente e a identificação de oportunidades de melhoria.

**Nome provisório:** Sistema de Pesquisa de Satisfação e Experiência do Cliente.

### Problema

Organizações podem ter dificuldade para coletar, organizar e analisar opiniões de clientes de forma centralizada. Quando as respostas são registradas manualmente ou em ferramentas dispersas, torna-se mais difícil identificar padrões, acompanhar indicadores e tomar decisões com base no feedback recebido.

### Objetivo geral

Desenvolver um sistema web que permita criar pesquisas de satisfação, coletar respostas dos clientes e visualizar os resultados de forma organizada, auxiliando a análise da experiência do cliente.

### Objetivos específicos

- Permitir o cadastro e o gerenciamento de pesquisas.
- Disponibilizar pesquisas para os clientes responderem.
- Armazenar e organizar as respostas recebidas.
- Apresentar indicadores e relatórios sobre os resultados.
- Facilitar a identificação de avaliações positivas, negativas e sugestões.

## 2. Atores e interessados

| Ator | Descrição |
|---|---|
| Administrador | Gerencia usuários, configurações e acesso ao sistema. |
| Gestor ou analista | Cria pesquisas, acompanha respostas e consulta relatórios. |
| Cliente/respondente | Acessa e responde às pesquisas disponibilizadas. |
| Organização | Utiliza os resultados para avaliar e melhorar seus serviços. |

## 3. Requisitos funcionais

| ID | Requisito |
|---|---|
| RF01 | O sistema deve permitir o acesso de usuários administrativos por meio de autenticação. |
| RF02 | O sistema deve permitir que usuários autorizados criem, editem, ativem e encerrem pesquisas. |
| RF03 | O sistema deve permitir a criação de perguntas de diferentes tipos, como escala de avaliação, múltipla escolha e resposta aberta. |
| RF04 | O sistema deve permitir definir quais perguntas são obrigatórias. |
| RF05 | O sistema deve disponibilizar uma pesquisa ativa para que o cliente possa respondê-la. |
| RF06 | O sistema deve validar o preenchimento das perguntas obrigatórias antes do envio. |
| RF07 | O sistema deve registrar as respostas enviadas e associá-las à pesquisa correspondente. |
| RF08 | O sistema deve apresentar a quantidade de respostas recebidas por pesquisa. |
| RF09 | O sistema deve apresentar resultados consolidados das perguntas fechadas, como totais e percentuais. |
| RF10 | O sistema deve permitir consultar respostas abertas para análise das opiniões e sugestões. |
| RF11 | O sistema deve permitir filtrar resultados por pesquisa e período, quando houver dados disponíveis. |
| RF12 | O sistema deve permitir gerar ou exportar relatórios dos resultados. |
| RF13 | O sistema deve informar ao respondente que a resposta foi registrada. |
| RF14 | O sistema deve permitir encerrar ou desativar uma pesquisa para impedir novas respostas. |

> Caso o escopo seja menor, priorize RF01 a RF10 e deixe exportação e filtros avançados para trabalhos futuros.

## 4. Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF01 | O sistema deve ser acessível por navegadores web modernos. |
| RNF02 | A interface deve ser responsiva e utilizável em computadores e dispositivos móveis. |
| RNF03 | O sistema deve apresentar mensagens claras para erros de preenchimento ou falhas de acesso. |
| RNF04 | O acesso às funções administrativas deve ser restrito a usuários autenticados e autorizados. |
| RNF05 | O sistema deve proteger os dados armazenados contra acesso não autorizado. |
| RNF06 | O sistema deve evitar o envio de uma resposta incompleta quando houver perguntas obrigatórias não respondidas. |
| RNF07 | As telas principais devem apresentar as informações de forma clara e organizada. |
| RNF08 | O sistema deve tratar os dados pessoais conforme as regras de privacidade aplicáveis, incluindo os princípios pertinentes da LGPD. |
| RNF09 | O sistema deve manter os registros necessários para consulta e geração dos resultados. |
| RNF10 | O sistema deve apresentar os resultados em tempo adequado para o volume de dados definido no projeto. |

## 5. Regras de negócio

- **RN01:** Somente pesquisas ativas podem receber respostas.
- **RN02:** Uma pesquisa encerrada não deve aceitar novos envios.
- **RN03:** Perguntas marcadas como obrigatórias devem ser respondidas antes do envio.
- **RN04:** Cada resposta deve estar vinculada a uma pesquisa existente.
- **RN05:** O usuário deve possuir permissão adequada para criar ou gerenciar pesquisas.
- **RN06:** Os indicadores exibidos devem ser calculados a partir das respostas registradas.
- **RN07:** O sistema deve informar claramente ao respondente se a pesquisa é anônima ou se coleta algum dado de identificação.
- **RN08:** O período de disponibilidade da pesquisa, se configurado, deve limitar quando ela pode receber respostas.

## 6. Casos de uso principais

### UC01 — Criar pesquisa

**Ator principal:** Gestor ou analista

**Fluxo básico:**
1. O usuário acessa o sistema.
2. Seleciona a opção para criar uma pesquisa.
3. Informa o título e a descrição.
4. Adiciona perguntas e define seus tipos.
5. Define quais perguntas são obrigatórias.
6. Salva a pesquisa.
7. O sistema confirma o salvamento.

### UC02 — Responder pesquisa

**Ator principal:** Cliente/respondente

**Fluxo básico:**
1. O cliente acessa o endereço da pesquisa.
2. O sistema apresenta o título, a descrição e as perguntas.
3. O cliente preenche as respostas.
4. O sistema valida os campos obrigatórios.
5. O cliente envia a pesquisa.
6. O sistema registra a resposta e apresenta uma confirmação.

### UC03 — Consultar resultados

**Ator principal:** Gestor ou analista

**Fluxo básico:**
1. O usuário acessa a área de resultados.
2. Seleciona uma pesquisa.
3. O sistema apresenta a quantidade de respostas e os resultados consolidados.
4. O usuário consulta as respostas abertas e, se disponível, aplica filtros.
5. O usuário pode gerar ou exportar um relatório.

## 7. Indicadores possíveis

- Número total de respostas.
- Média das avaliações.
- Distribuição das respostas por opção ou nota.
- Percentual de avaliações positivas, neutras e negativas.
- Evolução das avaliações ao longo do tempo.
- Temas recorrentes nas respostas abertas, se fizer parte do escopo.

Também é possível estudar indicadores conhecidos, como **CSAT**, **NPS** ou **CES**. Para o TCC, defina qual indicador será usado e como será calculado; eles podem ser uma etapa futura se o escopo inicial for mais simples.

## 8. Critérios de aceitação de exemplo

- Uma pesquisa criada deve poder ser salva com título e pelo menos uma pergunta.
- Uma pesquisa inativa ou encerrada não deve aceitar novas respostas.
- O sistema deve impedir o envio quando uma pergunta obrigatória estiver sem resposta.
- Após o envio válido, o respondente deve receber uma confirmação.
- Os resultados apresentados devem corresponder às respostas efetivamente registradas.

## 9. Delimitação sugerida para o projeto

**Incluído na primeira versão:**

- Cadastro e autenticação de usuários administrativos.
- Criação e gerenciamento de pesquisas.
- Perguntas de escala, múltipla escolha e texto aberto.
- Link para acesso do respondente.
- Registro das respostas.
- Painel básico com totais, médias e distribuição das respostas.

**Fora da primeira versão:** envio automático de pesquisas por e-mail, integração com sistemas externos, análise automática de sentimentos e relatórios avançados.

**Ponto a definir no TCC:** se as pesquisas serão anônimas ou identificadas e em qual contexto serão aplicadas (por exemplo, após uma compra, atendimento ou uso de um serviço). Isso influencia os requisitos, a privacidade e o modelo de dados.
