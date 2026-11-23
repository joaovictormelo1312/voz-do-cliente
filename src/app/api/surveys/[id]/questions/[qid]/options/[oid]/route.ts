import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createQuestionOptionSchema } from "@/lib/validation";
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

type Params = Promise<{ id: string; qid: string; oid: string }>;

// PATCH /api/surveys/[id]/questions/[qid]/options/[oid] - Update option
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
  } catch (error: any) {
    console.error("Error updating option:", error);

    if (error.name === "ZodError") {
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

    const deleted = await db.deleteQuestionOption(params.oid, params.qid);
    if (!deleted) {
      return errorResponse("NOT_FOUND", "Option not found", 404);
    }

    return successResponse({ id: params.oid });
  } catch (error) {
    console.error("Error deleting option:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to delete option", 500);
  }
}
