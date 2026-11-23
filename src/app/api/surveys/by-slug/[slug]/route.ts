import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/database";
import { ApiResponse } from "@/lib/types";
import { z } from "zod";

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

    if (!z.uuid().safeParse(params.slug).success) {
      return errorResponse("NOT_FOUND", "Survey not found", 404);
    }
    const survey = await db.getPublicSurvey(params.slug);
    if (!survey) {
      return errorResponse("NOT_FOUND", "Survey not found", 404);
    }

    return successResponse({ ...survey, turnstile_site_key: process.env.TURNSTILE_SITE_KEY || null });
  } catch (error) {
    if (error instanceof db.PublicSurveyError && error.code === "RATE_LIMITED") {
      return NextResponse.json(
        { success: false, error: { code: "RATE_LIMITED", message: "Muitas consultas. Tente novamente em um minuto." } },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }
    console.error("Error fetching survey:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "Failed to fetch survey",
      500
    );
  }
}
