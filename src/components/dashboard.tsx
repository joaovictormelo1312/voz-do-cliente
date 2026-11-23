"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ClipboardList, FileText, LayoutDashboard, LogOut, MessageSquareText, Plus, RefreshCw, Settings } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { DashboardSkeleton, Spinner } from "@/components/loading-indicators";
import { ResponseChart } from "@/components/response-chart";
import { ReportsSection } from "@/components/sections/reports-section";
import { ResponsesSection } from "@/components/sections/responses-section";
import { SettingsSection } from "@/components/sections/settings-section";
import { StatusPill, SurveysSection } from "@/components/sections/surveys-section";
import { useDashboardUpdates } from "@/components/use-dashboard-updates";
import { apiRequest, createDashboardUpdateQueue, loadDashboardData, summarizeResults } from "@/lib/dashboard-data";
import type { Survey, SurveyResult } from "@/lib/types";

const navItems = [
  { label: "Visão geral", icon: LayoutDashboard },
  { label: "Pesquisas", icon: ClipboardList },
  { label: "Respostas", icon: MessageSquareText },
  { label: "Relatórios", icon: FileText },
];

export default function Dashboard({ name, email, organization }: { name: string; email: string; organization: string }) {
  const [activeSection, setActiveSection] = useState("Visão geral");
  const [data, setData] = useState<{ surveys: Survey[]; results: SurveyResult[] } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatesInProgress, setUpdatesInProgress] = useState(0);
  const [enqueueUpdate] = useState(createDashboardUpdateQueue);
  const pendingSurveys = useRef(new Map<string, { dirty: boolean; task: Promise<void> }>());
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  const trackUpdate = useCallback((task: Promise<void>) => {
    setUpdatesInProgress((count) => count + 1);
    return task.finally(() => setUpdatesInProgress((count) => count - 1));
  }, []);

  const refresh = useCallback(() => trackUpdate(enqueueUpdate(async () => {
      try {
        const result = await loadDashboardData();
        setData(result);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível carregar os dados.");
        throw err;
      } finally {
        setLoading(false);
      }
  })), [enqueueUpdate, trackUpdate]);

  const refreshSurvey = useCallback(function refreshSurvey(id: string): Promise<void> {
    const pending = pendingSurveys.current.get(id);
    if (pending) {
      pending.dirty = true;
      return pending.task;
    }
    const entry = { dirty: false, task: Promise.resolve() };
    const task = trackUpdate(enqueueUpdate(async () => {
      const result = await apiRequest<SurveyResult>(`/api/surveys/${id}/results`);
      setData((current) => current && current.results.some((item) => item.survey.id === id)
        ? { ...current, results: current.results.map((item) => item.survey.id === id ? result : item) }
        : current);
    }));
    entry.task = task.then(
      async () => {
        pendingSurveys.current.delete(id);
        if (entry.dirty) await refreshSurvey(id);
      },
      (error: unknown) => {
        pendingSurveys.current.delete(id);
        throw error;
      },
    );
    pendingSurveys.current.set(id, entry);
    return entry.task;
  }, [enqueueUpdate, trackUpdate]);

  useEffect(() => {
    let active = true;
    loadDashboardData().then((result) => {
      if (active) setData(result);
    }).catch((err: unknown) => {
      if (active) setError(err instanceof Error ? err.message : "Não foi possível carregar os dados.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const surveyIds = data ? data.surveys.map((survey) => survey.id).sort().join(",") : null;
  const updateStatus = useDashboardUpdates(surveyIds, refresh, refreshSurvey);
  const summary = data ? summarizeResults(data.results) : null;
  const ratingCount = summary?.distribution.reduce((total, item) => total + item.count, 0) ?? 0;
  return <main className="app-shell" id="visao-geral">
    <aside className="sidebar">
      <Link className="brand" href="#visao-geral" aria-label="Voz do Cliente, início" title="Voz do Cliente" onClick={() => setActiveSection("Visão geral")}><span className="brand-mark"><MessageSquareText size={20} /></span><span className="brand-name">voz<span>do</span>cliente</span></Link>
      <div className="workspace-switcher"><span className="workspace-avatar">{organization.charAt(0).toUpperCase()}</span><span className="workspace-copy"><strong>{organization}</strong><small>Espaço de trabalho</small></span></div>
      <p className="nav-heading">Navegação</p>
      <nav className="side-nav" aria-label="Navegação principal">{navItems.map(({ label, icon: Icon }) => <button aria-label={label} title={label} aria-current={activeSection === label ? "page" : undefined} className={`nav-link${activeSection === label ? " active" : ""}`} key={label} onClick={() => { setActiveSection(label); if (data && activeSection !== label) void refresh().catch(() => undefined); }} type="button"><Icon size={18} /><span>{label}</span>{label === "Pesquisas" && data && <span className="nav-count">{data.surveys.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom">
        <button aria-label="Configurações" title="Configurações" aria-current={activeSection === "Configurações" ? "page" : undefined} className={`nav-link${activeSection === "Configurações" ? " active" : ""}`} onClick={() => setActiveSection("Configurações")} type="button"><Settings size={18} /><span>Configurações</span></button>
        <div className="profile" title={name}><span className="profile-avatar">{initials}</span><span className="profile-copy"><strong>{name}</strong><small>{email}</small></span></div>
        <form action={signOut}><button className="nav-link" type="submit" aria-label="Sair" title="Sair"><LogOut size={18} /><span>Sair</span></button></form>
      </div>
    </aside>
    <section className="main-panel">
      <header className="topbar"><div className="breadcrumb"><span>{organization}</span><span className="breadcrumb-divider">/</span><strong>{activeSection}</strong></div><div className="topbar-actions"><span className="topbar-avatar">{initials}</span></div></header>
      <div className="content">
        {updateStatus === "retrying" && <p className="settings-demo-note" role="status">Atualizações automáticas indisponíveis. O sistema tentará novamente em até um minuto.</p>}
        {activeSection === "Configurações" ? <SettingsSection name={name} email={email} organization={organization} /> : <>
          {!data && (loading || updatesInProgress > 0) && <DashboardSkeleton />}
          {data && updatesInProgress > 0 && <p className="updating-indicator" role="status"><Spinner /> Atualizando dados...</p>}
          {error && <div role="alert" className="auth-error"><p>Não foi possível atualizar os dados: {error}{data && " Os dados exibidos podem estar desatualizados."}</p><button className="secondary-button" type="button" disabled={updatesInProgress > 0} onClick={() => void refresh().catch(() => undefined)}>Tentar novamente</button></div>}
          {data && <>
            {activeSection === "Visão geral" && summary && <>
              <section className="welcome-row"><div><p className="eyebrow">Visão geral</p><h1>Olá, {name.split(" ")[0]}</h1><p className="welcome-subtitle">Acompanhe a experiência dos seus clientes.</p></div><button className="primary-button" onClick={() => setActiveSection("Pesquisas")} type="button"><Plus size={17} /> Nova pesquisa</button></section>
              <section className="overview-hero" aria-label="Resumo de respostas">
                <article className="panel overview-total">
                  <p className="eyebrow">Respostas recebidas</p>
                  <div><span className="overview-total-value">{summary.submissions.length}</span><p>respostas em todas as pesquisas</p></div>
                  <button className="text-link" type="button" onClick={() => setActiveSection("Respostas")}>Ver respostas <span aria-hidden="true">↗</span></button>
                </article>
                <article className="panel chart-panel"><div className="panel-heading"><div><p className="eyebrow">Participação ao longo do tempo</p><h2>Volume de respostas</h2></div><span className="period-label">Últimos 7 dias</span></div><div className="chart-summary"><strong>{summary.weekly.reduce((total, day) => total + day.responses, 0)}</strong><small>respostas no período</small></div><ResponseChart data={summary.weekly} /></article>
              </section>
              <section className="metrics-grid" aria-label="Indicadores">
                <article className="metric-card"><span className="metric-label">Satisfação média</span><div className="metric-value">{summary.average === null ? "—" : summary.average.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}<span className="metric-out-of">/5</span></div></article>
                <article className="metric-card"><span className="metric-label">Avaliações 4 e 5</span><div className="metric-value metric-positive">{summary.positivePercent === null ? "—" : `${summary.positivePercent}%`}</div></article>
                <article className="metric-card"><span className="metric-label">Pesquisas ativas</span><div className="metric-value">{data.surveys.filter((survey) => survey.status === "active").length}</div></article>
                <article className="metric-card"><span className="metric-label">Total de pesquisas</span><div className="metric-value">{data.surveys.length}</div></article>
              </section>
              <section className="overview-detail">
                <div className="overview-detail-main">
                  <article className="panel overview-ratings">
                    <div className="panel-heading"><div><p className="eyebrow">Avaliações recebidas</p><h2>Distribuição das notas</h2></div><button className="text-link" type="button" onClick={() => setActiveSection("Relatórios")}>Ver relatório</button></div>
                    <div className="rating-bars">{summary.distribution.map((item) => {
                      const percent = ratingCount ? Math.round(item.count * 100 / ratingCount) : 0;
                      return <div className="rating-bar-row" key={item.rating}><span>{item.rating} estrelas</span><span className="rating-track"><i style={{ width: `${percent}%` }} /></span><strong>{item.count}</strong><small>{percent}%</small></div>;
                    })}</div>
                  </article>
                  <article className="panel surveys-panel"><div className="panel-heading"><div><p className="eyebrow">Suas pesquisas</p><h2>Pesquisas cadastradas</h2></div><button className="text-link" type="button" onClick={() => setActiveSection("Pesquisas")}>Ver todas</button></div>
                    <div className="table-wrap"><table><thead><tr><th>Pesquisa</th><th>Status</th><th>Respostas</th></tr></thead><tbody>
                      {data.surveys.slice(0, 3).map((survey) => <tr key={survey.id}><td><strong>{survey.title}</strong><small> · {survey.category}</small></td><td><StatusPill status={survey.status} /></td><td>{data.results.find((result) => result.survey.id === survey.id)?.total_responses ?? "—"}</td></tr>)}
                      {data.surveys.length === 0 && <tr><td className="empty-table" colSpan={3}>Nenhuma pesquisa cadastrada.</td></tr>}
                    </tbody></table></div>
                  </article>
                </div>
                <article className="panel overview-recent">
                  <div className="panel-heading"><div><p className="eyebrow">Voz do cliente</p><h2>Respostas recentes</h2></div><button className="text-link" type="button" onClick={() => setActiveSection("Respostas")}>Ver todas</button></div>
                  {summary.submissions.slice(0, 5).map((submission) => {
                    const rating = submission.answers.find((answer) => answer.rating !== null);
                    const comment = submission.answers.find((answer) => answer.text_value);
                    const ratingTone = rating?.rating !== null && rating?.rating !== undefined
                      ? rating.rating >= 4 ? "positive" : rating.rating <= 2 ? "negative" : ""
                      : "";
                    return <div className="overview-response" key={submission.id}><div className="overview-response-meta"><span>{submission.survey.title}</span><time dateTime={submission.submitted_at}>{new Date(submission.submitted_at).toLocaleDateString("pt-BR")}</time></div><p>{comment?.text_value ?? "Sem comentário"}</p>{rating && <strong className={ratingTone}>{rating.rating} / 5</strong>}</div>;
                  })}
                  {summary.submissions.length === 0 && <div className="empty-state"><strong>Nenhuma resposta ainda</strong><span>As respostas mais recentes aparecerão aqui.</span></div>}
                </article>
              </section>
            </>}
            {activeSection === "Pesquisas" && <SurveysSection surveys={data.surveys} results={data.results} refresh={refresh} />}
            {activeSection === "Respostas" && <ResponsesSection results={data.results} />}
            {activeSection === "Relatórios" && <ReportsSection results={data.results} />}
            <button type="button" className="text-link" disabled={updatesInProgress > 0} onClick={() => void refresh().catch(() => undefined)}><RefreshCw size={14} className={updatesInProgress > 0 ? "refresh-icon-spinning" : undefined} /> Atualizar dados</button>
          </>}
        </>}
      </div>
    </section>
  </main>;
}
