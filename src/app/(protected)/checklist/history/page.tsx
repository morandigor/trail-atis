import { listSubmissionHistory } from "@/lib/local-db";
import { formatShortDate, formatTime } from "@/lib/time";

type HistoryStatus = "all" | "completed_on_time" | "completed_late";

export default async function SubmissionHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; status?: HistoryStatus }>;
}) {
  const params = await searchParams;
  const status =
    params.status === "completed_on_time" || params.status === "completed_late"
      ? params.status
      : "all";

  const rows = await listSubmissionHistory({
    from: params.from,
    to: params.to,
    status,
  });

  return (
    <main className="space-y-5">
      <section className="card rounded-2xl p-5">
        <h2 className="text-2xl font-bold text-[--color-navy]">Submission History</h2>
        <p className="text-sm text-[--color-navy]/75">Check previously submitted tasks.</p>

        <form className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            type="date"
            name="from"
            defaultValue={params.from}
            className="rounded-lg border border-[--color-navy]/25 bg-white px-3 py-2"
          />
          <input
            type="date"
            name="to"
            defaultValue={params.to}
            className="rounded-lg border border-[--color-navy]/25 bg-white px-3 py-2"
          />
          <select
            name="status"
            defaultValue={status}
            className="rounded-lg border border-[--color-navy]/25 bg-white px-3 py-2"
          >
            <option value="all">All submitted</option>
            <option value="completed_on_time">On time</option>
            <option value="completed_late">Late</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-[--color-navy] px-4 py-2 font-semibold text-white"
          >
            Apply
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {rows.length === 0 ? (
          <div className="card rounded-2xl p-5 text-sm text-[--color-navy]/70">
            No submissions found for this filter.
          </div>
        ) : null}

        {rows.map((row) => (
          <article key={row.id} className="card rounded-2xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[--color-navy]/60">
                  {row.task_templates?.category ?? "Uncategorized"}
                </p>
                <h3 className="text-lg font-semibold text-[--color-navy]">
                  {row.task_templates?.title ?? "Untitled task"}
                </h3>
                <p className="text-sm text-[--color-navy]/70">
                  Scheduled: {formatShortDate(row.scheduled_at)} at {formatTime(row.scheduled_at)}
                </p>
                <p className="text-sm text-[--color-navy]/70">
                  Submitted: {row.completed_at ? formatShortDate(row.completed_at) : "-"} at{" "}
                  {row.completed_at ? formatTime(row.completed_at) : "-"}
                </p>
                <p className="text-sm text-[--color-navy]/70">By: {row.completed_by ?? "-"}</p>
                {row.notes ? (
                  <p className="mt-2 rounded-lg bg-[--color-butter] px-3 py-2 text-sm text-[--color-navy]/85">
                    Note: {row.notes}
                  </p>
                ) : null}
              </div>
              <span className="rounded-full bg-[--color-butter] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[--color-navy]">
                {row.status === "completed_on_time" ? "On time" : "Late"}
              </span>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
