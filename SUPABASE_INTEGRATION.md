# 🔄 Guia: Conectar Backend ao Supabase

## Overview

O backend foi desenvolvido com **abstração de banco de dados**. Atualmente usa in-memory storage, mas está 100% pronto para Supabase.

Todas as operações são abstraídas em `src/lib/database.ts`, então a integração é **apenas nesse arquivo**.

---

## Arquitetura Atual vs. Supabase

### Hoje (In-Memory)
```
API Endpoint → Validation → database.ts (Maps) → Response
```

### Com Supabase
```
API Endpoint → Validation → database.ts (Supabase queries) → Response
```

**Tudo mais fica idêntico!**

---

## Passo 1: Setup Supabase

### Criar Projeto
1. Acesse [app.supabase.com](https://app.supabase.com)
2. Clique "Create new project"
3. Configure:
   - Name: `voz-do-cliente-prod`
   - Database password: (gere uma forte)
   - Region: (escolha mais próximo)
   - Clique "Create new project"

### Obter Credenciais
1. Vá para **Settings → API**
2. Copie:
   - `Project URL` → será `SUPABASE_URL`
   - `anon public key` → será `SUPABASE_PUBLISHABLE_KEY`
3. Para server-side operations (opcional):
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

---

## Passo 2: Executar Migrações

### Baixar Supabase CLI
```bash
npm install -g supabase
```

### Login
```bash
supabase login
```

### Executar Migrações do Projeto
```bash
# De dentro da pasta do projeto
supabase db push

# Ou manualmente:
# 1. Vá para Supabase Dashboard → SQL Editor
# 2. Copie conteúdo de supabase/migrations/20261119210000_*.sql
# 3. Cole e execute
```

**Resultado esperado:**
- ✅ Tabelas criadas: surveys, questions, question_options, submissions, answers
- ✅ Índices criados
- ✅ Row Level Security (RLS) ativado
- ✅ Políticas configuradas

---

## Passo 3: Implementar Database Layer

### Instalar Supabase Client
```bash
npm install @supabase/supabase-js
```

### Atualizar `src/lib/database.ts`

Substitua o arquivo inteiro por:

```typescript
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./supabase/config";
import {
  Survey,
  SurveyWithQuestions,
  Question,
  QuestionWithOptions,
  QuestionOption,
  Submission,
  Answer,
  SurveyResult,
  QuestionResult,
  CreateSurveyInput,
  UpdateSurveyInput,
  CreateQuestionInput,
  UpdateQuestionInput,
  SubmitSurveyInput,
  PaginatedResponse,
} from "./types";

// Initialize Supabase client
function getSupabase() {
  const config = getSupabaseConfig();
  return createClient(config.url, config.key);
}

// ==================== SURVEYS ====================

export async function createSurvey(
  owner_id: string,
  input: CreateSurveyInput
): Promise<Survey> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from("surveys")
    .insert({
      owner_id,
      title: input.title,
      description: input.description || "",
      category: input.category || "",
      status: input.status || "draft",
      starts_at: input.starts_at,
      ends_at: input.ends_at,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create survey: ${error.message}`);
  return data as Survey;
}

export async function getSurvey(id: string): Promise<Survey | null> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from("surveys")
    .select()
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Survey;
}

export async function getSurveyBySlug(slug: string): Promise<Survey | null> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from("surveys")
    .select()
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data as Survey;
}

export async function getUserSurveys(
  owner_id: string,
  page: number = 1,
  page_size: number = 10
): Promise<PaginatedResponse<Survey>> {
  const supabase = getSupabase();
  
  const start = (page - 1) * page_size;
  
  const { data, error, count } = await supabase
    .from("surveys")
    .select("*", { count: "exact" })
    .eq("owner_id", owner_id)
    .order("created_at", { ascending: false })
    .range(start, start + page_size - 1);

  if (error) throw new Error(`Failed to fetch surveys: ${error.message}`);

  return {
    data: (data || []) as Survey[],
    total: count || 0,
    page,
    page_size,
  };
}

export async function updateSurvey(
  id: string,
  owner_id: string,
  input: UpdateSurveyInput
): Promise<Survey | null> {
  const supabase = getSupabase();
  
  // Verify ownership
  const existing = await getSurvey(id);
  if (!existing || existing.owner_id !== owner_id) return null;

  const updateData: any = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.starts_at !== undefined) updateData.starts_at = input.starts_at;
  if (input.ends_at !== undefined) updateData.ends_at = input.ends_at;

  const { data, error } = await supabase
    .from("surveys")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) return null;
  return data as Survey;
}

export async function deleteSurvey(
  id: string,
  owner_id: string
): Promise<boolean> {
  const supabase = getSupabase();
  
  const existing = await getSurvey(id);
  if (!existing || existing.owner_id !== owner_id) return false;

  const { error } = await supabase
    .from("surveys")
    .delete()
    .eq("id", id);

  return !error;
}

export async function getSurveyWithQuestions(
  id: string
): Promise<SurveyWithQuestions | null> {
  const supabase = getSupabase();
  
  const { data: surveyData, error: surveyError } = await supabase
    .from("surveys")
    .select()
    .eq("id", id)
    .single();

  if (surveyError) return null;

  const { data: questionsData, error: questionsError } = await supabase
    .from("questions")
    .select(
      `
      *,
      question_options(*)
    `
    )
    .eq("survey_id", id)
    .order("position");

  if (questionsError) return null;

  return {
    ...(surveyData as Survey),
    questions: questionsData as QuestionWithOptions[],
  } as SurveyWithQuestions;
}

// ==================== QUESTIONS ====================

export async function createQuestion(
  survey_id: string,
  input: CreateQuestionInput
): Promise<Question> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from("questions")
    .insert({
      survey_id,
      title: input.title,
      kind: input.kind,
      required: input.required,
      position: input.position,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create question: ${error.message}`);
  return data as Question;
}

export async function updateQuestion(
  id: string,
  survey_id: string,
  input: UpdateQuestionInput
): Promise<Question | null> {
  const supabase = getSupabase();
  
  const updateData: any = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.kind !== undefined) updateData.kind = input.kind;
  if (input.required !== undefined) updateData.required = input.required;
  if (input.position !== undefined) updateData.position = input.position;

  const { data, error } = await supabase
    .from("questions")
    .update(updateData)
    .eq("id", id)
    .eq("survey_id", survey_id)
    .select()
    .single();

  if (error) return null;
  return data as Question;
}

export async function deleteQuestion(
  id: string,
  survey_id: string
): Promise<boolean> {
  const supabase = getSupabase();
  
  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", id)
    .eq("survey_id", survey_id);

  return !error;
}

export async function getSurveyQuestions(
  survey_id: string
): Promise<QuestionWithOptions[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from("questions")
    .select(
      `
      *,
      question_options(*)
    `
    )
    .eq("survey_id", survey_id)
    .order("position");

  if (error) return [];
  return data as QuestionWithOptions[];
}

// ==================== QUESTION OPTIONS ====================

export async function createQuestionOption(
  question_id: string,
  label: string,
  position: number
): Promise<QuestionOption> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from("question_options")
    .insert({
      question_id,
      label,
      position,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create option: ${error.message}`);
  return data as QuestionOption;
}

export async function updateQuestionOption(
  id: string,
  question_id: string,
  label: string,
  position: number
): Promise<QuestionOption | null> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from("question_options")
    .update({ label, position })
    .eq("id", id)
    .eq("question_id", question_id)
    .select()
    .single();

  if (error) return null;
  return data as QuestionOption;
}

export async function deleteQuestionOption(
  id: string,
  question_id: string
): Promise<boolean> {
  const supabase = getSupabase();
  
  const { error } = await supabase
    .from("question_options")
    .delete()
    .eq("id", id)
    .eq("question_id", question_id);

  return !error;
}

// ==================== SUBMISSIONS ====================

export async function validateSurveyForSubmission(slug: string): Promise<boolean> {
  const survey = await getSurveyBySlug(slug);
  if (!survey) return false;

  if (survey.status !== "active") return false;

  const now = new Date();
  if (survey.starts_at && new Date(survey.starts_at) > now) return false;
  if (survey.ends_at && new Date(survey.ends_at) < now) return false;

  return true;
}

export async function validateAnswers(
  survey_id: string,
  answers_input: Array<{ question_id: string; rating?: number; text_value?: string; option_id?: string }>
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  const surveyQuestions = await getSurveyQuestions(survey_id);

  for (const question of surveyQuestions) {
    const answer = answers_input.find((a) => a.question_id === question.id);

    if (question.required && !answer) {
      errors.push(`Question ${question.id} is required`);
      continue;
    }

    if (!answer) continue;

    if (question.kind === "rating") {
      if (answer.rating === undefined) {
        errors.push(`Question ${question.id} requires a rating`);
      } else if (answer.rating < 1 || answer.rating > 5) {
        errors.push(`Question ${question.id} rating must be between 1 and 5`);
      }
    } else if (question.kind === "single_choice") {
      if (!answer.option_id) {
        errors.push(`Question ${question.id} requires an option`);
      } else {
        const optionExists = question.options.some((opt) => opt.id === answer.option_id);
        if (!optionExists) {
          errors.push(`Invalid option for question ${question.id}`);
        }
      }
    } else if (question.kind === "text") {
      if (!answer.text_value || answer.text_value.trim() === "") {
        errors.push(`Question ${question.id} requires a text response`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function submitSurvey(
  survey_slug: string,
  answers_input: SubmitSurveyInput["answers"]
): Promise<{ submission_id: string; errors?: string[] } | null> {
  const supabase = getSupabase();
  
  const survey = await getSurveyBySlug(survey_slug);
  if (!survey) return null;

  const isValid = await validateSurveyForSubmission(survey_slug);
  if (!isValid) return null;

  const validation = await validateAnswers(survey.id, answers_input);
  if (!validation.valid) return { submission_id: "", errors: validation.errors };

  // Create submission
  const { data: submissionData, error: submissionError } = await supabase
    .from("submissions")
    .insert({
      survey_id: survey.id,
    })
    .select()
    .single();

  if (submissionError) return null;

  const submission_id = submissionData.id;

  // Create answers
  const answersToInsert = answers_input.map((answer_input) => ({
    survey_id: survey.id,
    submission_id,
    question_id: answer_input.question_id,
    rating: answer_input.rating || null,
    text_value: answer_input.text_value || null,
    option_id: answer_input.option_id || null,
  }));

  const { error: answersError } = await supabase
    .from("answers")
    .insert(answersToInsert);

  if (answersError) return null;

  return { submission_id };
}

export async function getSurveySubmissions(
  survey_id: string,
  owner_id: string
): Promise<Submission[]> {
  const supabase = getSupabase();
  
  const survey = await getSurvey(survey_id);
  if (!survey || survey.owner_id !== owner_id) return [];

  const { data, error } = await supabase
    .from("submissions")
    .select()
    .eq("survey_id", survey_id)
    .order("submitted_at", { ascending: false });

  if (error) return [];
  return data as Submission[];
}

export async function getSurveyResults(
  survey_id: string,
  owner_id: string
): Promise<SurveyResult | null> {
  const supabase = getSupabase();
  
  const survey = await getSurvey(survey_id);
  if (!survey || survey.owner_id !== owner_id) return null;

  const surveyQuestions = await getSurveyQuestions(survey_id);
  const { data: submissionsData } = await supabase
    .from("submissions")
    .select()
    .eq("survey_id", survey_id);

  const submissions = submissionsData as Submission[];

  const { data: answersData } = await supabase
    .from("answers")
    .select()
    .eq("survey_id", survey_id);

  const answers = answersData as Answer[];

  const questions_results: QuestionResult[] = surveyQuestions.map((question) => {
    const questionAnswers = answers.filter((a) => a.question_id === question.id);

    const result: QuestionResult = {
      question,
      responses_count: questionAnswers.length,
    };

    if (question.kind === "rating") {
      const ratings = questionAnswers.filter((a) => a.rating !== null).map((a) => a.rating!);
      if (ratings.length > 0) {
        result.rating_average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        result.rating_distribution = {
          1: ratings.filter((r) => r === 1).length,
          2: ratings.filter((r) => r === 2).length,
          3: ratings.filter((r) => r === 3).length,
          4: ratings.filter((r) => r === 4).length,
          5: ratings.filter((r) => r === 5).length,
        };
      }
    } else if (question.kind === "single_choice") {
      result.options_distribution = {};
      for (const option of question.options) {
        const count = questionAnswers.filter((a) => a.option_id === option.id).length;
        result.options_distribution[option.label] = count;
      }
    } else if (question.kind === "text") {
      result.text_responses = questionAnswers
        .filter((a) => a.text_value !== null)
        .map((a) => a.text_value!);
    }

    return result;
  });

  return {
    survey,
    total_responses: submissions.length,
    completion_rate: surveyQuestions.length > 0 ? submissions.length / surveyQuestions.length : 0,
    questions_results,
  };
}
```

---

## Passo 4: Atualizar Environment Variables

### `.env.local`
```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_PUBLISHABLE_KEY=seu-publishable-key
SITE_URL=http://localhost:3000
```

### `.env.production.local` (para produção)
```
SUPABASE_URL=https://seu-projeto-prod.supabase.co
SUPABASE_PUBLISHABLE_KEY=sua-chave-prod
SITE_URL=https://seu-dominio.com
```

---

## Passo 5: Testar

### Build
```bash
npm run build
```

### Dev Server
```bash
npm run dev
```

### Testar Endpoints
```bash
# Criar pesquisa
curl -X POST http://localhost:3000/api/surveys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","category":"Test","status":"draft"}'

# Ver em Supabase Dashboard → Table Editor
# Vai ver a pesquisa criada em tempo real!
```

---

## Passo 6: Troubleshooting

### Erro: "Supabase not configured"
- Verificar `.env.local`
- Certificar que `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` estão definidas
- Reiniciar servidor (`npm run dev`)

### Erro: "Permission denied"
- Verificar que você está autenticado (JWT token válido)
- Verificar que o usuário é o `owner_id` da pesquisa
- Verificar RLS policies em Supabase Dashboard → Authentication → Policies

### Erro: "Table not found"
- Migrações não executadas
- Executar: `supabase db push`
- Ou adicionar manualmente via SQL Editor

### Lentidão
- Verificar índices em Supabase
- Usar `Select()` apenas com colunas necessárias
- Implementar caching se necessário

---

## 📋 Checklist de Integração

- [ ] Projeto Supabase criado
- [ ] Credenciais obtidas
- [ ] `.env.local` atualizado
- [ ] Migrações executadas
- [ ] Tabelas criadas (verificar em Table Editor)
- [ ] RLS policies ativas
- [ ] `src/lib/database.ts` atualizado
- [ ] Build sem erros
- [ ] Endpoints testados
- [ ] Dados aparecem no Supabase

---

## 🎉 Pronto!

Após completar os passos acima:
- ✅ Backend rodando com Supabase
- ✅ Dados salvos no PostgreSQL real
- ✅ Escalável para produção
- ✅ Todos os endpoints funcionais
