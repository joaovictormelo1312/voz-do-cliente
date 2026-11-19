"use client";

import { ArrowDownToLine, ArrowUpRight, Sparkles } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  mockAverageScore,
  mockAverageCompletion,
  mockPositiveRatingPercent,
  mockRatingDistribution,
  mockWeeklyGrowthPercent,
  mockWeeklyResponseTotal,
  mockWeeklyResponses,
} from "@/lib/mock-data";
import { ResponseChart } from "@/components/response-chart";

export function ReportsSection() {
  const period = "Últimos 7 dias";

  return (
    <section className="section-view">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Análise da experiência</p>
          <h1>Relatórios</h1>
          <p className="section-description">Indicadores consolidados para entender a satisfação dos clientes.</p>
        </div>
        <button className="secondary-button" onClick={() => window.print()}><ArrowDownToLine size={15} /> Imprimir relatório</button>
      </div>

      <div className="report-controls">
        <span className="period-label">{period}</span>
      </div>

      <div className="report-metrics">
        <ReportMetric label="Respostas no período" value={mockWeeklyResponseTotal.toLocaleString("pt-BR")} detail={`+${mockWeeklyGrowthPercent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% vs. período anterior`} />
        <ReportMetric label="Satisfação média" value={`${mockAverageScore.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} / 5`} detail="Média das avaliações" />
        <ReportMetric label="Conclusão média" value={`${mockAverageCompletion}%`} detail="Nas pesquisas ativas" />
        <ReportMetric label="Avaliações 4 e 5" value={`${mockPositiveRatingPercent}%`} detail="Do total de avaliações" />
      </div>

      <div className="report-grid">
        <article className="panel report-chart-panel">
          <div className="panel-heading">
            <div><h2>Respostas recebidas</h2><p>{period} · comparação com período anterior</p></div>
            <span className="report-legend"><i /> Atual <i className="previous-dot" /> Anterior</span>
          </div>
          <div className="report-chart" role="img" aria-label="Gráfico de barras comparando as respostas recebidas em cada dia com o período anterior">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockWeeklyResponses} barGap={5} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#e4efec" strokeDasharray="4 5" vertical={false} />
                <XAxis axisLine={false} tickLine={false} tick={{ fill: "#607876", fontSize: 11 }} dataKey="day" dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#607876", fontSize: 11 }} />
                <Tooltip contentStyle={{ border: "1px solid #dce8e4", borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="responses" name="Atual" fill="#0f766e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="previous" name="Anterior" fill="#a9c5bf" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel rating-panel">
          <div className="panel-heading"><div><h2>Distribuição das avaliações</h2><p>Notas recebidas nas pesquisas</p></div></div>
          <div className="rating-bars">
            {mockRatingDistribution.map((item) => (
              <div className="rating-bar-row" key={item.rating}>
                <span>{item.rating}</span>
                <span className="rating-track"><i style={{ width: `${item.percent}%` }} /></span>
                <strong>{item.count}</strong>
                <small>{item.percent}%</small>
              </div>
            ))}
          </div>
          <div className="rating-summary"><span>Média geral</span><strong>★ {mockAverageScore.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} <small>/ 5</small></strong></div>
        </article>
      </div>

      <article className="panel trend-report">
        <div className="panel-heading"><div><h2>Evolução de respostas</h2><p>Volume diário recebido na última semana</p></div><span className="trend positive"><ArrowUpRight size={14} /> {mockWeeklyGrowthPercent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span></div>
        <div className="report-line-chart"><ResponseChart /></div>
      </article>

      <div className="report-insight"><span><Sparkles size={17} /></span><div><strong>Uma experiência bem avaliada</strong><p>{mockPositiveRatingPercent}% das avaliações são positivas, com média geral de {mockAverageScore.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} em 5.</p></div></div>
    </section>
  );
}

function ReportMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="mini-stat report-metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}
