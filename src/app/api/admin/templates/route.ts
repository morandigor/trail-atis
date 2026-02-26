import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Template management is disabled for stores." },
    { status: 403 },
  );
}
