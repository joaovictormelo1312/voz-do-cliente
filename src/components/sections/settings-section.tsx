"use client";

import { useActionState, useState } from "react";
import { Bell, Check, LockKeyhole, Save, ShieldCheck, UserRound } from "lucide-react";
import { updatePassword, updateProfile, type AuthState } from "@/app/auth/actions";

export function SettingsSection({ name, email, organization }: { name: string; email: string; organization: string }) {
  const [profileState, profileAction, profilePending] = useActionState<AuthState, FormData>(updateProfile, {});
  const [passwordState, passwordAction, passwordPending] = useActionState<AuthState, FormData>(updatePassword, {});
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [newResponses, setNewResponses] = useState(true);
  const [anonymousByDefault, setAnonymousByDefault] = useState(true);
  const [saved, setSaved] = useState(false);

  return (
    <section className="section-view">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Preferências do espaço de trabalho</p>
          <h1>Configurações</h1>
          <p className="section-description">Gerencie sua conta e as preferências do espaço.</p>
        </div>
      </div>

      <div className="settings-layout">
        <aside className="settings-nav panel">
          <a className="settings-nav-item selected" href="#perfil"><UserRound size={16} className="text-indigo-500" /> Perfil</a>
          <a className="settings-nav-item" href="#senha"><LockKeyhole size={16} className="text-emerald-500" /> Senha</a>
          <a className="settings-nav-item" href="#notificacoes"><Bell size={16} className="text-amber-500" /> Notificações</a>
          <a className="settings-nav-item" href="#privacidade"><ShieldCheck size={16} className="text-emerald-500" /> Privacidade</a>
        </aside>

        <div className="settings-content">
          <form action={profileAction} className="panel settings-card" id="perfil">
            <div className="settings-card-heading"><UserRound size={20} /><div><h2>Perfil</h2><p>Informações da sua conta.</p></div></div>
            <div className="settings-form-grid">
              <label className="form-field">Nome<input name="name" defaultValue={name} maxLength={80} required /></label>
              <label className="form-field">E-mail<input value={email} type="email" readOnly /></label>
              <label className="form-field">Nome da organização<input name="organization" defaultValue={organization} maxLength={80} required /></label>
            </div>
            {profileState.error && <p className="auth-error" role="alert">{profileState.error}</p>}
            {profileState.message && <p className="auth-success" role="status">{profileState.message}</p>}
            <div className="settings-save-row"><button className="primary-button" disabled={profilePending} type="submit"><Save size={15} />{profilePending ? "Salvando..." : "Salvar perfil"}</button></div>
          </form>

          <form action={passwordAction} className="panel settings-card" id="senha">
            <div className="settings-card-heading"><LockKeyhole size={20} /><div><h2>Senha</h2><p>Atualize a senha da sua conta.</p></div></div>
            <div className="settings-form-grid">
              <label className="form-field">Nova senha<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
              <label className="form-field">Confirmar nova senha<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required /></label>
            </div>
            {passwordState.error && <p className="auth-error" role="alert">{passwordState.error}</p>}
            {passwordState.message && <p className="auth-success" role="status">{passwordState.message}</p>}
            <div className="settings-save-row"><button className="primary-button" disabled={passwordPending} type="submit"><Save size={15} />{passwordPending ? "Salvando..." : "Alterar senha"}</button></div>
          </form>

          <form onSubmit={(event) => { event.preventDefault(); setSaved(true); window.setTimeout(() => setSaved(false), 3000); }}>
            <p className="settings-demo-note">As preferências abaixo são apenas uma demonstração e não são persistidas.</p>
            <article className="panel settings-card">
              <div className="settings-card-heading"><UserRound size={20} /><div><h2>Espaço de trabalho</h2><p>Preferências de exibição.</p></div></div>
              <label className="form-field">Fuso horário<select defaultValue="America/Sao_Paulo"><option value="America/Sao_Paulo">Brasília (GMT-03:00)</option><option value="UTC">UTC</option></select></label>
            </article>
            <article className="panel settings-card" id="notificacoes">
              <div className="settings-card-heading"><Bell size={20} /><div><h2>Notificações</h2><p>Escolha quais avisos quer receber.</p></div></div>
              <ToggleRow title="Novas respostas" description="Receba um aviso quando uma pesquisa receber respostas." checked={newResponses} onChange={setNewResponses} />
              <ToggleRow title="Resumo semanal" description="Receba um resumo semanal dos principais indicadores." checked={weeklySummary} onChange={setWeeklySummary} />
            </article>
            <article className="panel settings-card" id="privacidade">
              <div className="settings-card-heading"><ShieldCheck size={20} /><div><h2>Privacidade das pesquisas</h2><p>Preferências sugeridas para novas pesquisas.</p></div></div>
              <ToggleRow title="Pesquisas anônimas por padrão" description="Não solicitar nome ou e-mail dos respondentes ao criar uma pesquisa." checked={anonymousByDefault} onChange={setAnonymousByDefault} />
              <div className="privacy-note"><ShieldCheck size={16} /><span>O tratamento real dos dados deve ser definido e documentado conforme a finalidade do projeto e a LGPD.</span></div>
            </article>
            <div className="settings-save-row">
              {saved && <span className="save-confirmation" role="status"><Check size={15} /> Preferências atualizadas apenas nesta tela.</span>}
              <button className="primary-button" type="submit"><Save size={15} /> Aplicar demonstração</button>
            </div>
          </form>
        </div>
      </div>
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
