# 📚 Backend API Documentation

## Overview

Este é um backend Next.js com API REST completa para o sistema "Voz do Cliente". Inclui autenticação, CRUD de pesquisas, questões, e submissão de respostas.

**Base URL:** `http://localhost:3000/api`

---

## 🔐 Authentication

### Login Required
Endpoints protegidos usam o cookie de sessão Supabase obtido no login da aplicação. O cabeçalho `Authorization: Bearer` isolado não autentica estas rotas.

### Public Endpoints
Alguns endpoints são públicos (como responder pesquisa):
- `POST /surveys/[id]/submit` - Enviar respostas (público)
- `GET /surveys/by-slug/[slug]` - Obter pesquisa por slug (apenas ativa)

---

## 📋 API Endpoints

### SURVEYS

#### GET /surveys
List user surveys with pagination

**Authentication:** Required ✅

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "owner_id": "uuid",
        "slug": "uuid",
        "title": "Survey Title",
        "description": "Survey Description",
        "category": "Category",
        "status": "draft|active|closed",
        "starts_at": "2026-11-22T21:50:00Z",
        "ends_at": null,
        "created_at": "2026-11-22T21:50:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "page_size": 10
  }
}
```

**Example:**
```bash
curl -b cookies.txt \
  http://localhost:3000/api/surveys?page=1&page_size=5
```

---

#### POST /surveys
Create new survey

**Authentication:** Required ✅

Creates a standard form atomically: a required 1–5 rating and an optional text comment. Optional `rating_title` and `comment_title` customize the two question texts. Existing legacy surveys retain their original structure.

**Body:**
```json
{
  "title": "Customer Satisfaction Survey",
  "description": "Help us improve our service",
  "category": "Support",
  "status": "draft",
  "rating_title": "How do you rate our service?",
  "comment_title": "What could we improve?",
  "starts_at": "2026-11-23T00:00:00Z",
  "ends_at": null
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "owner_id": "uuid",
    "slug": "uuid",
    "title": "Customer Satisfaction Survey",
    "description": "Help us improve our service",
    "category": "Support",
    "status": "draft",
    "standard_form": true,
    "starts_at": "2026-11-23T00:00:00Z",
    "ends_at": null,
    "created_at": "2026-11-22T21:50:00Z"
  }
}
```

**Example:**
```bash
curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Survey",
    "description": "Test survey",
    "category": "Test",
    "status": "draft"
  }' \
  http://localhost:3000/api/surveys
```

---

#### GET /surveys/[id]
Get survey details with questions

**Authentication:** Required ✅

**Parameters:**
- `id` (required): Survey ID

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "owner_id": "uuid",
    "slug": "uuid",
    "title": "Survey Title",
    "description": "Description",
    "category": "Category",
    "status": "draft",
    "starts_at": null,
    "ends_at": null,
    "created_at": "2026-11-22T21:50:00Z",
    "questions": [
      {
        "id": "uuid",
        "survey_id": "uuid",
        "title": "How satisfied are you?",
        "kind": "rating",
        "required": true,
        "position": 0,
        "options": []
      }
    ]
  }
}
```

**Example:**
```bash
curl -b cookies.txt \
  http://localhost:3000/api/surveys/abc123
```

---

#### PATCH /surveys/[id]
Update survey

**Authentication:** Required ✅

**Body:**
```json
{
  "title": "Updated Title",
  "status": "active"
}
```

**Response:** 200 OK

---

#### DELETE /surveys/[id]
Delete survey and all related data

**Authentication:** Required ✅

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "uuid"
  }
}
```

---

### QUESTIONS

#### GET /surveys/[id]/questions
List all questions for a survey

**Authentication:** Required ✅

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "survey_id": "uuid",
      "title": "Question Title",
      "kind": "rating",
      "required": true,
      "position": 0,
      "options": [
        {
          "id": "uuid",
          "question_id": "uuid",
          "label": "Option Label",
          "position": 0
        }
      ]
    }
  ]
}
```

---

#### POST /surveys/[id]/questions
Create new question

Only legacy surveys allow new questions. Standard surveys have a fixed structure.

**Authentication:** Required ✅

**Body:**
```json
{
  "title": "How satisfied are you?",
  "kind": "rating",
  "required": true,
  "position": 0,
  "options": [
    {
      "label": "Very Satisfied",
      "position": 0
    }
  ]
}
```

**Response:** 201 Created

---

#### PATCH /surveys/[id]/questions/[qid]
Update question

For standard surveys, only the question title may be changed before the first response.

**Authentication:** Required ✅

**Body:**
```json
{
  "title": "Updated question title"
}
```

**Response:** 200 OK

---

#### DELETE /surveys/[id]/questions/[qid]
Delete question and all answers

Not allowed for standard surveys. Any survey with responses also has a locked structure.

**Authentication:** Required ✅

**Response:** 200 OK

---

### QUESTION OPTIONS

#### POST /surveys/[id]/questions/[qid]/options
Create option for question

**Authentication:** Required ✅

**Body:**
```json
{
  "label": "Option Label",
  "position": 0
}
```

**Response:** 201 Created

---

#### PATCH /surveys/[id]/questions/[qid]/options/[oid]
Update option

**Authentication:** Required ✅

**Body:**
```json
{
  "label": "Updated Label",
  "position": 1
}
```

**Response:** 200 OK

---

#### DELETE /surveys/[id]/questions/[qid]/options/[oid]
Delete option

**Authentication:** Required ✅

**Response:** 200 OK

---

### SUBMISSIONS (PUBLIC)

#### POST /surveys/[id]/submit
Submit survey responses (PUBLIC - no auth required)

**Parameters:**
- `id` (required): Survey ID

**Body:**
```json
{
  "challenge_token": "turnstile-token",
  "answers": [
    {
      "question_id": "uuid",
      "rating": 5
    },
    {
      "question_id": "uuid",
      "option_id": "uuid"
    },
    {
      "question_id": "uuid",
      "text_value": "Great service!"
    }
  ]
}
```

**Rules:**
- Survey must be active (`status: "active"`)
- Survey must be within `starts_at` and `ends_at` window
- All required questions must be answered
- Answer values must match question type
- A fresh Cloudflare Turnstile token with action `survey_submit` is required and validated by the server.

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "submission_id": "uuid",
    "message": "Response recorded successfully"
  }
}
```

**Errors:**
- 400 SURVEY_INACTIVE: Survey not active
- 400 VALIDATION_FAILED: Required questions missing
- 400 VALIDATION_ERROR: Invalid answer data
- 400 VERIFICATION_FAILED: Invalid, expired, or reused challenge
- 503 VERIFICATION_UNAVAILABLE: Verification service or configuration unavailable

**Example:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "challenge_token": "TURNSTILE_TOKEN",
    "answers": [
      {"question_id": "abc", "rating": 5},
      {"question_id": "def", "text_value": "Excellent!"}
    ]
  }' \
  http://localhost:3000/api/surveys/survey-id/submit
```

---

### RESULTS

#### GET /surveys/[id]/results
Get survey results and analytics

**Authentication:** Required ✅

The response also includes `submissions`: each submission has `id`,
`survey_id`, `submitted_at`, and its `answers` (including question ID and
the recorded rating, text or option ID). These records are available only
to the survey owner.

The `completion_rate` field is `null`: survey starts and abandonments are not tracked.

**Response:**
```json
{
  "success": true,
  "data": {
    "survey": {
      "id": "uuid",
      "title": "Survey Title",
      "status": "active",
      "created_at": "2026-11-22T21:50:00Z"
    },
    "total_responses": 42,
    "completion_rate": null,
    "questions_results": [
      {
        "question": {
          "id": "uuid",
          "title": "How satisfied are you?",
          "kind": "rating",
          "required": true,
          "position": 0
        },
        "responses_count": 42,
        "rating_average": 4.5,
        "rating_distribution": {
          "1": 2,
          "2": 1,
          "3": 5,
          "4": 15,
          "5": 19
        }
      },
      {
        "question": {
          "id": "uuid",
          "title": "What can we improve?",
          "kind": "text",
          "required": false,
          "position": 1
        },
        "responses_count": 28,
        "text_responses": [
          "Better customer service",
          "Faster delivery",
          "More product variety"
        ]
      }
    ]
  }
}
```

---

### SURVEY BY SLUG (PUBLIC)

#### GET /surveys/by-slug/[slug]
Get survey by slug for responding (PUBLIC)

**Parameters:**
- `slug` (required): Survey slug (UUID)

**Rules:**
- Survey must be active (`status: "active"`)

**Response:** 200 OK with public survey fields, questions, and `turnstile_site_key` (public key, or `null` if not configured); it does not include `owner_id`.

**Errors:**
- 404 NOT_FOUND: Survey not found
- 404 NOT_FOUND: Survey unavailable, inactive or outside its availability window

**Example:**
```bash
curl http://localhost:3000/api/surveys/by-slug/abc-123-uuid
```

---

## 🔄 Data Types

### Survey Status
```
"draft"   - Pesquisa em rascunho (não recebe respostas)
"active"  - Pesquisa ativa (aceita respostas)
"closed"  - Pesquisa encerrada (não aceita mais respostas)
```

### Question Kind
```
"rating"         - Escala de 1-5
"single_choice"  - Múltipla escolha com opções
"text"           - Resposta aberta em texto
```

---

## ⚠️ Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Common Error Codes
| Code | Status | Meaning |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Access denied / insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `VALIDATION_FAILED` | 400 | Validation rules failed |
| `SURVEY_INACTIVE` | 400 | Survey not accepting responses |
| `PAYLOAD_TOO_LARGE` | 413 | Submission body exceeds 5,000,000 bytes |
| `VERIFICATION_FAILED` | 400 | Challenge invalid, expired or reused |
| `VERIFICATION_UNAVAILABLE` | 503 | Challenge verification unavailable |
| `INTERNAL_ERROR` | 500 | Server error |

Submission bodies are limited to 5,000,000 bytes and 200 answers. A server-validated Turnstile token is required, and database permissions prevent anonymous direct submission. No shared per-survey rate cap is applied; configure infrastructure-level protection against volumetric attacks and per-IP abuse, including direct access to Supabase. Challenges can still reject legitimate visitors or be unavailable.

---

## 🚀 Usage Examples

### Create Full Survey
```bash
# 1. Create survey
SURVEY_ID=$(curl -X POST \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"title":"Feedback","category":"Support"}' \
  http://localhost:3000/api/surveys | jq -r '.data.id')

# 2. Find the automatically created rating question
QUESTION_ID=$(curl -b cookies.txt \
  http://localhost:3000/api/surveys/$SURVEY_ID/questions | jq -r '.data[] | select(.kind == "rating") | .id')

# 3. Activate survey
curl -X PATCH \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"status":"active"}' \
  http://localhost:3000/api/surveys/$SURVEY_ID

# 4. Submit response (public; obtain TURNSTILE_TOKEN from the widget)
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"challenge_token":"'$TURNSTILE_TOKEN'","answers":[{"question_id":"'$QUESTION_ID'","rating":5}]}' \
  http://localhost:3000/api/surveys/$SURVEY_ID/submit

# 5. Get results
curl -b cookies.txt \
  http://localhost:3000/api/surveys/$SURVEY_ID/results
```

---

## Database

The API uses Supabase with RLS and transactional public submission functions.
Apply the migrations and configure authentication as described in
`SUPABASE_INTEGRATION.md`. Public submissions require server-side Turnstile
verification; public reads and application traffic require infrastructure-level protection.
