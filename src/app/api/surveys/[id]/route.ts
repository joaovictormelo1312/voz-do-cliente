import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { updateSurveySchema } from "@/lib/validation";
import * as db from "@/lib/database";
import { ApiResponse } from "@/lib/types";

async function getAuthUser(request: NextRequest) {
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

// GET /api/surveys/[id] - Get survey details with questions
export async function GET(
  request: NextRequest,
  props: { params: Params }
) {
  try {
    const params = await props.params;
    const user = await getAuthUser(request);
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

    const surveyWithQuestions = await db.getSurveyWithQuestions(params.id);
    return successResponse(surveyWithQuestions);
  } catch (error) {
    console.error("Error fetching survey:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to fetch survey", 500);
  }
}

// PATCH /api/surveys/[id] - Update survey
export async function PATCH(
  request: NextRequest,
  props: { params: Params }
) {
  try {
    const params = await props.params;
    const user = await getAuthUser(request);
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
    const validated = updateSurveySchema.parse(body);

    const updated = await db.updateSurvey(params.id, user.id, validated);
    if (!updated) {
      return errorResponse("INTERNAL_ERROR", "Failed to update survey", 500);
    }

    return successResponse(updated);
  } catch (error: any) {
    console.error("Error updating survey:", error);

    if (error.name === "ZodError") {
      return errorResponse("VALIDATION_ERROR", "Invalid survey data", 400);
    }

    return errorResponse("INTERNAL_ERROR", "Failed to update survey", 500);
  }
}

// DELETE /api/surveys/[id] - Delete survey
export async function DELETE(
  request: NextRequest,
  props: { params: Params }
) {
  try {
    const params = await props.params;
    const user = await getAuthUser(request);
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

    const deleted = await db.deleteSurvey(params.id, user.id);
    if (!deleted) {
      return errorResponse("INTERNAL_ERROR", "Failed to delete survey", 500);
    }

    return successResponse({ id: params.id });
  } catch (error) {
    console.error("Error deleting survey:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to delete survey", 500);
  }
}
