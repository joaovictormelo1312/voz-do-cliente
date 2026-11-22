import { Suspense } from "react";
import { connection } from "next/server";
import { AuthForm } from "@/components/auth-form";
import { isSupabaseConfigured, logMissingSupabaseConfig } from "@/lib/supabase/config";

async function LoginForm({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  await connection();
  const params = await searchParams;
  const configError = !isSupabaseConfigured();
  if (configError) logMissingSupabaseConfig();
  return <AuthForm mode="login" linkError={params.erro === "link"} configError={configError} />;
}

export default function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  return <Suspense fallback={<main className="auth-loading">Carregando...</main>}><LoginForm searchParams={searchParams} /></Suspense>;
}
