'use client';

import React, { FormEvent, useRef, useState } from 'react';
import { Check, ChevronRight, MessageSquareText } from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';
import type { SubmitSurveyInput } from '@/lib/types';
import { Spinner, SurveySkeleton } from '@/components/loading-indicators';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        action: string;
        theme: 'dark';
        callback: (token: string) => void;
        'expired-callback': () => void;
        'error-callback': () => void;
      }) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

interface Question {
  id: string;
  title: string;
  kind: 'rating' | 'single_choice' | 'text';
  required: boolean;
  position: number;
  options?: Array<{ id: string; label: string; position: number }>;
}

interface SurveyData {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: string;
  standard_form: boolean;
  turnstile_site_key: string | null;
  questions: Question[];
}

export default function SurveyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const challengeContainer = useRef<HTMLDivElement>(null);
  const challengeId = useRef<string | null>(null);
  const [answers, setAnswers] = useState<
    Record<string, number | string | undefined>
  >({});

  // Fetch survey on mount
  React.useEffect(() => {
    const slug = params.then((p) => p.slug);
    slug.then(async (s) => {
      try {
        const response = await fetch(
          `/api/surveys/by-slug/${s}`
        );
        if (!response.ok) {
          setError('Pesquisa não encontrada ou não está mais disponível.');
          setLoading(false);
          return;
        }
        const data = await response.json();
        setSurvey(data.data);
      } catch (err) {
        setError('Erro ao carregar a pesquisa.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
  }, [params]);

  React.useEffect(() => {
    const sitekey = survey?.turnstile_site_key;
    const container = challengeContainer.current;
    if (!survey || submitted || !scriptReady || !sitekey || !container || !window.turnstile) return;
    const id = window.turnstile.render(container, {
      sitekey,
      action: 'survey_submit',
      theme: 'dark',
      callback: (token) => setChallengeToken(token),
      'expired-callback': () => setChallengeToken(null),
      'error-callback': () => {
        setChallengeToken(null);
        setError('Verificação de segurança indisponível. Tente novamente.');
      },
    });
    challengeId.current = id;
    return () => {
      window.turnstile?.remove(id);
      challengeId.current = null;
    };
  }, [survey, submitted, scriptReady]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!survey) return;

    // Validate required fields
    for (const question of survey.questions) {
      if (question.required && !String(answers[question.id] ?? '').trim()) {
        setError(`Por favor, responda a: ${question.title}`);
        return;
      }
    }
    if (!challengeToken) {
      setError('Aguarde a verificação de segurança ou tente novamente.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const submissionAnswers: SubmitSurveyInput['answers'] = survey.questions.flatMap((q) => {
        const value = answers[q.id];
        if (value === undefined || String(value).trim() === '') return [];
        const answer: SubmitSurveyInput['answers'][number] = { question_id: q.id };

        if (q.kind === 'rating') {
          answer.rating = Number(value);
        } else if (q.kind === 'single_choice') {
          answer.option_id = String(value);
        } else if (q.kind === 'text') {
          answer.text_value = String(value);
        }

        return [answer];
      });

      if (submissionAnswers.length === 0) {
        setError('Responda pelo menos uma pergunta antes de enviar.');
        return;
      }

      const response = await fetch(
        `/api/surveys/${survey.id}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: submissionAnswers, challenge_token: challengeToken }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error?.message || 'Erro ao enviar a pesquisa.'
        );
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar.');
      console.error(err);
    } finally {
      setChallengeToken(null);
      if (challengeId.current) window.turnstile?.reset(challengeId.current);
      setSubmitting(false);
    }
  }

  if (loading) {
    return <SurveySkeleton />;
  }

  if (!survey) {
    return (
      <main className="survey-page survey-page-centered">
        <div className="survey-message panel">
          <h1>Pesquisa não encontrada</h1>
          <p>
            {error || 'A pesquisa que você está procurando não existe ou não está mais disponível.'}
          </p>
          <Link href="/" className="primary-button">Voltar ao início</Link>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="survey-page survey-page-centered">
        <div className="survey-message panel">
          <span className="survey-success-icon"><Check size={24} /></span>
          <h1>Obrigado!</h1>
          <p>
            Sua resposta foi registrada com sucesso. Seus comentários são
            muito importantes para nós.
          </p>
          <Link href="/" className="primary-button">Voltar ao início</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="survey-page">
      <div className="survey-container">
        <Link className="brand survey-brand" href="/" aria-label="Voz do Cliente">
          <span className="brand-mark"><MessageSquareText size={20} /></span>
          <span className="brand-name">voz<span>do</span>cliente</span>
        </Link>
        <header className="survey-header">
          <p className="eyebrow">Sua opinião importa</p>
          <h1>{survey.title}</h1>
          <p>{survey.description || 'Conte para nós como foi sua experiência.'}</p>
        </header>

        {error && (
          <p className="survey-error" role="alert">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="survey-form">
          {survey.questions.map((question) => (
            <fieldset key={question.id} className="survey-question panel">
              <legend className="sr-only">{question.title}</legend>
              <p className="survey-question-title">
                {question.title}
                {question.required && (
                  <span className="survey-required" aria-label="obrigatória"> *</span>
                )}
              </p>

              {question.kind === 'rating' && (
                <>
                <p className="survey-hint">Selecione uma nota de 1 a 5.</p>
                <div className="survey-rating" role="group" aria-label={question.title}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      aria-label={`Nota ${rating} de 5`}
                      aria-pressed={answers[question.id] === rating.toString()}
                      onClick={() =>
                        setAnswers({
                          ...answers,
                          [question.id]: rating.toString(),
                        })
                      }
                      className={`survey-rating-button${answers[question.id] === rating.toString() ? ' selected' : ''}`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                {survey.standard_form && <div className="survey-scale"><span>1 · Pior</span><span>5 · Melhor</span></div>}
                </>
              )}

              {question.kind === 'single_choice' && question.options && (
                <div className="survey-options">
                  {question.options.map((option) => (
                    <label
                      key={option.id}
                      className="survey-option"
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option.id}
                        checked={answers[question.id] === option.id}
                        onChange={(e) =>
                          setAnswers({
                            ...answers,
                            [question.id]: e.target.value,
                          })
                        }
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.kind === 'text' && (
                <><p className="survey-hint">{question.required ? 'Compartilhe sua resposta.' : 'Opcional — conte mais sobre sua experiência.'}</p><textarea
                  aria-label={question.title}
                  value={(answers[question.id] as string) || ''}
                  onChange={(e) =>
                    setAnswers({
                      ...answers,
                      [question.id]: e.target.value,
                    })
                  }
                  placeholder="Digite sua resposta aqui..."
                  className="survey-textarea"
                  maxLength={4000}
                  rows={4}
                /></>
              )}
            </fieldset>
          ))}

          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            onReady={() => setScriptReady(true)}
            onError={() => setError('Não foi possível carregar a verificação de segurança. Recarregue a página.')}
          />
          <div ref={challengeContainer} />
          {!survey.turnstile_site_key && (
            <p className="survey-error" role="alert">Verificação de segurança não configurada. Tente novamente mais tarde.</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="primary-button survey-submit"
          >
            {submitting && <Spinner />}
            {submitting ? 'Enviando...' : 'Enviar Resposta'}
            {!submitting && <ChevronRight size={18} />}
          </button>
        </form>
      </div>
    </main>
  );
}
