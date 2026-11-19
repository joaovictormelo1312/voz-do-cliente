"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, Star } from "lucide-react";
import {
  mockAverageScore,
  mockPositiveRatingPercent,
  mockResponses,
  mockSurveys,
  mockTotalResponses,
  mockWeeklyGrowthPercent,
  FeedbackSentiment,
} from "@/lib/mock-data";

type SentimentFilter = "Todos" | FeedbackSentiment;

export function ResponsesSection() {
  const [query, setQuery] = useState("");
  const [sentiment, setSentiment] = useState<SentimentFilter>("Todos");
  const [surveyId, setSurveyId] = useState("Todas");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredResponses = useMemo(
    () =>
      mockResponses.filter((response) => {
        const surveyName = mockSurveys.find((survey) => survey.id === response.surveyId)?.name ?? "";
        const matchesText = `${response.customer} ${response.comment} ${surveyName}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchesText
          && (sentiment === "Todos" || response.sentiment === sentiment)
          && (surveyId === "Todas" || response.surveyId === surveyId);
      }),
    [query, sentiment, surveyId],
  );
  return (
    <section className="section-view">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Voz do cliente</p>
          <h1>Respostas</h1>
          <p className="section-description">Leia os comentários e acompanhe as avaliações recebidas.</p>
        </div>
      </div>

      <div className="section-stats response-stats">
        <article className="mini-stat"><span>Total de respostas</span><strong>{mockTotalResponses.toLocaleString("pt-BR")}</strong><small className="trend positive">+{mockWeeklyGrowthPercent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% na semana</small></article>
        <article className="mini-stat"><span>Nota média</span><strong>{mockAverageScore.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} <small>/ 5</small></strong><small>Média das avaliações</small></article>
        <article className="mini-stat"><span>Avaliações 4 e 5</span><strong>{mockPositiveRatingPercent}%</strong><small>Do total de avaliações</small></article>
      </div>

      <div className="panel section-panel">
        <div className="section-toolbar response-toolbar">
          <div className="filter-tabs" role="group" aria-label="Filtrar por sentimento">
            {(["Todos", "Positivo", "Neutro", "Negativo"] as SentimentFilter[]).map((item) => (
              <button aria-pressed={sentiment === item} className={`filter-tab${sentiment === item ? " selected" : ""}`} key={item} onClick={() => setSentiment(item)}>{item}</button>
            ))}
          </div>
          <div className="toolbar-filters">
            <label className="section-search">
              <Search size={16} />
              <input aria-label="Buscar resposta" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar comentário..." value={query} />
            </label>
            <label className="select-wrap">
              <select aria-label="Filtrar pela pesquisa" onChange={(event) => setSurveyId(event.target.value)} value={surveyId}>
                <option value="Todas">Todas as pesquisas</option>
                {mockSurveys.map((survey) => <option key={survey.id} value={survey.id}>{survey.name}</option>)}
              </select>
              <ChevronDown size={14} />
            </label>
          </div>
        </div>
        <div className="response-list">
          {filteredResponses.map((response) => {
            const survey = mockSurveys.find((item) => item.id === response.surveyId);
            return (
              <article className="response-card" key={response.id}>
                <span className="response-avatar">{response.initials}</span>
                <div className="response-main">
                  <div className="response-meta">
                    <strong>{response.customer}</strong>
                    <span className={`sentiment-tag ${response.sentiment.toLowerCase()}`}>{response.sentiment}</span>
                    <span className="response-date">{response.date}</span>
                  </div>
                  <p className="response-survey">{survey?.name ?? "Pesquisa"}</p>
                  <p className="response-comment">{response.comment}</p>
                  {selectedId === response.id && (
                    <div className="response-detail">
                      <span>Resposta recebida em {response.date}</span>
                    </div>
                  )}
                </div>
                <div className="response-rating" aria-label={`Nota ${response.score} de 5`}>
                  <Star size={15} fill="currentColor" />
                  <strong>{response.score}</strong><span>/5</span>
                </div>
                <button aria-expanded={selectedId === response.id} className="response-detail-button" onClick={() => setSelectedId(selectedId === response.id ? null : response.id)}>
                  {selectedId === response.id ? "Fechar" : "Detalhes"}
                </button>
              </article>
            );
          })}
          {filteredResponses.length === 0 && <div className="empty-state"><Search size={22} /><strong>Nenhuma resposta encontrada</strong><span>Tente mudar os filtros ou o termo buscado.</span></div>}
        </div>
        <div className="table-pagination"><span>Mostrando {filteredResponses.length} de {mockResponses.length} respostas recentes</span></div>
      </div>
    </section>
  );
}
