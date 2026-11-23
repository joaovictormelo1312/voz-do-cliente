import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createQuestionOptionSchema } from "@/lib/validation";
import { ZodError } from "zod";
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

type Params = Promise<{ id: string; qid: string; oid: string }>;

// PATCH /api/surveys/[id]/questions/[qid]/options/[oid] - Update option
export async function PATCH(
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

    if (!(await db.getSurveyQuestions(params.id)).some((question) => question.id === params.qid)) {
      return errorResponse("NOT_FOUND", "Question not found", 404);
    }

    const body = await request.json();
    const validated = createQuestionOptionSchema.parse(body);

    const updated = await db.updateQuestionOption(
      params.oid,
      params.qid,
      validated.label,
      validated.position
    );
    if (!updated) {
      return errorResponse("NOT_FOUND", "Option not found", 404);
    }

    return successResponse(updated);
  } catch (error) {
    console.error("Error updating option:", error);

    if (db.isSurveyStructureLocked(error)) {
      return errorResponse("SURVEY_LOCKED", "Não é possível alterar opções após receber respostas.", 409);
    }
    if (error instanceof ZodError) {
      return errorResponse("VALIDATION_ERROR", "Invalid option data", 400);
    }

    return errorResponse("INTERNAL_ERROR", "Failed to update option", 500);
  }
}

// DELETE /api/surveys/[id]/questions/[qid]/options/[oid] - Delete option
export async function DELETE(
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

    if (!(await db.getSurveyQuestions(params.id)).some((question) => question.id === params.qid)) {
      return errorResponse("NOT_FOUND", "Question not found", 404);
    }

    const deleted = await db.deleteQuestionOption(params.oid, params.qid);
    if (!deleted) {
      return errorResponse("NOT_FOUND", "Option not found", 404);
    }

    return successResponse({ id: params.oid });
  } catch (error) {
    console.error("Error deleting option:", error);
    if (db.isSurveyStructureLocked(error)) {
      return errorResponse("SURVEY_LOCKED", "Não é possível alterar opções após receber respostas.", 409);
    }
    return errorResponse("INTERNAL_ERROR", "Failed to delete option", 500);
  }
}
