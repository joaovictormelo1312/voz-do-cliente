"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  Plus,
  Search,
  X,
  ListChecks,
  CheckCircle2,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import {
  MockSurvey,
  mockActiveSurveys,
  mockAverageCompletion,
  mockSurveys,
  mockTotalResponses,
  SurveyStatus,
} from "@/lib/mock-data";

type StatusFilter = "Todas" | SurveyStatus;

export function SurveysSection() {
  const [surveys, setSurveys] = useState(mockSurveys);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Todas");
  const [isCreating, setIsCreating] = useState(false);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isCreating && !dialog.open) {
      dialog.showModal();
    } else if (!isCreating && dialog.open) {
      dialog.close();
    }
  }, [isCreating]);

  const filteredSurveys = useMemo(
    () =>
      surveys.filter((survey) => {
        const matchesQuery = `${survey.name} ${survey.category}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchesQuery && (statusFilter === "Todas" || survey.status === statusFilter);
      }),
    [query, statusFilter, surveys],
  );

  function createSurvey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();
    if (!name || !category) {
      setFormError("Preencha o nome e a categoria para criar o rascunho.");
      return;
    }

    const initials = name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
    const survey: MockSurvey = {
      id: `mock-${Date.now()}`,
      name,
      category,
      responses: 0,
      completion: 0,
      score: null,
      status: "Rascunho",
      color: "lavender",
      initials,
      createdAt: "Agora",
      lastResponse: "—",
    };
    setSurveys((current) => [survey, ...current]);
    setStatusFilter("Todas");
    setQuery("");
    setIsCreating(false);
    setFormError("");
    setNotice("Rascunho criado.");
    window.setTimeout(() => setNotice(""), 3500);
  }

  async function copyLink(id: string) {
    const exampleLink = `${window.location.origin}/pesquisa/${id}`;
    if (!navigator.clipboard) {
      setNotice("Não foi possível copiar o link neste navegador.");
      window.setTimeout(() => setNotice(""), 3500);
      return;
    }

    try {
      await navigator.clipboard.writeText(exampleLink);
      setNotice("Link copiado.");
    } catch (error) {
      console.error("Não foi possível copiar o link.", error);
      setNotice("Não foi possível copiar o link.");
    }
    window.setTimeout(() => setNotice(""), 3500);
  }

  return (
    <section className="section-view">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Gerenciamento</p>
          <h1>Pesquisas</h1>
          <p className="section-description">Crie e acompanhe pesquisas de satisfação.</p>
        </div>
        <button className="primary-button" onClick={() => setIsCreating(true)}>
          <Plus size={16} /> Nova pesquisa
        </button>
      </div>

      <div className="section-stats">
        <MiniStat label="Total de pesquisas" value={String(surveys.length).padStart(2, "0")} icon={<ListChecks size={18} />} color="indigo" />
        <MiniStat label="Ativas" value={String(mockActiveSurveys).padStart(2, "0")} icon={<CheckCircle2 size={18} />} color="emerald" />
        <MiniStat label="Respostas recebidas" value={mockTotalResponses.toLocaleString("pt-BR")} icon={<MessageSquare size={18} />} color="amber" />
        <MiniStat label="Conclusão média" value={`${mockAverageCompletion}%`} icon={<TrendingUp size={18} />} color="cyan" />
      </div>

      <div className="panel section-panel">
        <div className="section-toolbar">
          <div className="filter-tabs" role="group" aria-label="Filtrar por status">
            {(["Todas", "Ativa", "Rascunho", "Encerrada"] as StatusFilter[]).map((status) => (
              <button
                aria-pressed={statusFilter === status}
                className={`filter-tab${statusFilter === status ? " selected" : ""}`}
                key={status}
                onClick={() => setStatusFilter(status)}
              >
                {status}
                {status === "Todas" && <span>{surveys.length}</span>}
              </button>
            ))}
          </div>
          <label className="section-search">
            <Search size={16} />
            <input
              aria-label="Buscar pesquisa"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar pesquisa..."
              value={query}
            />
          </label>
        </div>
        {notice && <p className="inline-notice" role="status" aria-live="polite">{notice}</p>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pesquisa</th>
                <th>Status</th>
                <th>Respostas</th>
                <th>Conclusão</th>
                <th>Nota média</th>
                <th>Última resposta</th>
                <th scope="col">Link</th>
              </tr>
            </thead>
            <tbody>
              {filteredSurveys.map((survey) => (
                <tr key={survey.id}>
                  <td>
                    <div className="survey-name-cell">
                      <span className={`survey-avatar ${survey.color}`}>{survey.initials}</span>
                      <span><strong>{survey.name}</strong><small>{survey.category} · Criada em {survey.createdAt}</small></span>
                    </div>
                  </td>
                  <td><StatusPill status={survey.status} /></td>
                  <td className="table-number">{survey.responses}</td>
                  <td><ProgressValue value={survey.completion} /></td>
                  <td>{survey.score === null ? <span className="muted-value">Sem respostas</span> : <span className="score">★ <strong>{survey.score.toFixed(1).replace(".", ",")}</strong></span>}</td>
                  <td className="muted-value">{survey.lastResponse}</td>
                  <td>
                    <div className="table-actions">
                      <button className="more-button" aria-label={`Copiar link de ${survey.name}`} onClick={() => copyLink(survey.id)} title="Copiar link">
                        <Copy size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSurveys.length === 0 && (
                <tr><td className="empty-table" colSpan={7}>Nenhuma pesquisa encontrada com esses filtros.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-pagination">
          <span>Exibindo {filteredSurveys.length} de {surveys.length} pesquisas</span>
          <span className="pagination-current">Página 1</span>
        </div>
      </div>

      <div className="section-tip">
        <div><strong>Dica para suas pesquisas</strong><p>Pesquisas curtas tendem a ter mais respostas. Comece com uma pergunta objetiva e relevante para a experiência.</p></div>
      </div>

      <dialog
        aria-labelledby="create-survey-title"
        className="modal-dialog"
        onCancel={(event) => {
          event.preventDefault();
          dialogRef.current?.close();
        }}
        onClose={() => setIsCreating(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            dialogRef.current?.close();
          }
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            dialogRef.current?.close();
          }
        }}
        ref={dialogRef}
      >
        {isCreating && (
          <form className="modal-card" onSubmit={createSurvey}>
            <div className="modal-heading">
              <div><span className="metric-icon purple"><Plus size={18} /></span><h2 id="create-survey-title">Criar pesquisa</h2><p>Adicione um título e uma categoria para começar.</p></div>
              <button className="more-button" type="button" aria-label="Fechar" onClick={() => dialogRef.current?.close()}><X size={19} /></button>
            </div>
            <label className="form-field">Nome da pesquisa<input maxLength={80} name="name" onChange={() => setFormError("")} placeholder="Ex.: Satisfação com o atendimento" required /></label>
            <label className="form-field">Categoria<input maxLength={40} name="category" onChange={() => setFormError("")} placeholder="Ex.: Pós-venda" required /></label>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <div className="modal-actions"><button className="secondary-button" type="button" onClick={() => dialogRef.current?.close()}>Cancelar</button><button className="primary-button" type="submit"><Plus size={15} /> Criar rascunho</button></div>
          </form>
        )}
      </dialog>
    </section>
  );
}

function MiniStat({ label, value, icon, color = "gray" }: { label: string; value: string; icon?: React.ReactNode; color?: string }) {
  const colorClasses: Record<string, string> = {
    indigo: "text-indigo-500",
    emerald: "text-emerald-500",
    amber: "text-amber-500",
    cyan: "text-cyan-500",
    gray: "text-gray-500",
  };
  
  return (
    <article className="mini-stat">
      {icon && <span className={`${colorClasses[color] || colorClasses.gray}`}>{icon}</span>}
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

export function StatusPill({ status }: { status: SurveyStatus }) {
  const className = status === "Ativa" ? "status-active" : status === "Rascunho" ? "status-draft" : "status-closed";
  return <span className={`status-pill ${className}`}><i />{status}</span>;
}

export function ProgressValue({ value }: { value: number }) {
  return <div className="completion-cell"><span className="completion-track"><i style={{ width: `${value}%` }} /></span><span>{value}%</span></div>;
}
