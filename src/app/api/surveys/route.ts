import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSurveySchema } from "@/lib/validation";
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

// GET /api/surveys - List user surveys
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const page_size = parseInt(
      request.nextUrl.searchParams.get("page_size") || "10"
    );

    const result = await db.getUserSurveys(user.id, page, page_size);
    return successResponse(result);
  } catch (error) {
    console.error("Error fetching surveys:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to fetch surveys", 500);
  }
}

// POST /api/surveys - Create new survey
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    const body = await request.json();

    const validated = createSurveySchema.parse(body);

    const survey = await db.createSurvey(validated);

    return successResponse(survey, 201);
  } catch (error) {
    console.error("Error creating survey:", error);
    if (error instanceof ZodError) {
      return errorResponse("VALIDATION_ERROR", "Invalid survey data", 400);
    }

    return errorResponse("INTERNAL_ERROR", "Failed to create survey", 500);
  }
}
