import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getCookieOptions, getSupabaseConfig } from "./config";

export async function createSupabaseServerClient(writable = true) {
  const store = await cookies();
  const { url, key } = getSupabaseConfig();
  return createServerClient(url, key, {
    cookieOptions: getCookieOptions(),
    cookies: {
      getAll: () => store.getAll(),
      setAll(cookiesToSet) {
        if (!writable) {
          throw new Error("A sessão não foi renovada pelo proxy.");
        }
        cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options));
      },
    },
  });
}
