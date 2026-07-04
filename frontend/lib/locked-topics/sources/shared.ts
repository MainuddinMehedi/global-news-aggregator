export const USER_AGENT = "global-news-aggregator/1.0 (Source Validator)";

export interface ValidationResult {
  valid: boolean;
  type: string;
  error?: string;
}
