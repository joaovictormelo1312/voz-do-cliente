import { NextRequest, NextResponse } from "next/server";
import { submitSurveySchema } from "@/lib/validation";
import * as db from "@/lib/database";
import { ApiResponse } from "@/lib/types";
import { z } from "zod";
import { readSurveyBody } from "@/lib/request-body";
import { verifySurveyChallenge } from "@/lib/turnstile";
import { createHash } from "node:crypto";

function errorResponse(code: string, message: string, status: number) {
  const response: ApiResponse<null> = {
    success: false,
    error: { code, message },
  };
  return NextResponse.json(response, { status });
}

function successResponse<T>(data: T, status: number = 200) {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  return NextResponse.json(response, { status });
}

type Params = Promise<{ id: string }>;

// POST /api/surveys/[id]/submit - Submit survey responses (PUBLIC)
export async function POST(
  request: NextRequest,
  props: { params: Params }
) {
  try {
    const params = await props.params;
    if (!z.uuid().safeParse(params.id).success) {
      return errorResponse("NOT_FOUND", "Survey not found", 404);
    }
    const body = await readSurveyBody(request);
    const validated = body.ok ? submitSurveySchema.pick({ answers: true }).extend({
      challenge_token: z.string().min(1).max(2048),
    }).safeParse(body.value) : null;
    if (!body.ok || !validated?.success) {
      if (!body.ok && body.reason === "too_large") {
        return errorResponse("PAYLOAD_TOO_LARGE", "O envio excede o tamanho permitido.", 413);
      }
      return errorResponse("VALIDATION_ERROR", "As respostas são inválidas ou incompletas.", 400);
    }
    const verification = await verifySurveyChallenge(validated.data.challenge_token);
    if (verification === "unavailable") {
      return errorResponse("VERIFICATION_UNAVAILABLE", "Verificação de segurança indisponível. Tente novamente.", 503);
    }
    if (verification === "invalid") {
      return errorResponse("VERIFICATION_FAILED", "Não foi possível confirmar a verificação. Tente novamente.", 400);
    }
    const tokenHash = createHash("sha256").update(validated.data.challenge_token).digest("hex");
    const submissionId = await db.submitSurvey(params.id, validated.data.answers, tokenHash);

    return successResponse(
      { submission_id: submissionId, message: "Response recorded successfully" },
      201
    );
  } catch (error) {
    if (error instanceof db.PublicSurveyError) {
      if (error.code === "SURVEY_UNAVAILABLE") return errorResponse("SURVEY_INACTIVE", "Pesquisa indisponível.", 400);
      if (error.code === "INVALID_ANSWERS") return errorResponse("VALIDATION_ERROR", "As respostas são inválidas ou incompletas.", 400);
      if (error.code === "CHALLENGE_REUSED") return errorResponse("VERIFICATION_FAILED", "Verificação já utilizada. Tente novamente.", 400);
      if (error.code === "RATE_LIMITED") {
        return NextResponse.json(
          { success: false, error: { code: "RATE_LIMITED", message: "Muitas respostas recebidas. Tente novamente em um minuto." } },
          { status: 429, headers: { "Retry-After": "60" } },
        );
      }
    }

    console.error("Error submitting survey:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "Failed to submit survey responses",
      500
    );
  }
}
