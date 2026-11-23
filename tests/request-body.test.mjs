import assert from "node:assert/strict";
import test from "node:test";
import { readSurveyBody } from "../src/lib/request-body.ts";

test("aceita JSON e rejeita conteúdo inválido", async () => {
  const valid = new Request("http://localhost", { method: "POST", body: '{"answers":[]}' });
  assert.deepEqual(await readSurveyBody(valid), { ok: true, value: { answers: [] } });
  const invalid = new Request("http://localhost", { method: "POST", body: "{" });
  assert.deepEqual(await readSurveyBody(invalid), { ok: false, reason: "invalid" });
});

test("limita o tamanho mesmo sem Content-Length", async () => {
  const exact = new Request("http://localhost", { method: "POST", body: `"${"a".repeat(4_999_998)}"` });
  const result = await readSurveyBody(exact);
  assert.equal(result.ok, true);
  assert.equal(result.value.length, 4_999_998);
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(3_000_000));
      controller.enqueue(new Uint8Array(2_000_001));
      controller.close();
    },
  });
  const request = new Request("http://localhost", { method: "POST", body: stream, duplex: "half" });
  assert.deepEqual(await readSurveyBody(request), { ok: false, reason: "too_large" });
  const declared = new Request("http://localhost", { method: "POST", headers: { "content-length": "5000001" }, body: "{}" });
  assert.deepEqual(await readSurveyBody(declared), { ok: false, reason: "too_large" });
});
