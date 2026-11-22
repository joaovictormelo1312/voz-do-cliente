import assert from "node:assert/strict";
import test from "node:test";
import { validEmail, validPassword, validProfileField } from "../src/lib/auth-validation.ts";

test("valida formato e tamanho do e-mail", () => {
  assert.equal(validEmail("pessoa@exemplo.com"), true);
  assert.equal(validEmail("pessoa@"), false);
  assert.equal(validEmail("pessoa @exemplo.com"), false);
  assert.equal(validEmail(`${"a".repeat(250)}@x.com`), false);
});

test("valida limites de tamanho da senha incluindo caracteres multibyte", () => {
  assert.equal(validPassword("1234567"), false);
  assert.equal(validPassword("12345678"), true);
  assert.equal(validPassword("a".repeat(72)), true);
  assert.equal(validPassword("é".repeat(37)), false);
});

test("rejeita nome e organização vazios ou longos", () => {
  assert.equal(validProfileField("  Nome  "), true);
  assert.equal(validProfileField("   "), false);
  assert.equal(validProfileField("a".repeat(81)), false);
});
