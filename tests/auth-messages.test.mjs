import assert from "node:assert/strict";
import test from "node:test";
import { getSignupErrorMessage } from "../src/lib/auth-messages.ts";

test("orienta o usuário quando a senha é rejeitada pelo serviço", () => {
  assert.match(getSignupErrorMessage("weak_password"), /senha mais forte/i);
});

test("orienta o usuário a aguardar após limite de tentativas", () => {
  for (const code of ["over_email_send_rate_limit", "over_request_rate_limit"]) {
    assert.match(getSignupErrorMessage(code), /aguarde/i);
  }
});

test("não expõe detalhes técnicos para erro desconhecido", () => {
  assert.doesNotMatch(getSignupErrorMessage("erro_interno"), /erro_interno/);
});
