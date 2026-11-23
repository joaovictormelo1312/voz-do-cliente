"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { MessageSquareText } from "lucide-react";
import { login, requestPasswordReset, signUp, updatePassword, type AuthState } from "@/app/auth/actions";
import { AUTH_UNAVAILABLE_MESSAGE } from "@/lib/auth-messages";
import { Spinner } from "@/components/loading-indicators";

type Mode = "login" | "cadastro" | "recuperar" | "redefinir";

const modes = {
  login: { title: "Bem-vindo de volta", description: "Entre para acompanhar a voz dos seus clientes.", button: "Entrar", action: login },
  cadastro: { title: "Crie sua conta", description: "Comece a acompanhar a experiência dos seus clientes.", button: "Criar conta", action: signUp },
  recuperar: { title: "Recuperar senha", description: "Enviaremos um link para o seu e-mail.", button: "Enviar link", action: requestPasswordReset },
  redefinir: { title: "Redefinir senha", description: "Escolha uma nova senha para sua conta.", button: "Salvar nova senha", action: updatePassword },
};

export function AuthForm({ mode, linkError = false, configError = false }: { mode: Mode; linkError?: boolean; configError?: boolean }) {
  const config = modes[mode];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, action, pending] = useActionState<AuthState, FormData>(async (previous, form) => {
    const result = await config.action(previous, form);
    if (result.message) {
      setPassword("");
      setConfirmPassword("");
    }
    return result;
  }, {});

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link className="brand auth-brand" href="/login" aria-label="Voz do Cliente">
          <span className="brand-mark"><MessageSquareText size={20} /></span>
          <span className="brand-name">voz<span>do</span>cliente</span>
        </Link>
        <h1>{config.title}</h1>
        <p className="auth-description">{config.description}</p>
        {linkError && <p className="auth-error" role="alert">Link inválido ou expirado. Solicite um novo link no mesmo navegador.</p>}
        {configError && !state.error && <p className="auth-error" role="alert">{AUTH_UNAVAILABLE_MESSAGE}</p>}
        <form action={action} className="auth-form">
          {mode === "cadastro" && <label className="form-field">Nome<input name="name" autoComplete="name" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} required /></label>}
          {mode !== "redefinir" && <label className="form-field">E-mail<input name="email" type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} required /></label>}
          {mode !== "recuperar" && <label className="form-field">Senha<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? undefined : 8} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>}
          {(mode === "cadastro" || mode === "redefinir") && <label className="form-field">Confirmar senha<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></label>}
          {state.error && <p className="auth-error" role="alert">{state.error}</p>}
          {state.message && <p className="auth-success" role="status">{state.message}</p>}
          <button className="primary-button auth-submit" disabled={pending} type="submit">{pending && <Spinner />}{pending ? "Aguarde..." : config.button}</button>
        </form>
        {mode === "login" ? (
          <div className="auth-links"><Link href="/recuperar-senha">Esqueci minha senha</Link><span>Ainda não tem conta? <Link href="/cadastro">Cadastre-se</Link></span></div>
        ) : <div className="auth-links"><Link href="/login">Voltar para o login</Link>{mode === "redefinir" && <Link href="/">Ir para o painel</Link>}</div>}
      </div>
    </main>
  );
}
