const MAX_SURVEY_BODY_BYTES = 5_000_000;

export async function readSurveyBody(request: Request): Promise<
  { ok: true; value: unknown } | { ok: false; reason: "invalid" | "too_large" }
> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > MAX_SURVEY_BODY_BYTES) {
    return { ok: false, reason: "too_large" };
  }
  if (!request.body) return { ok: false, reason: "invalid" };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_SURVEY_BODY_BYTES) {
      await reader.cancel();
      return { ok: false, reason: "too_large" };
    }
    chunks.push(value);
  }
  const buffer = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { ok: true, value: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(buffer)) };
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError) return { ok: false, reason: "invalid" };
    throw error;
  }
}
