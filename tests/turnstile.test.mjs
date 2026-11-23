import assert from "node:assert/strict";
import test from "node:test";
import { verifySurveyChallenge } from "../src/lib/turnstile.ts";

test("verifica token, domínio e ação no servidor e falha de forma segura", async () => {
  const originalFetch = globalThis.fetch;
  const oldSecret = process.env.TURNSTILE_SECRET_KEY;
  const oldSite = process.env.SITE_URL;
  process.env.TURNSTILE_SECRET_KEY = "test-secret";
  process.env.SITE_URL = "https://example.test";
  try {
    let payload;
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
      payload = JSON.parse(options.body);
      return Response.json({ success: true, hostname: "example.test", action: "survey_submit" });
    };
    assert.equal(await verifySurveyChallenge("token"), "valid");
    assert.deepEqual(payload, { secret: "test-secret", response: "token" });
    globalThis.fetch = async () => Response.json({ success: true, hostname: "other.test", action: "survey_submit" });
    assert.equal(await verifySurveyChallenge("token"), "invalid");
    globalThis.fetch = async () => Response.json({ success: true, hostname: "example.test", action: "other" });
    assert.equal(await verifySurveyChallenge("token"), "invalid");
    globalThis.fetch = async () => Response.json({ success: false, "error-codes": ["timeout-or-duplicate"] });
    assert.equal(await verifySurveyChallenge("token"), "invalid");
    globalThis.fetch = async () => Response.json({ success: false, "error-codes": ["internal-error"] });
    assert.equal(await verifySurveyChallenge("token"), "unavailable");
    globalThis.fetch = async () => { throw new Error("offline"); };
    assert.equal(await verifySurveyChallenge("token"), "unavailable");
    delete process.env.TURNSTILE_SECRET_KEY;
    assert.equal(await verifySurveyChallenge("token"), "unavailable");
  } finally {
    globalThis.fetch = originalFetch;
    if (oldSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = oldSecret;
    if (oldSite === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = oldSite;
  }
});
