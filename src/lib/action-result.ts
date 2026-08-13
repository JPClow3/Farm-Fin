import { z } from 'zod';

export type ActionResult<T> =
  | {
      success: true;
      data: T;
      message?: string;
    }
  | {
      success: false;
      error: string;
      issues?: Record<string, string[]>;
    };

/**
 * Safely parses input against a Zod schema, returning formatted ActionResult errors if invalid.
 */
export function validateActionInput<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; result: ActionResult<never> } {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const errorIssues = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    const firstErrorMessage = parsed.error.issues[0]?.message || 'Dados de entrada inválidos.';
    return {
      success: false,
      result: {
        success: false,
        error: firstErrorMessage,
        issues: errorIssues,
      },
    };
  }
  return {
    success: true,
    data: parsed.data,
  };
}
