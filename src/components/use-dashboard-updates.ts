"use client";

import { useEffect, useState } from "react";

type UpdateStatus = "connecting" | "live" | "paused" | "retrying";

export function useDashboardUpdates(
  surveyIds: string | null,
  refresh: () => Promise<void>,
  refreshSurvey: (id: string) => Promise<void>,
) {
  const [status, setStatus] = useState<UpdateStatus>("connecting");

  useEffect(() => {
    if (surveyIds === null) return;
    const knownIds = new Set(surveyIds ? surveyIds.split(",") : []);
    const pending = new Set<string>();
    let stopped = false;
    let source: EventSource | null = null;
    let batchTimer: number | undefined;
    let retryTimer: number | undefined;

    function clearTimers() {
      if (batchTimer !== undefined) window.clearTimeout(batchTimer);
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      batchTimer = undefined;
      retryTimer = undefined;
    }

    function disconnect() {
      source?.close();
      source = null;
      clearTimers();
      pending.clear();
    }

    function retry() {
      if (stopped || document.hidden || retryTimer !== undefined) return;
      disconnect();
      setStatus("retrying");
      void refresh().catch((error: unknown) => console.error("Falha ao atualizar o painel:", error));
      retryTimer = window.setTimeout(() => {
        retryTimer = undefined;
        connect();
      }, 60_000);
    }

    function connect() {
      if (stopped || document.hidden || source) return;
      const current = new EventSource("/api/surveys/events");
      source = current;
      current.addEventListener("ready", () => {
        if (stopped || source !== current) return;
        setStatus("live");
        void refresh().catch((error: unknown) => {
          console.error("Falha ao sincronizar o painel:", error);
          retry();
        });
      });
      current.addEventListener("submission", (event: MessageEvent<string>) => {
        if (stopped || source !== current) return;
        let id: unknown;
        try {
          id = JSON.parse(event.data);
        } catch {
          console.error("Aviso de atualização inválido.");
          retry();
          return;
        }
        if (typeof id !== "string" || !knownIds.has(id)) {
          console.error("Aviso de atualização para pesquisa desconhecida.");
          retry();
          return;
        }
        pending.add(id);
        if (batchTimer === undefined) {
          batchTimer = window.setTimeout(() => {
            batchTimer = undefined;
            const ids = [...pending];
            pending.clear();
            void Promise.all(ids.map(refreshSurvey)).catch((error: unknown) => {
              console.error("Falha ao atualizar uma pesquisa:", error);
              retry();
            });
          }, 3_000);
        }
      });
      current.addEventListener("renew", () => {
        if (stopped || source !== current) return;
        disconnect();
        connect();
      });
      current.addEventListener("failure", () => {
        if (source === current) retry();
      });
      current.onerror = () => {
        if (source === current) retry();
      };
    }

    function visibilityChanged() {
      if (document.hidden) {
        disconnect();
        setStatus("paused");
      } else {
        setStatus("connecting");
        connect();
      }
    }

    document.addEventListener("visibilitychange", visibilityChanged);
    if (!document.hidden) connect();
    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", visibilityChanged);
      disconnect();
    };
  }, [surveyIds, refresh, refreshSurvey]);

  return status;
}
