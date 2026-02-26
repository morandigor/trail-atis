import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Manual task reconciliation is disabled for stores." },
    { status: 403 },
  );
}
