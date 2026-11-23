import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
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

// GET /api/surveys/[id]/results - Get survey results and analytics
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

    const results = await db.getSurveyResults(params.id, user.id);
    if (!results) {
      return errorResponse(
        "NOT_FOUND",
        "Survey not found or permission denied",
        404
      );
    }

    return successResponse(results);
  } catch (error) {
    console.error("Error fetching survey results:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "Failed to fetch survey results",
      500
    );
  }
}
