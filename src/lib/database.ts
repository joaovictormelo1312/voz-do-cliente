import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type {
  Answer, CreateQuestionInput, CreateSurveyInput, PaginatedResponse,
  PublicSurvey, Question, QuestionOption, QuestionResult, QuestionWithOptions,
  Submission, SubmitSurveyInput, Survey, SurveyResult, SurveyWithQuestions,
  UpdateQuestionInput, UpdateSurveyInput,
} from "@/lib/types";

type QueryError = { message: string; code?: string };

export class PublicSurveyError extends Error {
  constructor(public readonly code: "RATE_LIMITED" | "SURVEY_UNAVAILABLE" | "INVALID_ANSWERS" | "CHALLENGE_REUSED") {
    super(code);
  }
}

export function isSurveyStructureLocked(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P0001"
    && "message" in error && error.message === "SURVEY_HAS_RESPONSES";
}

function check<T>(result: { data: T; error: QueryError | null }): T {
  if (result.error) throw result.error;
  return result.data;
}

function required<T>(value: T | null): T {
  if (value === null) throw new Error("O banco não retornou o registro solicitado.");
  return value;
}

async function allRows<T>(
  load: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: QueryError | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  const size = 500;
  for (;;) {
    const data = check(await load(rows.length, rows.length + size - 1));
    if (!data) throw new Error("O banco não retornou os dados solicitados.");
    rows.push(...data);
    if (data.length < size) return rows;
  }
}

export async function createSurvey(owner_id: string, input: CreateSurveyInput): Promise<Survey> {
  const supabase = await createSupabaseServerClient();
  return required(check(await supabase.from("surveys").insert({ ...input, owner_id }).select().returns<Survey[]>().single()));
}

export async function getSurvey(id: string): Promise<Survey | null> {
  const supabase = await createSupabaseServerClient();
  return check(await supabase.from("surveys").select().eq("id", id).returns<Survey[]>().maybeSingle());
}

export async function getPublicSurvey(slug: string): Promise<PublicSurvey | null> {
  const supabase = await createSupabaseServerClient();
  const data: unknown = check(await supabase.rpc("get_public_survey", { p_slug: slug }));
  const surveySchema = z.object({
    id: z.uuid(), slug: z.uuid(), title: z.string(), description: z.string(),
    status: z.enum(["draft", "active", "closed"]),
    questions: z.array(z.object({
      id: z.uuid(), title: z.string(), kind: z.enum(["rating", "single_choice", "text"]),
      required: z.boolean(), position: z.number(),
      options: z.array(z.object({ id: z.uuid(), label: z.string(), position: z.number() })),
    })),
  }).nullable();
  const response = z.union([
    z.object({ error: z.literal("RATE_LIMITED") }),
    z.object({ survey: surveySchema }),
  ]).parse(data);
  if ("error" in response) throw new PublicSurveyError(response.error);
  return response.survey;
}

export async function getUserSurveys(owner_id: string, page = 1, page_size = 10): Promise<PaginatedResponse<Survey>> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase.from("surveys").select("*", { count: "exact" })
    .eq("owner_id", owner_id).order("created_at", { ascending: false }).order("id")
    .range((page - 1) * page_size, page * page_size - 1).returns<Survey[]>();
  const data = required(check(result));
  if (result.count === null) throw new Error("O banco não retornou o total de pesquisas.");
  return { data, total: result.count, page, page_size };
}

export async function updateSurvey(id: string, owner_id: string, input: UpdateSurveyInput): Promise<Survey | null> {
  const supabase = await createSupabaseServerClient();
  return check(await supabase.from("surveys").update(input).eq("id", id).eq("owner_id", owner_id).select().returns<Survey[]>().maybeSingle());
}

export async function deleteSurvey(id: string, owner_id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const deleted = check(await supabase.from("surveys").delete().eq("id", id).eq("owner_id", owner_id).select("id").returns<{ id: string }[]>().maybeSingle());
  return deleted !== null;
}

export async function getSurveyWithQuestions(id: string): Promise<SurveyWithQuestions | null> {
  const survey = await getSurvey(id);
  return survey ? { ...survey, questions: await getSurveyQuestions(id) } : null;
}

export async function createQuestion(
  survey_id: string, input: CreateQuestionInput, options: Array<{ label: string; position: number }> = [],
): Promise<Question> {
  const supabase = await createSupabaseServerClient();
  return required(check(await supabase.rpc("create_question_with_options", {
    p_survey_id: survey_id, p_title: input.title, p_kind: input.kind,
    p_required: input.required, p_position: input.position, p_options: options,
  }).returns<Question[]>().single()));
}

export async function updateQuestion(id: string, survey_id: string, input: UpdateQuestionInput): Promise<Question | null> {
  const supabase = await createSupabaseServerClient();
  return check(await supabase.from("questions").update(input).eq("id", id).eq("survey_id", survey_id).select().returns<Question[]>().maybeSingle());
}

export async function deleteQuestion(id: string, survey_id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const deleted = check(await supabase.from("questions").delete().eq("id", id).eq("survey_id", survey_id).select("id").returns<{ id: string }[]>().maybeSingle());
  return deleted !== null;
}

export async function getSurveyQuestions(survey_id: string): Promise<QuestionWithOptions[]> {
  const supabase = await createSupabaseServerClient();
  const questions = await allRows<QuestionWithOptions>((from, to) =>
    supabase.from("questions").select("*, options:question_options(*)").eq("survey_id", survey_id)
      .order("position").range(from, to).returns<QuestionWithOptions[]>(),
  );
  return questions.map((question) => ({
    ...question,
    options: question.options.sort((a, b) => a.position - b.position),
  }));
}

export async function createQuestionOption(question_id: string, label: string, position: number): Promise<QuestionOption> {
  const supabase = await createSupabaseServerClient();
  return required(check(await supabase.from("question_options").insert({ question_id, label, position }).select().returns<QuestionOption[]>().single()));
}

export async function updateQuestionOption(id: string, question_id: string, label: string, position: number): Promise<QuestionOption | null> {
  const supabase = await createSupabaseServerClient();
  return check(await supabase.from("question_options").update({ label, position }).eq("id", id).eq("question_id", question_id).select().returns<QuestionOption[]>().maybeSingle());
}

export async function deleteQuestionOption(id: string, question_id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const deleted = check(await supabase.from("question_options").delete().eq("id", id).eq("question_id", question_id).select("id").returns<{ id: string }[]>().maybeSingle());
  return deleted !== null;
}

export async function submitSurvey(survey_id: string, answers: SubmitSurveyInput["answers"], tokenHash: string): Promise<string> {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Configure SUPABASE_URL e SUPABASE_SECRET_KEY no servidor.");
  const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const data: unknown = check(await supabase.rpc("submit_verified_survey", { p_survey_id: survey_id, p_answers: answers, p_token_hash: tokenHash }));
  const response = z.union([
    z.object({ error: z.enum(["SURVEY_UNAVAILABLE", "INVALID_ANSWERS", "CHALLENGE_REUSED"]) }),
    z.object({ submission_id: z.uuid() }),
  ]).parse(data);
  if ("error" in response) throw new PublicSurveyError(response.error);
  return response.submission_id;
}

export async function getSurveyResults(survey_id: string, owner_id: string): Promise<SurveyResult | null> {
  const survey = await getSurvey(survey_id);
  if (!survey || survey.owner_id !== owner_id) return null;
  const supabase = await createSupabaseServerClient();
  const [surveyQuestions, surveySubmissions, surveyAnswers] = await Promise.all([
    getSurveyQuestions(survey_id),
    allRows<Submission>((from, to) => supabase.from("submissions").select("*").eq("survey_id", survey_id).order("id").range(from, to).returns<Submission[]>()),
    allRows<Answer>((from, to) => supabase.from("answers").select("*").eq("survey_id", survey_id).order("id").range(from, to).returns<Answer[]>()),
  ]);
  const questions_results: QuestionResult[] = surveyQuestions.map((question) => {
    const questionAnswers = surveyAnswers.filter((answer) => answer.question_id === question.id);
    const result: QuestionResult = { question, responses_count: questionAnswers.length };
    if (question.kind === "rating") {
      const ratings = questionAnswers.flatMap((answer) => answer.rating === null ? [] : [answer.rating]);
      if (ratings.length) {
        result.rating_average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        result.rating_distribution = Object.fromEntries([1, 2, 3, 4, 5].map((rating) => [rating, ratings.filter((value) => value === rating).length]));
      }
    } else if (question.kind === "single_choice") {
      result.options_distribution = Object.fromEntries(question.options.map((option) => [option.label, questionAnswers.filter((answer) => answer.option_id === option.id).length]));
    } else {
      result.text_responses = questionAnswers.flatMap((answer) => answer.text_value === null ? [] : [answer.text_value]);
    }
    return result;
  });
  return {
    survey, total_responses: surveySubmissions.length,
    completion_rate: null,
    questions_results,
    submissions: surveySubmissions.map((submission) => ({
      ...submission, answers: surveyAnswers.filter((answer) => answer.submission_id === submission.id),
    })),
  };
}
