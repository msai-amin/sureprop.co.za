import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function badRequestFromZod(error: ZodError) {
  return NextResponse.json(
    {
      error: "ValidationError",
      message: "Request validation failed.",
      details: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    },
    { status: 400 },
  );
}
