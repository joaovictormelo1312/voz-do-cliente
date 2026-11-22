"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error("Erro inesperado na aplicação.", error);
  }, [error]);

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Algo não saiu como esperado</h1>
        <p className="auth-description">Não foi possível carregar esta página. Tente novamente.</p>
        <button className="primary-button auth-submit" onClick={retry} type="button">Tentar novamente</button>
      </div>
    </main>
  );
}
