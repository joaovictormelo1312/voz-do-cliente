"use client";

import { FormEvent, useState } from "react";
import { Bell, Check, LockKeyhole, Save, ShieldCheck, UserRound } from "lucide-react";

export function SettingsSection() {
  const [saved, setSaved] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [newResponses, setNewResponses] = useState(true);
  const [anonymousByDefault, setAnonymousByDefault] = useState(true);

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  }

  return (
    <section className="section-view">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Preferências do espaço de trabalho</p>
          <h1>Configurações</h1>
          <p className="section-description">Gerencie seu perfil e as preferências do espaço.</p>
        </div>
      </div>

      <form className="settings-layout" onSubmit={saveSettings}>
        <aside className="settings-nav panel">
          <a className="settings-nav-item selected" href="#perfil"><UserRound size={16} /> Perfil</a>
          <a className="settings-nav-item" href="#notificacoes"><Bell size={16} /> Notificações</a>
          <a className="settings-nav-item" href="#privacidade"><LockKeyhole size={16} /> Privacidade</a>
        </aside>

        <div className="settings-content">
          <article className="panel settings-card" id="perfil">
            <div className="settings-card-heading"><span className="settings-heading-icon"><UserRound size={17} /></span><div><h2>Perfil</h2><p>Informações da pessoa administradora deste workspace.</p></div></div>
            <div className="profile-edit">
              <span className="profile-avatar large">CA</span>
              <div><strong>Camila Andrade</strong><span>Administradora</span></div>
            </div>
            <div className="settings-form-grid">
              <label className="form-field">Nome<input defaultValue="Camila Andrade" /></label>
              <label className="form-field">E-mail<input defaultValue="camila@minhaempresa.com.br" type="email" /></label>
              <label className="form-field">Nome da organização<input defaultValue="Minha empresa" /></label>
              <label className="form-field">Fuso horário<select defaultValue="America/Sao_Paulo"><option value="America/Sao_Paulo">Brasília (GMT-03:00)</option><option value="UTC">UTC</option></select></label>
            </div>
          </article>

          <article className="panel settings-card" id="notificacoes">
            <div className="settings-card-heading"><span className="settings-heading-icon yellow"><Bell size={17} /></span><div><h2>Notificações</h2><p>Escolha quais avisos quer receber.</p></div></div>
            <ToggleRow title="Novas respostas" description="Receba um aviso quando uma pesquisa receber respostas." checked={newResponses} onChange={setNewResponses} />
            <ToggleRow title="Resumo semanal" description="Receba um resumo semanal dos principais indicadores." checked={weeklySummary} onChange={setWeeklySummary} />
          </article>

          <article className="panel settings-card" id="privacidade">
            <div className="settings-card-heading"><span className="settings-heading-icon green"><LockKeyhole size={17} /></span><div><h2>Privacidade das pesquisas</h2><p>Preferências sugeridas para novas pesquisas.</p></div></div>
            <ToggleRow title="Pesquisas anônimas por padrão" description="Não solicitar nome ou e-mail dos respondentes ao criar uma pesquisa." checked={anonymousByDefault} onChange={setAnonymousByDefault} />
            <div className="privacy-note"><ShieldCheck size={16} /><span>O tratamento real dos dados deve ser definido e documentado conforme a finalidade do projeto e a LGPD.</span></div>
          </article>

          <div className="settings-save-row">
            {saved && <span className="save-confirmation"><Check size={15} /> Preferências atualizadas.</span>}
            <button className="primary-button" type="submit"><Save size={15} /> Salvar alterações</button>
          </div>
        </div>
      </form>
    </section>
  );
}

function ToggleRow({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="toggle-row">
      <div><strong>{title}</strong><p>{description}</p></div>
      <button className={`toggle${checked ? " checked" : ""}`} type="button" role="switch" aria-checked={checked} aria-label={title} onClick={() => onChange(!checked)}><i /></button>
    </div>
  );
}
