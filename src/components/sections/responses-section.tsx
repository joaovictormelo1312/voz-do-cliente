"use client";

import { useState } from "react";
import { summarizeResults } from "@/lib/dashboard-data";
import type { SurveyResult } from "@/lib/types";

export function ResponsesSection({ results }: { results: SurveyResult[] }) {
  const [query, setQuery] = useState("");
  const [surveyId, setSurveyId] = useState("all");
  const { submissions } = summarizeResults(results);
  const filtered = submissions.filter((submission) =>
    (surveyId === "all" || submission.survey.id === surveyId) &&
    `${submission.survey.title} ${submission.answers.map((answer) => answer.text_value ?? "").join(" ")}`
      .toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")),
  );
  return <section className="section-view">
    <div className="section-title-row"><div><p className="eyebrow">Voz do cliente</p><h1>Respostas</h1><p className="section-description">Respostas anônimas recebidas nas suas pesquisas.</p></div></div>
    <div className="panel section-panel">
      <div className="section-toolbar">
        <label className="section-search"><input aria-label="Buscar resposta" placeholder="Buscar comentário ou pesquisa..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="select-wrap"><select aria-label="Filtrar pela pesquisa" value={surveyId} onChange={(event) => setSurveyId(event.target.value)}><option value="all">Todas as pesquisas</option>{results.map(({ survey }) => <option key={survey.id} value={survey.id}>{survey.title}</option>)}</select></label>
      </div>
      <div className="response-list">{filtered.map((submission) => <article className="response-card" key={submission.id}>
        <div className="response-main"><div className="response-meta"><strong>{submission.survey.title}</strong><span className="response-date">{new Date(submission.submitted_at).toLocaleString("pt-BR")}</span></div>
          {submission.answers.map((answer) => {
            const question = submission.questions.find((item) => item.question.id === answer.question_id)?.question;
            const value = answer.rating !== null ? `${answer.rating} / 5` : answer.text_value ?? question?.options.find((option) => option.id === answer.option_id)?.label ?? "Opção indisponível";
            return <p className="response-comment" key={answer.id}><strong>{question?.title ?? "Pergunta indisponível"}:</strong> {value}</p>;
          })}
        </div>
      </article>)}
      {filtered.length === 0 && <div className="empty-state"><strong>Nenhuma resposta encontrada</strong><span>As respostas recebidas aparecerão aqui.</span></div>}</div>
      <div className="table-pagination">Exibindo {filtered.length} de {submissions.length} respostas</div>
    </div>
  </section>;
}
