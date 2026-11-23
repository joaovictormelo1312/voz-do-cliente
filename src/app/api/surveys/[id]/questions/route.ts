import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ZodError } from "zod";
import { createQuestionSchema } from "@/lib/validation";
import * as db from "@/lib/database";
import { ApiResponse } from "@/lib/types";

async function getAuthUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

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

// GET /api/surveys/[id]/questions - List survey questions
export async function GET(
  request: NextRequest,
  props: { params: Params }
) {
  try {
    const params = await props.params;
    const user = await getAuthUser();
    if (!user) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    const survey = await db.getSurvey(params.id);
    if (!survey) {
      return errorResponse("NOT_FOUND", "Survey not found", 404);
    }

    if (survey.owner_id !== user.id) {
      return errorResponse("FORBIDDEN", "Access denied", 403);
    }

    const questions = await db.getSurveyQuestions(params.id);
    return successResponse(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to fetch questions", 500);
  }
}

// POST /api/surveys/[id]/questions - Create question
export async function POST(
  request: NextRequest,
  props: { params: Params }
) {
  try {
    const params = await props.params;
    const user = await getAuthUser();
    if (!user) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    const survey = await db.getSurvey(params.id);
    if (!survey) {
      return errorResponse("NOT_FOUND", "Survey not found", 404);
    }

    if (survey.owner_id !== user.id) {
      return errorResponse("FORBIDDEN", "Access denied", 403);
    }

    const body = await request.json();
    const validated = createQuestionSchema.parse(body);

    const question = await db.createQuestion(params.id, validated, validated.options);

    return successResponse(question, 201);
  } catch (error) {
    console.error("Error creating question:", error);

    if (db.isSurveyStructureLocked(error)) {
      return errorResponse("SURVEY_LOCKED", "Não é possível alterar perguntas após receber respostas.", 409);
    }
    if (typeof error === "object" && error !== null && "message" in error && error.message === "QUESTION_LIMIT_REACHED") {
      return errorResponse("QUESTION_LIMIT", "Uma pesquisa pode ter até 200 perguntas.", 400);
    }
    if (error instanceof ZodError) {
      return errorResponse("VALIDATION_ERROR", "Invalid question data", 400);
    }

    return errorResponse("INTERNAL_ERROR", "Failed to create question", 500);
  }
}
