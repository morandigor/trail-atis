import { NextResponse } from "next/server";

import { completeTask } from "@/lib/local-db";

function parseSubtasksState(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map((item) => Boolean(item)) : null;
  } catch {
    return null;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const formData = await request.formData();
  const returnTo = (formData.get("return_to")?.toString() || "/checklist/today").trim();
  const notes = (formData.get("notes")?.toString() || "").trim();
  const completedBy = (formData.get("completed_by")?.toString() || "").trim();
  const subtasksState = parseSubtasksState(formData.get("subtasks_state"));

  if (!completedBy) {
    return NextResponse.redirect(new URL(returnTo, request.url), 303);
  }

  await completeTask(id, notes || null, completedBy, subtasksState);
  return NextResponse.redirect(new URL(returnTo, request.url), 303);
}
