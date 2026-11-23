import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Dashboard from "@/components/dashboard";
import { DashboardSkeleton } from "@/components/loading-indicators";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function AuthenticatedDashboard() {
  await connection();
  if (!isSupabaseConfigured()) redirect("/login?erro=configuracao");
  const supabase = await createSupabaseServerClient(false);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user) {
    if (error && error.name !== "AuthSessionMissingError" && error.code !== "refresh_token_not_found") {
      throw new Error("Não foi possível verificar a sessão. Tente novamente.");
    }
    redirect("/login");
  }

  const name = typeof user.user_metadata.name === "string" && user.user_metadata.name.trim()
    ? user.user_metadata.name.trim()
    : user.email ?? "Usuário";
  const organization = typeof user.user_metadata.organization === "string" && user.user_metadata.organization.trim()
    ? user.user_metadata.organization.trim()
    : "Minha empresa";

  return <Dashboard name={name} email={user.email ?? ""} organization={organization} />;
}

export default function Home() {
  return <Suspense fallback={<main className="dashboard-loading-shell"><DashboardSkeleton /></main>}><AuthenticatedDashboard /></Suspense>;
}
