export type SurveyStatus = "draft" | "active" | "closed";
export type QuestionKind = "rating" | "single_choice" | "text";

export interface Survey {
  id: string;
  owner_id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  status: SurveyStatus;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export interface Question {
  id: string;
  survey_id: string;
  title: string;
  kind: QuestionKind;
  required: boolean;
  position: number;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  label: string;
  position: number;
}

export interface Submission {
  id: string;
  survey_id: string;
  submitted_at: string;
}

export interface Answer {
  id: string;
  survey_id: string;
  submission_id: string;
  question_id: string;
  rating: number | null;
  text_value: string | null;
  option_id: string | null;
}

export interface SurveyWithQuestions extends Survey {
  questions: QuestionWithOptions[];
}

export interface QuestionWithOptions extends Question {
  options: QuestionOption[];
}

export interface SurveyResult {
  survey: Survey;
  total_responses: number;
  completion_rate: number;
  questions_results: QuestionResult[];
}

export interface QuestionResult {
  question: Question;
  responses_count: number;
  rating_average?: number;
  rating_distribution?: Record<number, number>;
  options_distribution?: Record<string, number>;
  text_responses?: string[];
}

export type CreateSurveyInput = Omit<Survey, "id" | "owner_id" | "slug" | "created_at">;
export type UpdateSurveyInput = Partial<Omit<Survey, "id" | "owner_id" | "slug" | "created_at">>;

export type CreateQuestionInput = Omit<Question, "id" | "survey_id">;
export type UpdateQuestionInput = Partial<Omit<Question, "id" | "survey_id">>;

export interface SubmitSurveyInput {
  survey_slug: string;
  answers: {
    question_id: string;
    rating?: number;
    text_value?: string;
    option_id?: string;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}
