export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY && process.env.SITE_URL);
}

export function logMissingSupabaseConfig() {
  console.error("Autenticação indisponível: configuração do Supabase ou SITE_URL ausente.");
}

export function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Configure SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY no ambiente.");
  }
  return { url, key };
}

export function getSiteUrl() {
  const value = process.env.SITE_URL;
  if (!value) {
    throw new Error("Configure SITE_URL no ambiente.");
  }
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("SITE_URL deve conter apenas a origem HTTP(S) da aplicação.");
  }
  return url.origin;
}

export function getCookieOptions() {
  return { httpOnly: true, secure: getSiteUrl().startsWith("https://"), sameSite: "lax" as const };
}
