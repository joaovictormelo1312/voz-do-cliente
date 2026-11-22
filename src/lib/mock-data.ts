export type SurveyStatus = "Ativa" | "Rascunho" | "Encerrada";
export type FeedbackSentiment = "Positivo" | "Neutro" | "Negativo";
export type SurveyStatusFilter = "Todas" | SurveyStatus;
export type ResponseSentimentFilter = "Todos" | FeedbackSentiment;

export type MockSurvey = {
  id: string;
  name: string;
  category: string;
  responses: number;
  completion: number;
  score: number | null;
  status: SurveyStatus;
  color: "mint" | "lavender" | "peach" | "blue";
  initials: string;
  createdAt: string;
  lastResponse: string;
};

export const mockSurveys: MockSurvey[] = [
  {
    id: "experiencia-compra",
    name: "Experiência de compra",
    category: "Pós-venda",
    responses: 248,
    completion: 68,
    score: 4.8,
    status: "Ativa",
    color: "mint",
    initials: "EC",
    createdAt: "04 nov, 2026",
    lastResponse: "Hoje, 08:42",
  },
  {
    id: "avaliacao-atendimento",
    name: "Avaliação do atendimento",
    category: "Suporte",
    responses: 186,
    completion: 74,
    score: 4.6,
    status: "Ativa",
    color: "lavender",
    initials: "AT",
    createdAt: "28 out, 2026",
    lastResponse: "Hoje, 08:15",
  },
  {
    id: "satisfacao-nps",
    name: "Pesquisa de satisfação NPS",
    category: "Relacionamento",
    responses: 94,
    completion: 52,
    score: 4.2,
    status: "Ativa",
    color: "peach",
    initials: "PS",
    createdAt: "07 nov, 2026",
    lastResponse: "07 nov, 11:10",
  },
  {
    id: "experiencia-entrega",
    name: "Experiência com a entrega",
    category: "Logística",
    responses: 312,
    completion: 81,
    score: 4.9,
    status: "Ativa",
    color: "blue",
    initials: "EE",
    createdAt: "15 out, 2026",
    lastResponse: "Ontem, 17:26",
  },
  {
    id: "onboarding",
    name: "Primeiros passos na plataforma",
    category: "Onboarding",
    responses: 0,
    completion: 0,
    score: null,
    status: "Encerrada",
    color: "peach",
    initials: "PP",
    createdAt: "02 out, 2026",
    lastResponse: "—",
  },
  {
    id: "avaliacao-produto",
    name: "Avaliação do produto",
    category: "Produto",
    responses: 167,
    completion: 63,
    score: 4.5,
    status: "Ativa",
    color: "mint",
    initials: "AP",
    createdAt: "21 set, 2026",
    lastResponse: "Ontem, 16:04",
  },
  {
    id: "pesquisa-fidelidade",
    name: "Pesquisa de fidelidade",
    category: "Relacionamento",
    responses: 0,
    completion: 0,
    score: null,
    status: "Rascunho",
    color: "lavender",
    initials: "PF",
    createdAt: "12 nov, 2026",
    lastResponse: "—",
  },
];

export const mockTotalResponses = mockSurveys.reduce(
  (total, survey) => total + survey.responses,
  0,
);

export const mockActiveSurveys = mockSurveys.filter(
  (survey) => survey.status === "Ativa",
).length;

export const mockAverageCompletion = Math.round(
  mockSurveys
    .filter((survey) => survey.status === "Ativa")
    .reduce((total, survey) => total + survey.completion, 0) / mockActiveSurveys,
);

export type MockResponse = {
  id: string;
  customer: string;
  initials: string;
  surveyId: string;
  date: string;
  score: number;
  sentiment: FeedbackSentiment;
  comment: string;
};

export function filterSurveys(
  surveys: MockSurvey[],
  query: string,
  statusFilter: SurveyStatusFilter,
): MockSurvey[] {
  const normalizedQuery = query.toLowerCase();

  return surveys.filter((survey) => {
    const matchesQuery = `${survey.name} ${survey.category}`
      .toLowerCase()
      .includes(normalizedQuery);
    return matchesQuery && (statusFilter === "Todas" || survey.status === statusFilter);
  });
}

export const mockResponses: MockResponse[] = [
  {
    id: "resp-001",
    customer: "Mariana Costa",
    initials: "MC",
    surveyId: "experiencia-compra",
    date: "09 nov, 08:42",
    score: 5,
    sentiment: "Positivo",
    comment: "A compra foi muito simples e chegou antes do prazo. Adorei a experiência!",
  },
  {
    id: "resp-002",
    customer: "Rafael Mendes",
    initials: "RM",
    surveyId: "avaliacao-atendimento",
    date: "09 nov, 08:15",
    score: 4,
    sentiment: "Positivo",
    comment: "Atendimento atencioso e resolveu minha dúvida. O retorno poderia ser um pouco mais rápido.",
  },
  {
    id: "resp-003",
    customer: "Beatriz Oliveira",
    initials: "BO",
    surveyId: "experiencia-entrega",
    date: "08 nov, 17:26",
    score: 3,
    sentiment: "Neutro",
    comment: "O produto é ótimo, mas não consegui acompanhar a entrega pelo link.",
  },
  {
    id: "resp-004",
    customer: "Lucas Ferreira",
    initials: "LF",
    surveyId: "avaliacao-produto",
    date: "08 nov, 16:04",
    score: 2,
    sentiment: "Negativo",
    comment: "O produto não correspondeu totalmente ao que eu esperava pelas fotos.",
  },
  {
    id: "resp-005",
    customer: "Ana Paula Ribeiro",
    initials: "AR",
    surveyId: "experiencia-compra",
    date: "08 nov, 14:32",
    score: 5,
    sentiment: "Positivo",
    comment: "Tudo perfeito, desde a escolha até a entrega. Voltarei a comprar!",
  },
  {
    id: "resp-006",
    customer: "Pedro Henrique",
    initials: "PH",
    surveyId: "experiencia-entrega",
    date: "08 nov, 11:09",
    score: 4,
    sentiment: "Positivo",
    comment: "Entrega rápida e embalagem muito bem cuidada.",
  },
  {
    id: "resp-007",
    customer: "Juliana Martins",
    initials: "JM",
    surveyId: "avaliacao-atendimento",
    date: "07 nov, 18:51",
    score: 3,
    sentiment: "Neutro",
    comment: "Consegui resolver, mas precisei explicar a situação mais de uma vez.",
  },
  {
    id: "resp-008",
    customer: "Thiago Almeida",
    initials: "TA",
    surveyId: "avaliacao-produto",
    date: "07 nov, 15:18",
    score: 1,
    sentiment: "Negativo",
    comment: "Tive um problema com o produto e ainda aguardo uma solução.",
  },
];

export function filterResponses(
  responses: MockResponse[],
  surveys: MockSurvey[],
  query: string,
  sentimentFilter: ResponseSentimentFilter,
  surveyIdFilter: string,
): MockResponse[] {
  const normalizedQuery = query.toLowerCase();

  return responses.filter((response) => {
    const surveyName = surveys.find((survey) => survey.id === response.surveyId)?.name ?? "";
    const matchesText = `${response.customer} ${response.comment} ${surveyName}`
      .toLowerCase()
      .includes(normalizedQuery);
    return matchesText
      && (sentimentFilter === "Todos" || response.sentiment === sentimentFilter)
      && (surveyIdFilter === "Todas" || response.surveyId === surveyIdFilter);
  });
}

export const mockWeeklyResponses = [
  { day: "Ter", responses: 28, previous: 20 },
  { day: "Qua", responses: 46, previous: 37 },
  { day: "Qui", responses: 36, previous: 42 },
  { day: "Sex", responses: 55, previous: 43 },
  { day: "Sáb", responses: 48, previous: 49 },
  { day: "Dom", responses: 72, previous: 55 },
  { day: "Seg", responses: 63, previous: 55 },
];

export const mockRatingDistribution = [
  { rating: "5 estrelas", count: 760, percent: 75 },
  { rating: "4 estrelas", count: 190, percent: 19 },
  { rating: "3 estrelas", count: 40, percent: 4 },
  { rating: "2 estrelas", count: 10, percent: 1 },
  { rating: "1 estrela", count: 7, percent: 1 },
];

export const mockAverageScore =
  mockSurveys.reduce(
    (total, survey) => total + survey.responses * (survey.score ?? 0),
    0,
  ) / mockTotalResponses;

export const mockPositiveRatingPercent = mockRatingDistribution
  .slice(0, 2)
  .reduce((total, rating) => total + rating.percent, 0);

export const mockWeeklyResponseTotal = mockWeeklyResponses.reduce(
  (total, day) => total + day.responses,
  0,
);

export const mockPreviousWeekResponseTotal = mockWeeklyResponses.reduce(
  (total, day) => total + day.previous,
  0,
);

export const mockWeeklyGrowthPercent =
  ((mockWeeklyResponseTotal - mockPreviousWeekResponseTotal) /
    mockPreviousWeekResponseTotal) *
  100;
