import type { ApiResponse, PaginatedResponse, Survey, SurveyResult } from "./types";

export function createDashboardUpdateQueue() {
  let tail = Promise.resolve();
  return (work: () => Promise<void>) => {
    const task = tail.then(work);
    tail = task.catch(() => undefined);
    return task;
  };
}

export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  let result: ApiResponse<T>;
  try {
    result = await response.json() as ApiResponse<T>;
  } catch {
    throw new Error(`Resposta inválida da API (${response.status}).`);
  }
  if (!response.ok || !result.success || result.data === undefined) {
    throw new Error(result.error?.message ?? `Erro na API (${response.status}).`);
  }
  return result.data;
}

export async function loadDashboardData(): Promise<{ surveys: Survey[]; results: SurveyResult[] }> {
  const surveys: Survey[] = [];
  let page = 1;
  let total: number;
  do {
    const result = await apiRequest<PaginatedResponse<Survey>>(`/api/surveys?page=${page}&page_size=100`);
    surveys.push(...result.data);
    total = result.total;
    if (result.data.length === 0 && surveys.length < total) {
      throw new Error("Não foi possível carregar todas as pesquisas.");
    }
    page++;
  } while (surveys.length < total);
  const results = await Promise.all(surveys.map((survey) =>
    apiRequest<SurveyResult>(`/api/surveys/${survey.id}/results`),
  ));
  return { surveys, results };
}

export function summarizeResults(results: SurveyResult[], now = new Date()) {
  const ratings = results.flatMap((result) =>
    result.submissions.flatMap((submission) =>
      submission.answers.flatMap((answer) =>
        answer.rating !== null && result.questions_results.some((item) => item.question.id === answer.question_id && item.question.kind === "rating")
          ? [answer.rating] : [],
      ),
    ),
  );
  const submissions = results.flatMap((result) =>
    result.submissions.map((submission) => ({ ...submission, survey: result.survey, questions: result.questions_results })),
  ).sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: ratings.filter((value) => value === rating).length,
  }));
  const weekly = Array.from({ length: 7 }, (_, index) => {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + index);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5 + index);
    const previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13 + index);
    const previousEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 12 + index);
    return {
      day: start.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      responses: submissions.filter((submission) => {
        const time = new Date(submission.submitted_at);
        return time >= start && time < end;
      }).length,
      previous: submissions.filter((submission) => {
        const time = new Date(submission.submitted_at);
        return time >= previousStart && time < previousEnd;
      }).length,
    };
  });
  return {
    submissions,
    distribution,
    weekly,
    average: ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : null,
    positivePercent: ratings.length ? Math.round(ratings.filter((value) => value >= 4).length * 100 / ratings.length) : null,
  };
}
