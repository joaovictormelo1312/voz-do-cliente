import assert from "node:assert/strict";
import test from "node:test";
import {
  filterResponses,
  filterSurveys,
  mockResponses,
  mockSurveys,
} from "../src/lib/mock-data.ts";

test("filtra pesquisas por nome ou categoria sem diferenciar maiúsculas", () => {
  const results = filterSurveys(mockSurveys, "LOGÍSTICA", "Todas");

  assert.deepEqual(results.map(({ id }) => id), ["experiencia-entrega"]);
});

test("combina texto e status ao filtrar pesquisas", () => {
  const results = filterSurveys(mockSurveys, "relacionamento", "Ativa");

  assert.deepEqual(results.map(({ id }) => id), ["satisfacao-nps"]);
});

test("retorna lista vazia quando nenhuma pesquisa corresponde", () => {
  assert.deepEqual(filterSurveys(mockSurveys, "inexistente", "Todas"), []);
});

test("sem filtros retorna todas as pesquisas e respostas", () => {
  assert.deepEqual(filterSurveys(mockSurveys, "", "Todas"), mockSurveys);
  assert.deepEqual(filterResponses(mockResponses, mockSurveys, "", "Todos", "Todas"), mockResponses);
});

test("combina busca, sentimento e pesquisa ao filtrar respostas", () => {
  const results = filterResponses(
    mockResponses,
    mockSurveys,
    "entrega",
    "Positivo",
    "experiencia-entrega",
  );

  assert.deepEqual(results.map(({ id }) => id), ["resp-006"]);
});

test("encontra respostas pelo nome do cliente e pelo comentário", () => {
  const customerResults = filterResponses(mockResponses, mockSurveys, "MARIANA", "Todos", "Todas");
  const commentResults = filterResponses(mockResponses, mockSurveys, "prazo", "Todos", "Todas");

  assert.deepEqual(customerResults.map(({ id }) => id), ["resp-001"]);
  assert.deepEqual(commentResults.map(({ id }) => id), ["resp-001"]);
});

test("encontra respostas pelo nome da pesquisa", () => {
  const results = filterResponses(mockResponses, mockSurveys, "avaliação do atendimento", "Todos", "Todas");

  assert.deepEqual(results.map(({ id }) => id), ["resp-002", "resp-007"]);
});

test("retorna lista vazia quando nenhum sentimento ou texto corresponde", () => {
  assert.deepEqual(
    filterResponses(mockResponses, mockSurveys, "nada", "Negativo", "Todas"),
    [],
  );
});
