"use client";

import { useState, type FormEvent } from "react";
import { Copy, Plus, Search, X } from "lucide-react";
import { apiRequest } from "@/lib/dashboard-data";
import { Spinner } from "@/components/loading-indicators";
import type { Question, QuestionKind, Survey, SurveyResult, SurveyWithQuestions } from "@/lib/types";

type Props = {
  surveys: Survey[];
  results: SurveyResult[];
  refresh: () => Promise<void>;
};

const statusLabels = { draft: "Rascunho", active: "Ativa", closed: "Encerrada" } as const;

export function StatusPill({ status }: { status: Survey["status"] }) {
  const className = status === "active" ? "status-active" : status === "draft" ? "status-draft" : "status-closed";
  return <span className={`status-pill ${className}`}><i />{statusLabels[status]}</span>;
}

export function SurveysSection({ surveys, results, refresh }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Survey["status"]>("all");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<SurveyWithQuestions | null>(null);
  const [kind, setKind] = useState<QuestionKind>("rating");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const filtered = surveys.filter((survey) =>
    (filter === "all" || survey.status === filter) &&
    `${survey.title} ${survey.category}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")),
  );

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir a operação.");
    } finally {
      setBusy(false);
    }
  }

  async function openSurvey(id: string) {
    setSelected(await apiRequest<SurveyWithQuestions>(`/api/surveys/${id}`));
  }

  function createSurvey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    void run(async () => {
      const survey = await apiRequest<Survey>("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: String(data.get("title")).trim(), category: String(data.get("category")).trim() }),
      });
      setCreating(false);
      setNotice("Rascunho criado com perguntas padrão. Personalize-as antes de ativar.");
      await refresh();
      await openSurvey(survey.id);
    });
  }

  function editQuestion(event: FormEvent<HTMLFormElement>, question: Question) {
    event.preventDefault();
    if (!selected) return;
    const title = String(new FormData(event.currentTarget).get("title") ?? "").trim();
    void run(async () => {
      await apiRequest<Question>(`/api/surveys/${selected.id}/questions/${question.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      await openSurvey(selected.id);
      await refresh();
      setNotice("Pergunta atualizada.");
    });
  }

  function createVersion() {
    if (!selected) return;
    if (!selected.standard_form && !window.confirm("A nova versão usará o formulário padrão: uma nota e um comentário. Outras perguntas não serão copiadas. Continuar?")) return;
    void run(async () => {
      const rating = selected.questions.find((question) => question.kind === "rating");
      const comment = selected.questions.find((question) => question.kind === "text");
      const survey = await apiRequest<Survey>("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${selected.title.slice(0, 184)} - nova versão`,
          category: selected.category,
          description: selected.description,
          ...(rating ? { rating_title: rating.title } : {}),
          ...(comment ? { comment_title: comment.title } : {}),
        }),
      });
      await refresh();
      await openSurvey(survey.id);
      setNotice("Nova versão criada como rascunho separado. As respostas anteriores foram preservadas.");
    });
  }

  function addQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const options = String(data.get("options") ?? "").split("\n").map((label) => label.trim()).filter(Boolean);
    if (kind === "single_choice" && options.length < 2) {
      setError("Informe pelo menos duas opções, uma por linha.");
      return;
    }
    void run(async () => {
      await apiRequest<Question>(`/api/surveys/${selected.id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(data.get("title")).trim(),
          kind,
          required: data.has("required"),
          position: selected.questions.reduce((max, question) => Math.max(max, question.position), -1) + 1,
          ...(kind === "single_choice" ? { options: options.map((label, position) => ({ label, position })) } : {}),
        }),
      });
      form.reset();
      setKind("rating");
      await openSurvey(selected.id);
      await refresh();
      setNotice("Pergunta adicionada.");
    });
  }

  function changeStatus(status: Survey["status"]) {
    if (!selected) return;
    if (status === "active" && selected.questions.length === 0) {
      setError("Adicione pelo menos uma pergunta antes de ativar a pesquisa.");
      return;
    }
    void run(async () => {
      await apiRequest<Survey>(`/api/surveys/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await openSurvey(selected.id);
      await refresh();
      setNotice(status === "active" ? "Pesquisa ativa. O link público já pode ser compartilhado." : "Status atualizado.");
    });
  }

  async function copyLink(survey: Survey) {
    await run(async () => {
      if (!navigator.clipboard) throw new Error("Não foi possível copiar o link neste navegador.");
      await navigator.clipboard.writeText(`${window.location.origin}/pesquisa/${survey.slug}`);
      setNotice(survey.status === "active" ? "Link copiado." : "Link copiado. A pesquisa precisa estar ativa para receber respostas.");
    });
  }

  return (
    <section className="section-view">
      <div className="section-title-row">
        <div><p className="eyebrow">Gerenciamento</p><h1>Pesquisas</h1><p className="section-description">Crie e acompanhe pesquisas de satisfação.</p></div>
        <button className="primary-button" type="button" onClick={() => { setCreating(true); setSelected(null); setError(""); }}><Plus size={16} /> Nova pesquisa</button>
      </div>
      <p className="settings-demo-note">Novas pesquisas usam uma nota de 1 a 5 e um comentário opcional. Após receber respostas, crie uma nova versão para alterar as perguntas.</p>
      {notice && <p className="inline-notice" role="status">{notice}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {busy && <p className="updating-indicator" role="status"><Spinner /> Processando operação...</p>}

      {creating && <form className="panel settings-card" onSubmit={createSurvey}>
        <div className="modal-heading"><div><h2>Criar pesquisa</h2><p>Adicione um título e uma categoria para começar.</p></div><button className="more-button" type="button" aria-label="Fechar" onClick={() => setCreating(false)}><X size={19} /></button></div>
        <label className="form-field">Nome da pesquisa<input name="title" maxLength={80} required /></label>
        <label className="form-field">Categoria<input name="category" maxLength={40} required /></label>
        <div className="modal-actions"><button className="primary-button" disabled={busy} type="submit">{busy && <Spinner />}{busy ? "Criando..." : "Criar rascunho"}</button></div>
      </form>}

      {selected && <article className="panel settings-card">
        <div className="modal-heading"><div><h2>{selected.title}</h2><p>{selected.category} · {statusLabels[selected.status]}</p></div><button className="more-button" type="button" aria-label="Fechar detalhes" onClick={() => setSelected(null)}><X size={19} /></button></div>
        <h3>Perguntas</h3>
        {selected.questions.length === 0 && <p>Nenhuma pergunta adicionada.</p>}
        {selected.questions.map((question) => selected.standard_form
          ? <form className="response-card standard-question-editor" key={question.id} onSubmit={(event) => editQuestion(event, question)}>
              <label className="form-field">{question.kind === "rating" ? "Pergunta de avaliação · 1 a 5, obrigatória" : "Pergunta de comentário · opcional"}
                <input key={question.title} name="title" defaultValue={question.title} maxLength={1000} required disabled={busy || (results.find((result) => result.survey.id === selected.id)?.total_responses ?? 0) > 0} />
              </label>
              <button type="submit" className="secondary-button" disabled={busy || (results.find((result) => result.survey.id === selected.id)?.total_responses ?? 0) > 0}>Salvar pergunta</button>
            </form>
          : <div className="response-card" key={question.id}>
              <div className="response-main"><strong>{question.title}</strong><p>{question.kind === "rating" ? "Avaliação de 1 a 5" : question.kind === "text" ? "Resposta aberta" : `Escolha única: ${question.options.map((option) => option.label).join(", ")}`} · {question.required ? "Obrigatória" : "Opcional"}</p></div>
              <button type="button" className="secondary-button" disabled={busy} onClick={() => {
                if (!window.confirm("Excluir esta pergunta? Perguntas de pesquisas com respostas não podem ser excluídas.")) return;
                void run(async () => {
                  await apiRequest<{ id: string }>(`/api/surveys/${selected.id}/questions/${question.id}`, { method: "DELETE" });
                  await openSurvey(selected.id);
                  await refresh();
                });
              }}>Excluir</button>
            </div>)}
        {selected.standard_form && <p className="settings-demo-note">Formule a avaliação de modo que 1 seja a pior nota e 5 a melhor. O comentário não altera a média.</p>}
        {!selected.standard_form && <form onSubmit={addQuestion}>
          <label className="form-field">Nova pergunta<input name="title" maxLength={1000} required /></label>
          <label className="form-field">Tipo<select value={kind} onChange={(event) => setKind(event.target.value as QuestionKind)}><option value="rating">Avaliação de 1 a 5</option><option value="single_choice">Escolha única</option><option value="text">Resposta aberta</option></select></label>
          {kind === "single_choice" && <label className="form-field">Opções (uma por linha)<textarea name="options" required rows={3} /></label>}
          <label><input type="checkbox" name="required" defaultChecked /> Resposta obrigatória</label>
          <div className="modal-actions"><button className="secondary-button" disabled={busy} type="submit"><Plus size={15} /> Adicionar pergunta</button></div>
        </form>}
        <div className="modal-actions">
          {selected.status !== "active" && <button className="primary-button" disabled={busy} type="button" onClick={() => changeStatus("active")}>Ativar pesquisa</button>}
          {selected.status === "active" && <button className="secondary-button" disabled={busy} type="button" onClick={() => changeStatus("closed")}>Encerrar pesquisa</button>}
          <button className="secondary-button" disabled={busy} type="button" onClick={() => void copyLink(selected)}><Copy size={15} /> Copiar link</button>
          <button className="secondary-button" disabled={busy} type="button" onClick={createVersion}>Criar nova versão</button>
        </div>
      </article>}

      <div className="panel section-panel">
        <div className="section-toolbar">
          <div className="filter-tabs" role="group" aria-label="Filtrar por status">
            {(["all", "active", "draft", "closed"] as const).map((value) => <button key={value} type="button" aria-pressed={filter === value} className={`filter-tab${filter === value ? " selected" : ""}`} onClick={() => setFilter(value)}>{value === "all" ? "Todas" : statusLabels[value]}</button>)}
          </div>
          <label className="section-search"><Search size={16} /><input aria-label="Buscar pesquisa" placeholder="Buscar pesquisa..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        </div>
        <div className="table-wrap" role="region" aria-label="Tabela de pesquisas" tabIndex={0}><table><thead><tr><th>Pesquisa</th><th>Status</th><th>Respostas</th><th>Ações</th></tr></thead><tbody>
          {filtered.map((survey) => <tr key={survey.id}><td><strong>{survey.title}</strong><small> · {survey.category}</small></td><td><StatusPill status={survey.status} /></td><td>{results.find((result) => result.survey.id === survey.id)?.total_responses ?? "—"}</td><td><button className="text-link" type="button" disabled={busy} onClick={() => void run(() => openSurvey(survey.id))}>Gerenciar</button>{" · "}<button className="text-link" type="button" disabled={busy} onClick={() => void copyLink(survey)}>Copiar link</button></td></tr>)}
          {filtered.length === 0 && <tr><td className="empty-table" colSpan={4}>Nenhuma pesquisa encontrada.</td></tr>}
        </tbody></table></div>
        <p className="table-scroll-hint">Deslize a tabela para ver as ações.</p>
        <div className="table-pagination">Exibindo {filtered.length} de {surveys.length} pesquisas</div>
      </div>
    </section>
  );
}
