# 🏗️ Status do Backend/API - Voz do Cliente

## Resumo Executivo

✅ **NÃO PRECISA FAZER BACKEND SEPARADO!**

Este é um projeto **Next.js full-stack** onde o backend já está integrado. O Supabase funciona como banco de dados + autenticação.

---

## Arquitetura Atual

```
Frontend (Next.js React Components)
         ↓
App Router + Server Actions (.ts files)
         ↓
Supabase Client Library (@supabase/ssr)
         ↓
Supabase Backend (PostgreSQL + Auth)
```

### Fluxo de Dados

1. **Componentes React** (Frontend)
   - Arquivos em `src/components/` e `src/app/`
   - Interface do usuário

2. **Server Actions** (Backend Leve)
   - Arquivo: `src/app/auth/actions.ts`
   - Operações de autenticação (login, signup, reset password)
   - Executadas no servidor Next.js, mas no mesmo projeto

3. **Supabase Client**
   - Conexão com Supabase
   - Queries diretas ao PostgreSQL com RLS (Row Level Security)

4. **Supabase Backend** (Banco de Dados + Auth)
   - PostgreSQL com schemas em `supabase/migrations/`
   - Autenticação JWT nativa
   - Row Level Security (Segurança no Banco)

---

## ✅ O que Já Existe

### 1. **Banco de Dados (Schema)**
Arquivo: `supabase/migrations/20261119210000_create_survey_schema.sql`

**Tabelas:**
- `surveys` - Pesquisas criadas pelos usuários
- `questions` - Perguntas dentro de cada pesquisa
- `question_options` - Opções para perguntas de múltipla escolha
- `submissions` - Respostas/envios dos respondentes
- `answers` - Respostas individuais para cada pergunta

**Segurança (RLS):**
- Usuários autenticados só veem suas próprias pesquisas
- Respondentes podem criar submissões
- Usuários donos podem ler resultados

### 2. **Autenticação**
Arquivo: `src/app/auth/actions.ts`

**Funcionalidades:**
- ✅ Login (email + senha)
- ✅ Signup (registro com e-mail)
- ✅ Reset password (recuperar senha)
- ✅ Update password (atualizar senha)
- ✅ Update profile (nome + organização)
- ✅ Logout

### 3. **API Endpoints**
Arquivo: `src/app/auth/callback/route.ts`

**Implementado:**
- ✅ `GET /auth/callback` - Callback do Supabase após login

**Estado:**
- ⚠️ Ainda não há endpoints REST para operações de pesquisa (criar, editar, deletar, listar)
- ⚠️ Ainda não há endpoints para submissões (enviar respostas)

---

## 🟡 O que Falta Fazer (IMPORTANTE)

### **CRÍTICO - Deve Fazer Antes de Produção:**

#### 1. **Conectar Componentes ao Supabase**
O projeto ainda está usando **dados MOCK** (fictícios).

Locais onde há dados fake:
```
src/lib/mock-data.ts → Pesquisas, respostas, etc são fake
src/components/sections/ → Componentes não salvam dados no banco
```

**Precisa fazer:**
- [ ] Conectar `SurveysSection` ao Supabase
  - Buscar surveys do banco ao carregar
  - Criar nova survey no banco
  - Deletar/editar survey
  
- [ ] Conectar `ResponsesSection` ao Supabase
  - Buscar respostas (submissions) do banco
  - Listar respostas de cada pesquisa
  
- [ ] Conectar `ReportsSection` ao Supabase
  - Calcular estatísticas das respostas
  - Gerar relatórios
  
- [ ] Criar página de resposta de pesquisa (`/pesquisa/[slug]`)
  - Públic (sem autenticação)
  - Aceita respostas de qualquer pessoa
  - Envia submissão ao banco

#### 2. **API REST (Server Actions ou Route Handlers)**
Atualmente só existe `/auth/callback`.

**Precisa criar:**
```
POST   /api/surveys              → Criar nova pesquisa
GET    /api/surveys              → Listar pesquisas do usuário
GET    /api/surveys/[id]         → Obter detalhes de uma pesquisa
PATCH  /api/surveys/[id]         → Editar pesquisa
DELETE /api/surveys/[id]         → Deletar pesquisa

POST   /api/surveys/[id]/submit  → Enviar respostas (público)
GET    /api/surveys/[id]/results → Obter resultados
```

**Opção 1:** Route Handlers (mais tradicional)
```typescript
// src/app/api/surveys/route.ts
export async function GET(request: Request) { ... }
export async function POST(request: Request) { ... }
```

**Opção 2:** Server Actions (mais Next.js moderno)
```typescript
// src/app/surveys/actions.ts
"use server"
export async function createSurvey(...) { ... }
```

#### 3. **Validações e Regras de Negócio**
Implementar lógica:
- [ ] Apenas pesquisas ativas podem receber respostas
- [ ] Validar campos obrigatórios antes de salvar
- [ ] Limitar tipos de perguntas (rating, multiple choice, text)
- [ ] Verificar permissões do usuário

---

## 📊 Comparação: Mock vs Real

| Funcionalidade | Atualmente | Precisa Fazer |
|---|---|---|
| **Criar pesquisa** | ⚠️ Cria só na memória | ✅ Salvar no Supabase |
| **Listar pesquisas** | ⚠️ Dados mockados | ✅ Buscar do Supabase |
| **Responder pesquisa** | ❌ Não existe | ✅ Criar página `/pesquisa/[slug]` |
| **Ver respostas** | ⚠️ Dados mockados | ✅ Buscar do Supabase |
| **Gerar relatórios** | ⚠️ Dados mockados | ✅ Calcular de verdade |
| **Autenticação** | ✅ Supabase + JWT | ✅ Já está pronto |
| **Permissões** | ✅ RLS no banco | ✅ Já está configurado |

---

## 🚀 Prioridade de Implementação

### **Fase 1: MVP Mínimo** (1-2 dias)
1. Conectar listagem de pesquisas ao Supabase
2. Implementar criar nova pesquisa (POST)
3. Criar página de resposta pública
4. Salvar respostas no banco

### **Fase 2: Funcionalidades Essenciais** (2-3 dias)
1. Editar/deletar pesquisas
2. Ver resultados/respostas
3. Validações de campos obrigatórios
4. Listar respostas por pesquisa

### **Fase 3: Relatórios & Analytics** (3-5 dias)
1. Calcular média de avaliações
2. Gerar gráficos de respostas
3. Exportar relatórios (PDF/CSV)
4. Filtros avançados

---

## 📁 Estrutura de Código Recomendada

```
src/
├── app/
│   ├── api/              ← NOVO: API Routes (se usar)
│   │   └── surveys/
│   │       ├── route.ts
│   │       └── [id]/
│   ├── auth/
│   │   ├── actions.ts    ✅ Já existe
│   │   └── callback/     ✅ Já existe
│   ├── pesquisa/         ← NOVO: Página de resposta
│   │   └── [slug]/
│   │       └── page.tsx
│   └── dashboard/        ← NOVO: Área protegida
│
├── components/
│   ├── sections/
│   │   ├── surveys-section.tsx      ← Conectar ao Supabase
│   │   ├── responses-section.tsx    ← Conectar ao Supabase
│   │   └── reports-section.tsx      ← Conectar ao Supabase
│   └── ...
│
├── lib/
│   ├── supabase/
│   │   ├── config.ts        ✅ Já existe
│   │   ├── server.ts        ✅ Já existe
│   │   ├── client.ts        ✅ Já existe
│   │   └── queries.ts       ← NOVO: Funções para buscar dados
│   └── ...
│
└── supabase/
    └── migrations/
        └── 20261119210000_*.sql ✅ Já existe
```

---

## 💡 Próximos Passos

1. **Execute as migrações do Supabase** (se não feito ainda)
   ```bash
   supabase migration up
   ```

2. **Crie arquivo de queries**
   ```typescript
   // src/lib/supabase/queries.ts
   export async function getSurveys(userId: string) { ... }
   export async function createSurvey(data: Survey) { ... }
   // etc
   ```

3. **Comece pela página de resposta** (mais simples)
   - Criar rota `GET /pesquisa/[slug]`
   - Buscar survey pelo slug no Supabase
   - Mostrar formulário
   - Enviar respostas com `POST /api/surveys/[id]/submit`

4. **Depois conecte o dashboard**
   - Buscar surveys do usuário autenticado
   - Implementar CRUD (Create, Read, Update, Delete)

---

## 🛠️ Stack Técnico para Backend

| Componente | Ferramenta | Status |
|---|---|---|
| **Banco de Dados** | PostgreSQL (Supabase) | ✅ Pronto |
| **Autenticação** | Supabase Auth (JWT) | ✅ Pronto |
| **ORM/Query Builder** | Supabase JS Client | ✅ Pronto |
| **API** | Next.js Route Handlers | ⚠️ Precisa criar |
| **Validação** | Zod (ou similar) | ⚠️ Pode adicionar |
| **Rate Limiting** | Middleware customizado | ⚠️ Opcional |

---

## ❓ Dúvidas Comuns

**P: Preciso de Express.js, Node.js separado?**
R: Não! Next.js já é um full-stack framework. Backend está integrado.

**P: E se precisar escalar?**
R: Supabase é serverless e escala automaticamente. Para APIs pesadas, pode separar em microserviços depois.

**P: Os dados mock afetam a produção?**
R: Sim! Precisa remover `mockSurveys` e conectar ao Supabase.

**P: Posso testar localmente?**
R: Sim! Usa Supabase local com `supabase start` ou conect em um projeto real.

