import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { updateTemplateTolerance } from "@/lib/local-db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const formData = await request.formData();
  const returnTo = (formData.get("return_to")?.toString() || "/admin/templates").trim();
  const rawTolerance = Number(formData.get("tolerance_minutes"));

  if (!Number.isFinite(rawTolerance) || rawTolerance < 0 || rawTolerance > 24 * 60) {
    return NextResponse.redirect(new URL(returnTo, request.url), 303);
  }

  await updateTemplateTolerance(id, Math.round(rawTolerance));
  revalidatePath("/admin/templates");
  revalidatePath("/checklist/today");
  revalidatePath("/checklist/week");
  revalidatePath("/checklist/history");
  revalidatePath("/reports");

  return NextResponse.redirect(new URL(returnTo, request.url), 303);
}
