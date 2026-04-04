import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { received: true, message: "Paystack webhook scaffolded." },
    { status: 202 },
  );
}
