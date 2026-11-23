import assert from "node:assert/strict";
import test from "node:test";
import { loadDashboardData, summarizeResults } from "../src/lib/dashboard-data.ts";
import { createQuestionSchema } from "../src/lib/validation.ts";

test("indicadores usam avaliações e datas das respostas reais", () => {
  const report = {
    survey: { id: "survey", title: "Pesquisa" },
    questions_results: [{ question: { id: "rating", kind: "rating" } }],
    submissions: [{ submitted_at: "2026-11-22T12:00:00Z", answers: [{ question_id: "rating", rating: 5 }] }],
  };
  const summary = summarizeResults([report], new Date("2026-11-22T15:00:00Z"));
  assert.equal(summary.average, 5);
  assert.equal(summary.weekly.reduce((sum, day) => sum + day.responses, 0), 1);
});

test("carrega todas as páginas e sinaliza erros da API", async () => {
  const originalFetch = globalThis.fetch;
  const urls = [];
  try {
    globalThis.fetch = async (url) => {
      urls.push(url);
      if (url.includes("/results")) return Response.json({ success: true, data: { survey: { id: url.split("/")[3] }, submissions: [], questions_results: [], total_responses: 0 } });
      const page = Number(new URL(url, "http://localhost").searchParams.get("page"));
      return Response.json({ success: true, data: { data: [{ id: String(page) }], total: 2, page, page_size: 100 } });
    };
    const data = await loadDashboardData();
    assert.deepEqual(data.surveys.map((survey) => survey.id), ["1", "2"]);
    assert.equal(data.results.length, 2);
    assert.equal(urls.length, 4);
    globalThis.fetch = async () => Response.json({ success: false, error: { message: "Sessão expirada" } }, { status: 401 });
    await assert.rejects(loadDashboardData(), /Sessão expirada/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("perguntas de escolha única exigem pelo menos duas opções válidas", () => {
  const question = { title: "Escolha", kind: "single_choice", position: 0 };
  assert.equal(createQuestionSchema.safeParse(question).success, false);
  assert.equal(createQuestionSchema.safeParse({ ...question, options: [{ label: "Sim", position: 0 }] }).success, false);
  assert.equal(createQuestionSchema.safeParse({ ...question, options: [{ label: "Sim", position: 0 }, { label: "Não", position: 1 }] }).success, true);
});
