import { NextResponse } from "next/server";

import { completeTask } from "@/lib/local-db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const formData = await request.formData();
  const returnTo = (formData.get("return_to")?.toString() || "/checklist/today").trim();
  const notes = (formData.get("notes")?.toString() || "").trim();
  const completedBy = (formData.get("completed_by")?.toString() || "").trim();

  if (!completedBy) {
    return NextResponse.redirect(new URL(returnTo, request.url));
  }

  await completeTask(id, notes || null, completedBy);
  return NextResponse.redirect(new URL(returnTo, request.url));
}
