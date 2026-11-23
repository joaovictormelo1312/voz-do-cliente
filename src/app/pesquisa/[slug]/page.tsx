'use client';

import React, { FormEvent, useState } from 'react';
import { ChevronRight } from 'lucide-react';

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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!survey) return;

    // Validate required fields
    for (const question of survey.questions) {
      if (question.required && !answers[question.id]) {
        setError(`Por favor, responda a: ${question.title}`);
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const submissionAnswers = survey.questions.map((q) => {
        const answer: any = { question_id: q.id };

        if (q.kind === 'rating') {
          answer.rating = parseInt(answers[q.id] as string);
        } else if (q.kind === 'single_choice') {
          answer.option_id = answers[q.id];
        } else if (q.kind === 'text') {
          answer.text_value = answers[q.id];
        }

        return answer;
      });

      const response = await fetch(
        `/api/surveys/${survey.id}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: submissionAnswers }),
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
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Carregando pesquisa...</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Pesquisa não encontrada
          </h1>
          <p className="text-gray-600 mb-6">
            {error || 'A pesquisa que você está procurando não existe ou não está mais disponível.'}
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="mb-4">
            <div className="inline-block rounded-full bg-green-100 p-3">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Obrigado!
          </h1>
          <p className="text-gray-600 mb-6">
            Sua resposta foi registrada com sucesso. Seus comentários são
            muito importantes para nós.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Voltar
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {survey.title}
          </h1>
          {survey.description && (
            <p className="text-gray-600 text-lg mb-6">{survey.description}</p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {survey.questions.map((question) => (
            <div
              key={question.id}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                {question.title}
                {question.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>

              {question.kind === 'rating' && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() =>
                        setAnswers({
                          ...answers,
                          [question.id]: rating.toString(),
                        })
                      }
                      className={`w-12 h-12 rounded-lg font-semibold transition ${
                        answers[question.id] === rating.toString()
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              )}

              {question.kind === 'single_choice' && question.options && (
                <div className="space-y-3">
                  {question.options.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition"
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
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="text-gray-900">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.kind === 'text' && (
                <textarea
                  value={(answers[question.id] as string) || ''}
                  onChange={(e) =>
                    setAnswers({
                      ...answers,
                      [question.id]: e.target.value,
                    })
                  }
                  placeholder="Digite sua resposta aqui..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                  rows={4}
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? 'Enviando...' : 'Enviar Resposta'}
            {!submitting && <ChevronRight className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
