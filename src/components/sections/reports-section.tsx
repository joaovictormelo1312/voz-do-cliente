"use client";

import { ArrowDownToLine } from "lucide-react";
import { ResponseChart } from "@/components/response-chart";
import { summarizeResults } from "@/lib/dashboard-data";
import type { SurveyResult } from "@/lib/types";

export function ReportsSection({ results }: { results: SurveyResult[] }) {
  const { submissions, average, distribution, positivePercent, weekly } = summarizeResults(results);
  const count = distribution.reduce((total, item) => total + item.count, 0);
  return <section className="section-view">
    <div className="section-title-row"><div><p className="eyebrow">Análise da experiência</p><h1>Relatórios</h1><p className="section-description">Indicadores de todas as respostas recebidas.</p></div><button className="secondary-button" type="button" onClick={() => window.print()}><ArrowDownToLine size={15} /> Imprimir relatório</button></div>
    <div className="report-metrics">
      <article className="mini-stat report-metric"><span>Respostas</span><strong>{submissions.length}</strong></article>
      <article className="mini-stat report-metric"><span>Satisfação média</span><strong>{average === null ? "—" : `${average.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} / 5`}</strong></article>
      <article className="mini-stat report-metric"><span>Avaliações 4 e 5</span><strong>{positivePercent === null ? "—" : `${positivePercent}%`}</strong></article>
    </div>
    <article className="panel rating-panel">
      <div className="panel-heading"><div><h2>Distribuição das avaliações</h2><p>Notas recebidas nas pesquisas</p></div></div>
      <div className="rating-bars">{distribution.map((item) => {
        const percent = count ? Math.round(item.count * 100 / count) : 0;
        return <div className="rating-bar-row" key={item.rating}><span>{item.rating} estrelas</span><span className="rating-track"><i style={{ width: `${percent}%` }} /></span><strong>{item.count}</strong><small>{percent}%</small></div>;
      })}</div>
    </article>
    <article className="panel trend-report"><div className="panel-heading"><div><h2>Evolução de respostas</h2><p>Volume diário recebido nos últimos 7 dias</p></div></div><div className="report-line-chart"><ResponseChart data={weekly} /></div></article>
  </section>;
}
