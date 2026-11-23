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

// Mock data storage (será substituído por Supabase)
const surveys = new Map<string, Survey>();
const questions = new Map<string, Question>();
const questionOptions = new Map<string, QuestionOption>();
const submissions = new Map<string, Submission>();
const answers = new Map<string, Answer>();

let surveyIdCounter = 1;
let questionIdCounter = 1;
let optionIdCounter = 1;
let submissionIdCounter = 1;
let answerIdCounter = 1;

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// SURVEYS =====================================================

export async function createSurvey(
  owner_id: string,
  input: CreateSurveyInput
): Promise<Survey> {
  const id = generateUUID();
  const slug = generateUUID();
  const survey: Survey = {
    id,
    owner_id,
    slug,
    title: input.title,
    description: input.description || "",
    category: input.category || "",
    status: input.status || "draft",
    starts_at: input.starts_at || null,
    ends_at: input.ends_at || null,
    created_at: new Date().toISOString(),
  };
  surveys.set(id, survey);
  return survey;
}

export async function getSurvey(id: string): Promise<Survey | null> {
  return surveys.get(id) || null;
}

export async function getSurveyBySlug(slug: string): Promise<Survey | null> {
  for (const survey of surveys.values()) {
    if (survey.slug === slug) return survey;
  }
  return null;
}

export async function getUserSurveys(
  owner_id: string,
  page: number = 1,
  page_size: number = 10
): Promise<PaginatedResponse<Survey>> {
  const userSurveys = Array.from(surveys.values()).filter(
    (s) => s.owner_id === owner_id
  );

  const start = (page - 1) * page_size;
  const end = start + page_size;
  const paginated = userSurveys.slice(start, end);

  return {
    data: paginated,
    total: userSurveys.length,
    page,
    page_size,
  };
}

export async function updateSurvey(
  id: string,
  owner_id: string,
  input: UpdateSurveyInput
): Promise<Survey | null> {
  const survey = surveys.get(id);
  if (!survey || survey.owner_id !== owner_id) return null;

  const updated: Survey = {
    ...survey,
    ...input,
  };
  surveys.set(id, updated);
  return updated;
}

export async function deleteSurvey(
  id: string,
  owner_id: string
): Promise<boolean> {
  const survey = surveys.get(id);
  if (!survey || survey.owner_id !== owner_id) return false;

  surveys.delete(id);

  for (const q of questions.values()) {
    if (q.survey_id === id) questions.delete(q.id);
  }

  for (const qo of questionOptions.values()) {
    const q = questions.get(qo.question_id);
    if (q && q.survey_id === id) questionOptions.delete(qo.id);
  }

  for (const s of submissions.values()) {
    if (s.survey_id === id) submissions.delete(s.id);
  }

  for (const a of answers.values()) {
    if (a.survey_id === id) answers.delete(a.id);
  }

  return true;
}

export async function getSurveyWithQuestions(
  id: string
): Promise<SurveyWithQuestions | null> {
  const survey = surveys.get(id);
  if (!survey) return null;

  const surveyQuestions = Array.from(questions.values())
    .filter((q) => q.survey_id === id)
    .sort((a, b) => a.position - b.position);

  const questionsWithOptions = await Promise.all(
    surveyQuestions.map(async (q) => ({
      ...q,
      options: Array.from(questionOptions.values())
        .filter((opt) => opt.question_id === q.id)
        .sort((a, b) => a.position - b.position),
    }))
  );

  return {
    ...survey,
    questions: questionsWithOptions,
  };
}

// QUESTIONS ===================================================

export async function createQuestion(
  survey_id: string,
  input: CreateQuestionInput
): Promise<Question> {
  const survey = surveys.get(survey_id);
  if (!survey) throw new Error("Survey not found");

  const id = generateUUID();
  const question: Question = {
    id,
    survey_id,
    title: input.title,
    kind: input.kind,
    required: input.required !== undefined ? input.required : true,
    position: input.position,
  };
  questions.set(id, question);
  return question;
}

export async function updateQuestion(
  id: string,
  survey_id: string,
  input: UpdateQuestionInput
): Promise<Question | null> {
  const question = questions.get(id);
  if (!question || question.survey_id !== survey_id) return null;

  const updated: Question = {
    ...question,
    ...input,
  };
  questions.set(id, updated);
  return updated;
}

export async function deleteQuestion(
  id: string,
  survey_id: string
): Promise<boolean> {
  const question = questions.get(id);
  if (!question || question.survey_id !== survey_id) return false;

  questions.delete(id);

  for (const opt of questionOptions.values()) {
    if (opt.question_id === id) questionOptions.delete(opt.id);
  }

  for (const ans of answers.values()) {
    if (ans.question_id === id) answers.delete(ans.id);
  }

  return true;
}

export async function getSurveyQuestions(
  survey_id: string
): Promise<QuestionWithOptions[]> {
  const surveyQuestions = Array.from(questions.values())
    .filter((q) => q.survey_id === survey_id)
    .sort((a, b) => a.position - b.position);

  return Promise.all(
    surveyQuestions.map(async (q) => ({
      ...q,
      options: Array.from(questionOptions.values())
        .filter((opt) => opt.question_id === q.id)
        .sort((a, b) => a.position - b.position),
    }))
  );
}

// QUESTION OPTIONS ============================================

export async function createQuestionOption(
  question_id: string,
  label: string,
  position: number
): Promise<QuestionOption> {
  const question = questions.get(question_id);
  if (!question) throw new Error("Question not found");

  const id = generateUUID();
  const option: QuestionOption = {
    id,
    question_id,
    label,
    position,
  };
  questionOptions.set(id, option);
  return option;
}

export async function updateQuestionOption(
  id: string,
  question_id: string,
  label: string,
  position: number
): Promise<QuestionOption | null> {
  const option = questionOptions.get(id);
  if (!option || option.question_id !== question_id) return null;

  const updated: QuestionOption = {
    ...option,
    label,
    position,
  };
  questionOptions.set(id, updated);
  return updated;
}

export async function deleteQuestionOption(
  id: string,
  question_id: string
): Promise<boolean> {
  const option = questionOptions.get(id);
  if (!option || option.question_id !== question_id) return false;

  questionOptions.delete(id);

  for (const ans of answers.values()) {
    if (ans.option_id === id) answers.delete(ans.id);
  }

  return true;
}

// SUBMISSIONS & ANSWERS =======================================

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
  const survey = await getSurveyBySlug(survey_slug);
  if (!survey) return null;

  const isValid = await validateSurveyForSubmission(survey_slug);
  if (!isValid) return null;

  const validation = await validateAnswers(survey.id, answers_input);
  if (!validation.valid) return { submission_id: "", errors: validation.errors };

  const submission_id = generateUUID();
  const submission: Submission = {
    id: submission_id,
    survey_id: survey.id,
    submitted_at: new Date().toISOString(),
  };
  submissions.set(submission_id, submission);

  for (const answer_input of answers_input) {
    const answer_id = generateUUID();
    const answer: Answer = {
      id: answer_id,
      survey_id: survey.id,
      submission_id,
      question_id: answer_input.question_id,
      rating: answer_input.rating || null,
      text_value: answer_input.text_value || null,
      option_id: answer_input.option_id || null,
    };
    answers.set(answer_id, answer);
  }

  return { submission_id };
}

export async function getSurveySubmissions(
  survey_id: string,
  owner_id: string
): Promise<Submission[]> {
  const survey = surveys.get(survey_id);
  if (!survey || survey.owner_id !== owner_id) return [];

  return Array.from(submissions.values()).filter(
    (s) => s.survey_id === survey_id
  );
}

export async function getSurveyResults(
  survey_id: string,
  owner_id: string
): Promise<SurveyResult | null> {
  const survey = surveys.get(survey_id);
  if (!survey || survey.owner_id !== owner_id) return null;

  const surveyQuestions = await getSurveyQuestions(survey_id);
  const surveySubmissions = Array.from(submissions.values()).filter(
    (s) => s.survey_id === survey_id
  );
  const surveyAnswers = Array.from(answers.values()).filter(
    (a) => a.survey_id === survey_id
  );

  const questions_results: QuestionResult[] = surveyQuestions.map((question) => {
    const questionAnswers = surveyAnswers.filter(
      (a) => a.question_id === question.id
    );

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
    total_responses: surveySubmissions.length,
    completion_rate: surveyQuestions.length > 0 ? (surveySubmissions.length / surveyQuestions.length) : 0,
    questions_results,
  };
}
