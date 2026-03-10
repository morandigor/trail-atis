import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { toggleTaskSubtask } from "@/lib/local-db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | {
        index?: number;
        checked?: boolean;
      }
    | null;

  if (!body || typeof body.index !== "number" || typeof body.checked !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const ok = await toggleTaskSubtask(id, body.index, body.checked);

  if (!ok) {
    return NextResponse.json({ error: "Unable to update subtask" }, { status: 400 });
  }

  revalidatePath("/checklist/today");
  revalidatePath("/checklist/week");
  revalidatePath("/reports");
  return NextResponse.json({ ok: true });
}
