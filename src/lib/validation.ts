import { z } from "zod";

// Survey validation schemas
export const surveyTitleSchema = z.string().min(1, "Title is required").max(200, "Title must be at most 200 characters");
export const surveyDescriptionSchema = z.string().max(4000, "Description must be at most 4000 characters").default("");
export const surveyCategorySchema = z.string().max(100, "Category must be at most 100 characters").default("");
export const surveyStatusSchema = z.enum(["draft", "active", "closed"]).default("draft");

export const createSurveySchema = z.object({
  title: surveyTitleSchema,
  description: surveyDescriptionSchema,
  category: surveyCategorySchema,
  status: surveyStatusSchema,
  starts_at: z.string().datetime().nullable().optional().default(null),
  ends_at: z.string().datetime().nullable().optional().default(null),
}).refine(
  (data) => !data.starts_at || !data.ends_at || new Date(data.ends_at) > new Date(data.starts_at),
  { message: "End time must be after start time", path: ["ends_at"] }
);

// For updates, create a schema without refinement
export const updateSurveySchema = z.object({
  title: surveyTitleSchema.optional(),
  description: surveyDescriptionSchema.optional(),
  category: surveyCategorySchema.optional(),
  status: surveyStatusSchema.optional(),
  starts_at: z.string().datetime().nullable().optional(),
  ends_at: z.string().datetime().nullable().optional(),
});

// Question validation schemas
export const questionTitleSchema = z.string().min(1, "Question title is required").max(1000, "Title must be at most 1000 characters");
export const questionKindSchema = z.enum(["rating", "single_choice", "text"]);

export const createQuestionSchema = z.object({
  title: questionTitleSchema,
  kind: questionKindSchema,
  required: z.boolean().default(true),
  position: z.number().nonnegative().int("Position must be a non-negative integer"),
  options: z.array(z.object({
    label: z.string().trim().min(1).max(500),
    position: z.number().nonnegative().int(),
  })).optional(),
}).refine((data) => data.kind !== "single_choice" || (data.options?.length ?? 0) >= 2, {
  message: "Single choice questions require at least two options",
  path: ["options"],
});

export const updateQuestionSchema = z.object({
  title: questionTitleSchema.optional(),
  kind: questionKindSchema.optional(),
  required: z.boolean().optional(),
  position: z.number().nonnegative().int().optional(),
});

// Question Option validation schemas
export const questionOptionLabelSchema = z.string().min(1, "Label is required").max(500, "Label must be at most 500 characters");

export const createQuestionOptionSchema = z.object({
  label: questionOptionLabelSchema,
  position: z.number().nonnegative().int("Position must be a non-negative integer"),
});

export const updateQuestionOptionSchema = z.object({
  label: questionOptionLabelSchema.optional(),
  position: z.number().nonnegative().int().optional(),
});

// Answer validation schemas
export const submitAnswerSchema = z.object({
  question_id: z.string().uuid("Invalid question ID"),
  rating: z.number().int("Rating must be an integer").min(1).max(5).optional(),
  text_value: z.string().max(4000, "Text response must be at most 4000 characters").optional(),
  option_id: z.string().uuid("Invalid option ID").optional(),
});

export const submitSurveySchema = z.object({
  survey_slug: z.string().uuid("Invalid survey slug"),
  answers: z.array(submitAnswerSchema).min(1, "At least one answer is required").max(200, "At most 200 answers are allowed"),
});

// Type exports
export type CreateSurveyRequest = z.infer<typeof createSurveySchema>;
export type UpdateSurveyRequest = z.infer<typeof updateSurveySchema>;
export type CreateQuestionRequest = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionRequest = z.infer<typeof updateQuestionSchema>;
export type CreateQuestionOptionRequest = z.infer<typeof createQuestionOptionSchema>;
export type SubmitSurveyRequest = z.infer<typeof submitSurveySchema>;
