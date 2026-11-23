import { NextRequest, NextResponse } from "next/server";
import { submitSurveySchema } from "@/lib/validation";
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

type Params = Promise<{ id: string }>;

// POST /api/surveys/[id]/submit - Submit survey responses (PUBLIC)
export async function POST(
  request: NextRequest,
  props: { params: Params }
) {
  try {
    const params = await props.params;
    const body = await request.json();

    const survey = await db.getSurvey(params.id);
    if (!survey) {
      return errorResponse("NOT_FOUND", "Survey not found", 404);
    }

    // Validate survey is active and accepting responses
    const isValid = await db.validateSurveyForSubmission(survey.slug);
    if (!isValid) {
      return errorResponse(
        "SURVEY_INACTIVE",
        "Survey is not active or accepting responses",
        400
      );
    }

    // Validate submission data
    const submitData = {
      survey_slug: survey.slug,
      answers: body.answers || [],
    };

    const validated = submitSurveySchema.parse(submitData);

    const result = await db.submitSurvey(
      validated.survey_slug,
      validated.answers
    );

    if (!result) {
      return errorResponse(
        "SUBMISSION_FAILED",
        "Failed to submit survey responses",
        400
      );
    }

    if (result.errors && result.errors.length > 0) {
      return errorResponse(
        "VALIDATION_FAILED",
        "Some required questions were not answered",
        400
      );
    }

    return successResponse(
      { submission_id: result.submission_id, message: "Response recorded successfully" },
      201
    );
  } catch (error: any) {
    console.error("Error submitting survey:", error);

    if (error.name === "ZodError") {
      return errorResponse("VALIDATION_ERROR", "Invalid submission data", 400);
    }

    return errorResponse(
      "INTERNAL_ERROR",
      "Failed to submit survey responses",
      500
    );
  }
}
