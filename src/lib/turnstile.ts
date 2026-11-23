import { z } from "zod";

const responseSchema = z.object({
  success: z.boolean(),
  hostname: z.string().optional(),
  action: z.string().optional(),
  "error-codes": z.array(z.string()).optional(),
});

export async function verifySurveyChallenge(token: string): Promise<"valid" | "invalid" | "unavailable"> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const siteUrl = process.env.SITE_URL;
  if (!secret || !siteUrl) {
    console.error("Verificação de segurança indisponível: configuração ausente.");
    return "unavailable";
  }
  try {
    const url = new URL(siteUrl);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
      throw new Error("SITE_URL inválida");
    }
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token }),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Siteverify indisponível");
    const result = responseSchema.parse(await response.json());
    if (!result.success) {
      if (result["error-codes"]?.some((code) => ["missing-input-secret", "invalid-input-secret", "internal-error"].includes(code))) {
        throw new Error("Siteverify recusou a configuração ou está indisponível");
      }
      return "invalid";
    }
    return result.hostname === url.hostname && result.action === "survey_submit" ? "valid" : "invalid";
  } catch {
    console.error("Não foi possível verificar o desafio de segurança.");
    return "unavailable";
  }
}
