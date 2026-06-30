// src/lib/api-response.ts
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function validationErrorResponse(error: ZodError) {
  const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
  return NextResponse.json(
    { success: false, error: "Validation failed", details: messages },
    { status: 422 }
  );
}

/**
 * Wraps an API handler in a try/catch that returns a clean 500 on unhandled errors.
 * This prevents leaking stack traces and internal details to clients.
 */
export async function withErrorHandling(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[API Error]", err);
    return errorResponse("An unexpected error occurred. Please try again.", 500);
  }
}
