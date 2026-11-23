import assert from "node:assert/strict";
import test from "node:test";
import { createDashboardUpdateQueue, loadDashboardData, summarizeResults } from "../src/lib/dashboard-data.ts";
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

test("comentários não alteram a média ou o percentual das notas", () => {
  const report = {
    survey: { id: "survey", title: "Pesquisa" },
    questions_results: [
      { question: { id: "rating", kind: "rating" } },
      { question: { id: "comment", kind: "text" } },
    ],
    submissions: [
      { submitted_at: "2026-11-22T12:00:00Z", answers: [{ question_id: "rating", rating: 5 }, { question_id: "comment", rating: null, text_value: "Precisa melhorar" }] },
      { submitted_at: "2026-11-22T12:01:00Z", answers: [{ question_id: "rating", rating: 1 }] },
    ],
  };
  const summary = summarizeResults([report]);
  assert.equal(summary.average, 3);
  assert.equal(summary.positivePercent, 50);
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

test("atualizações do painel são serializadas e a fila continua após falha", async () => {
  const enqueue = createDashboardUpdateQueue();
  const order = [];
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const first = enqueue(async () => {
    order.push("primeira iniciada");
    await gate;
    order.push("primeira concluída");
    throw new Error("falha esperada");
  });
  const second = enqueue(async () => { order.push("segunda"); });
  await Promise.resolve();
  assert.deepEqual(order, ["primeira iniciada"]);
  release();
  await assert.rejects(first, /falha esperada/);
  await second;
  assert.deepEqual(order, ["primeira iniciada", "primeira concluída", "segunda"]);
});
