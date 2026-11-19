"use client";

import {
  ArrowUpRight,
  ArrowUpRightFromSquare,
  ClipboardList,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  Plus,
  Quote,
  Settings,
  Sparkles,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ResponseChart } from "@/components/response-chart";
import { ReportsSection } from "@/components/sections/reports-section";
import { ResponsesSection } from "@/components/sections/responses-section";
import { SettingsSection } from "@/components/sections/settings-section";
import { StatusPill } from "@/components/sections/surveys-section";
import { SurveysSection } from "@/components/sections/surveys-section";
import {
  mockActiveSurveys,
  mockAverageScore,
  mockAverageCompletion,
  mockSurveys,
  mockTotalResponses,
  mockWeeklyGrowthPercent,
  mockWeeklyResponseTotal,
} from "@/lib/mock-data";

const navItems = [
  { label: "Visão geral", icon: LayoutDashboard },
  { label: "Pesquisas", icon: ClipboardList, count: String(mockSurveys.length) },
  { label: "Respostas", icon: MessageSquareText },
  { label: "Relatórios", icon: FileText },
];

export default function Home() {
  const [activeSection, setActiveSection] = useState("Visão geral");

  return (
    <main className="app-shell" id="visao-geral">
      <aside className="sidebar">
        <Link className="brand" href="#visao-geral" aria-label="Voz do Cliente, início">
          <span className="brand-mark">
            <MessageSquareText size={20} strokeWidth={2.2} />
          </span>
          <span className="brand-name">
            voz<span>do</span>cliente
          </span>
        </Link>

        <div className="workspace-switcher">
          <span className="workspace-avatar">M</span>
          <span className="workspace-copy">
            <strong>Minha empresa</strong>
            <small>Espaço de trabalho</small>
          </span>
        </div>

        <p className="nav-heading">Navegação</p>
        <nav className="side-nav" aria-label="Navegação principal">
          {navItems.map(({ label, icon: Icon, count }) => (
            <button
              aria-current={activeSection === label ? "page" : undefined}
              aria-label={label}
              className={`nav-link${activeSection === label ? " active" : ""}`}
              key={label}
              onClick={() => setActiveSection(label)}
              type="button"
            >
              <Icon size={18} />
              <span>{label}</span>
              {count && <span className="nav-count">{count}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button aria-current={activeSection === "Configurações" ? "page" : undefined} aria-label="Configurações" className={`nav-link${activeSection === "Configurações" ? " active" : ""}`} onClick={() => setActiveSection("Configurações")} type="button">
            <Settings size={18} />
            <span>Configurações</span>
          </button>
          <div className="profile">
            <span className="profile-avatar">CA</span>
            <span className="profile-copy">
              <strong>Camila Andrade</strong>
              <small>Administradora</small>
            </span>
          </div>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Minha empresa</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{activeSection}</strong>
          </div>
          <div className="topbar-actions">
            <span className="topbar-avatar">CA</span>
          </div>
        </header>

        <div className="content">
          {activeSection === "Visão geral" ? (
            <>
          <section className="welcome-row">
            <div>
              <p className="eyebrow">Sua visão geral</p>
              <h1>Bom dia, Camila</h1>
              <p className="welcome-subtitle">Acompanhe o que seus clientes estão dizendo.</p>
            </div>
            <button className="primary-button" onClick={() => setActiveSection("Pesquisas")} type="button">
              <Plus size={17} />
              Nova pesquisa
            </button>
          </section>

          <section className="metrics-grid" aria-label="Indicadores">
            <article className="metric-card">
              <div className="metric-top">
                <span className="metric-label">Total de respostas</span>
                <span className="metric-icon purple"><MessageSquareText size={18} /></span>
              </div>
              <div className="metric-value">{mockTotalResponses.toLocaleString("pt-BR")}</div>
              <div className="metric-foot">
                <span className="trend positive"><ArrowUpRight size={14} /> {mockWeeklyGrowthPercent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span>
                <span>vs. semana anterior</span>
              </div>
            </article>
            <article className="metric-card">
              <div className="metric-top">
                <span className="metric-label">Satisfação média</span>
                <span className="metric-icon yellow"><Sparkles size={18} /></span>
              </div>
              <div className="metric-value">{mockAverageScore.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}<span className="metric-out-of">/5</span></div>
              <div className="metric-foot">
                <span>Média geral das avaliações</span>
              </div>
            </article>
            <article className="metric-card">
              <div className="metric-top">
                <span className="metric-label">Conclusão média</span>
                <span className="metric-icon green"><UsersRound size={18} /></span>
              </div>
              <div className="metric-value">{mockAverageCompletion}<span className="metric-out-of">%</span></div>
              <div className="metric-foot">
                <span>Nas pesquisas ativas</span>
              </div>
            </article>
            <article className="metric-card">
              <div className="metric-top">
                <span className="metric-label">Pesquisas ativas</span>
                <span className="metric-icon blue"><ClipboardList size={18} /></span>
              </div>
              <div className="metric-value">{String(mockActiveSurveys).padStart(2, "0")}</div>
              <div className="metric-foot">
                <span>Em andamento</span>
              </div>
            </article>
          </section>

          <section className="dashboard-grid">
            <article className="panel chart-panel" id="respostas">
              <div className="panel-heading">
                <div>
                  <h2>Volume de respostas</h2>
                  <p>Acompanhe a participação ao longo do tempo</p>
                </div>
                <span className="period-label">Últimos 7 dias</span>
              </div>
              <div className="chart-summary">
                <strong>{mockWeeklyResponseTotal.toLocaleString("pt-BR")}</strong>
                <span className="trend positive"><ArrowUpRight size={14} /> {mockWeeklyGrowthPercent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span>
                <small>vs. período anterior</small>
              </div>
              <ResponseChart />
            </article>

            <article className="panel voice-panel">
              <div className="panel-heading">
                <div>
                  <h2>Uma resposta em destaque</h2>
                  <p>Experiência de compra</p>
                </div>
                <Quote className="quote-icon" size={19} aria-hidden="true" />
              </div>
              <blockquote className="featured-quote">
                “A compra foi muito simples e chegou antes do prazo. Adorei a experiência!”
              </blockquote>
              <div className="featured-response">
                <span className="featured-avatar">MC</span>
                <span><strong>Mariana Costa</strong><small>Hoje, às 08:42</small></span>
                <span className="score">★ <strong>5,0</strong></span>
              </div>
            </article>
          </section>

          <section className="panel surveys-panel" id="pesquisas">
            <div className="panel-heading surveys-heading">
              <div>
                <h2>Suas pesquisas</h2>
                <p>Veja o desempenho das pesquisas recentes</p>
              </div>
              <button className="text-link" onClick={() => setActiveSection("Pesquisas")} type="button">Ver todas <ArrowUpRightFromSquare size={14} /></button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Pesquisa</th>
                    <th>Status</th>
                    <th>Respostas</th>
                    <th>Conclusão</th>
                    <th>Nota média</th>
                    <th aria-label="Ações" />
                  </tr>
                </thead>
                <tbody>
                  {mockSurveys.slice(0, 3).map((survey) => (
                    <tr key={survey.id}>
                      <td>
                        <div className="survey-name-cell">
                          <span className={`survey-avatar ${survey.color}`}>{survey.initials}</span>
                          <span><strong>{survey.name}</strong><small>{survey.category}</small></span>
                        </div>
                      </td>
                      <td><StatusPill status={survey.status} /></td>
                      <td className="table-number">{survey.responses}</td>
                      <td>
                        <div className="completion-cell"><span className="completion-track"><i style={{ width: `${survey.completion}%` }} /></span><span>{survey.completion}%</span></div>
                      </td>
                      <td><span className="score">★ <strong>{survey.score?.toFixed(1).replace(".", ",") ?? "—"}</strong></span></td>
                      <td />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="page-footer">
            <span>Voz do Cliente</span>
            <span>Experiência do cliente, de ponta a ponta</span>
          </footer>
            </>
          ) : activeSection === "Pesquisas" ? (
            <SurveysSection />
          ) : activeSection === "Respostas" ? (
            <ResponsesSection />
          ) : activeSection === "Relatórios" ? (
            <ReportsSection />
          ) : (
            <SettingsSection />
          )}
        </div>
      </section>
    </main>
  );
}
