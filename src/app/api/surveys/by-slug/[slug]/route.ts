import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/database";
import { ApiResponse } from "@/lib/types";

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

type Params = Promise<{ slug: string }>;

// GET /api/surveys/by-slug/[slug] - Get survey by slug (PUBLIC)
export async function GET(
  request: NextRequest,
  props: { params: Params }
) {
  try {
    const params = await props.params;

    const surveySummary = await db.getSurveyBySlug(params.slug);
    if (!surveySummary) {
      return errorResponse("NOT_FOUND", "Survey not found", 404);
    }

    const survey = await db.getSurveyWithQuestions(surveySummary.id);

    if (!survey) {
      return errorResponse("NOT_FOUND", "Survey not found", 404);
    }

    // Only return active surveys or allow if explicitly enabled for public viewing
    if (survey.status !== "active") {
      return errorResponse(
        "SURVEY_INACTIVE",
        "Survey is not active",
        403
      );
    }

    return successResponse(survey);
  } catch (error) {
    console.error("Error fetching survey:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "Failed to fetch survey",
      500
    );
  }
}
