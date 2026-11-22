import assert from "node:assert/strict";
import test from "node:test";
import { isSupabaseConfigured } from "../src/lib/supabase/config.ts";

test("a autenticação exige todas as variáveis de configuração", () => {
  const keys = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SITE_URL"];
  const previous = keys.map((key) => process.env[key]);
  try {
    for (const key of keys) delete process.env[key];
    assert.equal(isSupabaseConfigured(), false);
    for (const key of keys) process.env[key] = "configured";
    assert.equal(isSupabaseConfigured(), true);
    process.env.SITE_URL = "";
    assert.equal(isSupabaseConfigured(), false);
  } finally {
    keys.forEach((key, index) => {
      if (previous[index] === undefined) delete process.env[key];
      else process.env[key] = previous[index];
    });
  }
});
