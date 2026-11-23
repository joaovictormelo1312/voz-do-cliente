import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return new Response("Autenticação necessária.", { status: 401 });

  const ids: string[] = [];
  const pageSize = 100;
  for (;;) {
    const { data, error } = await supabase.from("surveys").select("id")
      .eq("owner_id", user.id).order("id").range(ids.length, ids.length + pageSize - 1);
    if (error || !data) {
      console.error("Não foi possível iniciar as atualizações automáticas:", error);
      return new Response("Não foi possível iniciar as atualizações automáticas.", { status: 503 });
    }
    ids.push(...data.map((survey) => survey.id));
    if (data.length < pageSize) break;
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) return new Response("Sessão indisponível.", { status: 401 });
  await supabase.realtime.setAuth(session.access_token);

  const channel = supabase.channel(`survey-events-${crypto.randomUUID()}`);
  const allowedIds = new Set(ids);
  const pendingIds = new Set<string>();
  for (const id of ids) {
    channel.on("postgres_changes", {
      event: "INSERT", schema: "public", table: "submissions", filter: `survey_id=eq.${id}`,
    }, (payload) => {
      const surveyId: unknown = payload.new.survey_id;
      if (typeof surveyId === "string" && allowedIds.has(surveyId)) {
        pendingIds.add(surveyId);
        if (!batch) {
          batch = setTimeout(() => {
            batch = undefined;
            for (const pendingId of pendingIds) send("submission", pendingId);
            pendingIds.clear();
          }, 1_000);
        }
      }
    });
  }

  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  let closed = false;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let lifetime: ReturnType<typeof setTimeout> | undefined;
  let batch: ReturnType<typeof setTimeout> | undefined;

  function send(event: string, value: string) {
    if (!closed && controller) controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(value)}\n\n`));
  }

  function close(endStream = true) {
    if (closed) return;
    closed = true;
    if (heartbeat) clearInterval(heartbeat);
    if (lifetime) clearTimeout(lifetime);
    if (batch) clearTimeout(batch);
    request.signal.removeEventListener("abort", handleAbort);
    void supabase.removeChannel(channel).catch((error: unknown) => {
      console.error("Não foi possível encerrar o canal de atualizações:", error);
    });
    if (endStream) controller?.close();
  }

  function handleAbort() {
    close();
  }

  const stream = new ReadableStream<Uint8Array>({
    start(streamController) {
      controller = streamController;
      if (request.signal.aborted) {
        close();
        return;
      }
      request.signal.addEventListener("abort", handleAbort, { once: true });
      heartbeat = setInterval(() => {
        if (!closed) streamController.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 25_000);
      lifetime = setTimeout(() => {
        send("renew", "ok");
        close();
      }, 300_000);
      if (ids.length === 0) {
        send("ready", "ok");
        return;
      }
      channel.subscribe((status, error) => {
        if (closed) return;
        if (status === "SUBSCRIBED") send("ready", "ok");
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          console.error("Conexão de atualizações automáticas indisponível:", error ?? status);
          send("failure", "Conexão indisponível.");
          close(false);
        }
      });
    },
    cancel() {
      close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "private, no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
