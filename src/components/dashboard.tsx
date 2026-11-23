"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ClipboardList, FileText, LayoutDashboard, LogOut, MessageSquareText, Plus, RefreshCw, Settings } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { ResponseChart } from "@/components/response-chart";
import { ReportsSection } from "@/components/sections/reports-section";
import { ResponsesSection } from "@/components/sections/responses-section";
import { SettingsSection } from "@/components/sections/settings-section";
import { StatusPill, SurveysSection } from "@/components/sections/surveys-section";
import { loadDashboardData, summarizeResults } from "@/lib/dashboard-data";
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
  const requestId = useRef(0);
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  const refresh = useCallback(async () => {
    const currentRequest = ++requestId.current;
    try {
      const result = await loadDashboardData();
      if (currentRequest === requestId.current) {
        setData(result);
        setError("");
      }
    } catch (err) {
      if (currentRequest === requestId.current) setError(err instanceof Error ? err.message : "Não foi possível carregar os dados.");
      throw err;
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, []);

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

  const summary = data ? summarizeResults(data.results) : null;
  return <main className="app-shell" id="visao-geral">
    <aside className="sidebar">
      <Link className="brand" href="#visao-geral" aria-label="Voz do Cliente, início"><span className="brand-mark"><MessageSquareText size={20} /></span><span className="brand-name">voz<span>do</span>cliente</span></Link>
      <div className="workspace-switcher"><span className="workspace-avatar">{organization.charAt(0).toUpperCase()}</span><span className="workspace-copy"><strong>{organization}</strong><small>Espaço de trabalho</small></span></div>
      <p className="nav-heading">Navegação</p>
      <nav className="side-nav" aria-label="Navegação principal">{navItems.map(({ label, icon: Icon }) => <button aria-label={label} aria-current={activeSection === label ? "page" : undefined} className={`nav-link${activeSection === label ? " active" : ""}`} key={label} onClick={() => { setActiveSection(label); if (data && activeSection !== label) void refresh().catch(() => undefined); }} type="button"><Icon size={18} /><span>{label}</span>{label === "Pesquisas" && data && <span className="nav-count">{data.surveys.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom">
        <button aria-current={activeSection === "Configurações" ? "page" : undefined} className={`nav-link${activeSection === "Configurações" ? " active" : ""}`} onClick={() => setActiveSection("Configurações")} type="button"><Settings size={18} /><span>Configurações</span></button>
        <div className="profile"><span className="profile-avatar">{initials}</span><span className="profile-copy"><strong>{name}</strong><small>{email}</small></span></div>
        <form action={signOut}><button className="nav-link" type="submit"><LogOut size={18} /><span>Sair</span></button></form>
      </div>
    </aside>
    <section className="main-panel">
      <header className="topbar"><div className="breadcrumb"><span>{organization}</span><span className="breadcrumb-divider">/</span><strong>{activeSection}</strong></div><div className="topbar-actions"><span className="topbar-avatar">{initials}</span></div></header>
      <div className="content">
        {activeSection === "Configurações" ? <SettingsSection name={name} email={email} organization={organization} /> : <>
          {loading && <p role="status">Carregando dados...</p>}
          {error && <div role="alert" className="auth-error"><p>Não foi possível atualizar os dados: {error}</p><button className="secondary-button" type="button" onClick={() => void refresh().catch(() => undefined)}>Tentar novamente</button></div>}
          {!loading && data && !error && <>
            {activeSection === "Visão geral" && summary && <>
              <section className="welcome-row"><div><p className="eyebrow">Sua visão geral</p><h1>Olá, {name.split(" ")[0]}</h1><p className="welcome-subtitle">Acompanhe o que seus clientes estão dizendo.</p></div><button className="primary-button" onClick={() => setActiveSection("Pesquisas")} type="button"><Plus size={17} /> Nova pesquisa</button></section>
              <section className="metrics-grid" aria-label="Indicadores">
                <article className="metric-card"><span className="metric-label">Total de respostas</span><div className="metric-value">{summary.submissions.length}</div></article>
                <article className="metric-card"><span className="metric-label">Satisfação média</span><div className="metric-value">{summary.average === null ? "—" : summary.average.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}<span className="metric-out-of">/5</span></div></article>
                <article className="metric-card"><span className="metric-label">Pesquisas ativas</span><div className="metric-value">{data.surveys.filter((survey) => survey.status === "active").length}</div></article>
                <article className="metric-card"><span className="metric-label">Total de pesquisas</span><div className="metric-value">{data.surveys.length}</div></article>
              </section>
              <section className="panel chart-panel"><div className="panel-heading"><div><h2>Volume de respostas</h2><p>Acompanhe a participação ao longo do tempo</p></div><span className="period-label">Últimos 7 dias</span></div><div className="chart-summary"><strong>{summary.weekly.reduce((total, day) => total + day.responses, 0)}</strong><small>respostas no período</small></div><ResponseChart data={summary.weekly} /></section>
              <section className="panel surveys-panel"><div className="panel-heading"><div><h2>Suas pesquisas</h2><p>Pesquisas cadastradas</p></div><button className="text-link" type="button" onClick={() => setActiveSection("Pesquisas")}>Ver todas</button></div>
                <div className="table-wrap"><table><thead><tr><th>Pesquisa</th><th>Status</th><th>Respostas</th></tr></thead><tbody>
                  {data.surveys.slice(0, 3).map((survey) => <tr key={survey.id}><td><strong>{survey.title}</strong><small> · {survey.category}</small></td><td><StatusPill status={survey.status} /></td><td>{data.results.find((result) => result.survey.id === survey.id)?.total_responses ?? "—"}</td></tr>)}
                  {data.surveys.length === 0 && <tr><td className="empty-table" colSpan={3}>Nenhuma pesquisa cadastrada.</td></tr>}
                </tbody></table></div>
              </section>
            </>}
            {activeSection === "Pesquisas" && <SurveysSection surveys={data.surveys} results={data.results} refresh={refresh} />}
            {activeSection === "Respostas" && <ResponsesSection results={data.results} />}
            {activeSection === "Relatórios" && <ReportsSection results={data.results} />}
            <button type="button" className="text-link" onClick={() => void refresh().catch(() => undefined)}><RefreshCw size={14} /> Atualizar dados</button>
          </>}
        </>}
      </div>
    </section>
  </main>;
}
