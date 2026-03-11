import { listTemplates } from "@/lib/local-db";

export const dynamic = "force-dynamic";

function formatDeadline(scheduledTime: string, toleranceMinutes: number) {
  const [hours = "0", minutes = "0"] = scheduledTime.split(":");
  const totalMinutes = Number(hours) * 60 + Number(minutes) + toleranceMinutes;
  const nextHours = Math.floor((totalMinutes % (24 * 60)) / 60)
    .toString()
    .padStart(2, "0");
  const nextMinutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${nextHours}:${nextMinutes}`;
}

export default async function AdminTemplatesPage() {
  const templates = await listTemplates();

  return (
    <main className="space-y-5">
      <section className="card rounded-2xl p-5">
        <h2 className="text-2xl font-bold text-[--color-navy]">Template Settings</h2>
        <p className="mt-1 text-sm text-[--color-navy]/75">
          Edit how many minutes after the scheduled time each task can still be completed on time.
        </p>
      </section>

      <section className="space-y-3">
        {templates.map((template) => (
          <article key={template.id} className="card rounded-2xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[--color-navy]/60">
                  {template.category}
                </p>
                <h3 className="text-lg font-semibold text-[--color-navy]">{template.title}</h3>
                <p className="mt-1 text-sm text-[--color-navy]/70">
                  Scheduled at {template.scheduled_time} • Deadline at{" "}
                  {formatDeadline(template.scheduled_time, template.tolerance_minutes)}
                </p>
              </div>

              <form
                action={`/api/admin/templates/${template.id}/deadline`}
                method="post"
                className="flex flex-wrap items-end gap-2"
              >
                <input type="hidden" name="return_to" value="/admin/templates" />
                <label className="grid gap-1 text-sm text-[--color-navy]">
                  <span className="font-semibold">Deadline window (minutes)</span>
                  <input
                    type="number"
                    name="tolerance_minutes"
                    min={0}
                    max={1440}
                    defaultValue={template.tolerance_minutes}
                    className="w-36 rounded-lg border border-[--color-navy]/25 bg-white px-3 py-2 outline-none focus:border-[--color-navy]"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-lg border border-[--color-navy] bg-[--color-acid] px-4 py-2 text-sm font-bold text-[--color-navy] transition hover:brightness-95"
                >
                  Save
                </button>
              </form>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
