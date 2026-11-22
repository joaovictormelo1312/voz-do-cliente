"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AUTH_UNAVAILABLE_MESSAGE, getSignupErrorMessage } from "@/lib/auth-messages";
import { validEmail, validPassword, validProfileField } from "@/lib/auth-validation";
import { getSiteUrl, isSupabaseConfigured, logMissingSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

function configurationError(): AuthState {
  logMissingSupabaseConfig();
  return { error: AUTH_UNAVAILABLE_MESSAGE };
}

function field(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

export async function login(_state: AuthState, form: FormData): Promise<AuthState> {
  const email = field(form, "email").trim();
  const password = field(form, "password");
  if (!validEmail(email) || !password) return { error: "Informe um e-mail válido e sua senha." };
  if (!isSupabaseConfigured()) return configurationError();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Não foi possível entrar. Verifique suas credenciais e a confirmação do e-mail." };
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(_state: AuthState, form: FormData): Promise<AuthState> {
  const name = field(form, "name").trim();
  const email = field(form, "email").trim();
  const password = field(form, "password");
  if (!validProfileField(name) || !validEmail(email)) return { error: "Informe um nome e um e-mail válidos." };
  if (!validPassword(password)) return { error: password.length < 8 ? "A senha deve ter pelo menos 8 caracteres." : "Senha muito longa. Use uma senha mais curta." };
  if (password !== field(form, "confirmPassword")) return { error: "As senhas não coincidem." };
  if (!isSupabaseConfigured()) return configurationError();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo: `${getSiteUrl()}/auth/callback` },
  });
  if (error) {
    console.error("Falha ao criar conta.", { code: error.code, status: error.status });
    return { error: getSignupErrorMessage(error.code) };
  }
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/");
  }
  return { message: "Se o cadastro puder ser concluído, você receberá um e-mail de confirmação. Abra o link neste mesmo navegador." };
}

export async function requestPasswordReset(_state: AuthState, form: FormData): Promise<AuthState> {
  const email = field(form, "email").trim();
  if (!validEmail(email)) return { error: "Informe um e-mail válido." };
  if (!isSupabaseConfigured()) return configurationError();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/auth/callback?flow=recovery`,
  });
  if (error) return { error: "Não foi possível solicitar a recuperação. Tente novamente mais tarde." };
  return { message: "Se o e-mail estiver cadastrado, você receberá um link de recuperação. Abra-o neste mesmo navegador." };
}

export async function updatePassword(_state: AuthState, form: FormData): Promise<AuthState> {
  const password = field(form, "password");
  if (!validPassword(password)) return { error: password.length < 8 ? "A senha deve ter pelo menos 8 caracteres." : "Senha muito longa. Use uma senha mais curta." };
  if (password !== field(form, "confirmPassword")) return { error: "As senhas não coincidem." };
  if (!isSupabaseConfigured()) return configurationError();

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: "Sua sessão expirou. Entre novamente ou solicite um novo link de recuperação." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Não foi possível alterar a senha. Tente novamente." };
  return { message: "Senha atualizada com sucesso." };
}

export async function updateProfile(_state: AuthState, form: FormData): Promise<AuthState> {
  const name = field(form, "name").trim();
  const organization = field(form, "organization").trim();
  if (!validProfileField(name) || !validProfileField(organization)) return { error: "Informe nome e organização com até 80 caracteres." };
  if (!isSupabaseConfigured()) return configurationError();

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: "Sua sessão expirou. Entre novamente." };
  const { error } = await supabase.auth.updateUser({ data: { name, organization } });
  if (error) return { error: "Não foi possível atualizar o perfil. Tente novamente." };
  revalidatePath("/", "layout");
  return { message: "Perfil atualizado com sucesso." };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("Não foi possível sair da conta. Tente novamente.");
  revalidatePath("/", "layout");
  redirect("/login");
}
