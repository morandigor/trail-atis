import { revalidatePath } from "next/cache";
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
    if (request.headers.get("x-requested-with") === "fetch") {
      return NextResponse.json({ error: "Missing team member name" }, { status: 400 });
    }
    return NextResponse.redirect(new URL(returnTo, request.url), 303);
  }

  const result = await completeTask(id, notes || null, completedBy, subtasksState);

  if (result.ok) {
    revalidatePath("/checklist/today");
    revalidatePath("/checklist/week");
    revalidatePath("/checklist/history");
    revalidatePath("/reports");
  }

  if (request.headers.get("x-requested-with") === "fetch") {
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }

    return NextResponse.json(result);
  }

  return NextResponse.redirect(new URL(returnTo, request.url), 303);
}
