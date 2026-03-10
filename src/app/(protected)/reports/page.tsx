import { reportMetrics } from "@/lib/local-db";

type PeriodType = "today" | "week" | "range";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: PeriodType;
    from?: string;
    to?: string;
  }>;
}) {
  const params = await searchParams;

  const period = params.period ?? "today";
  const from = params.from;
  const to = params.to;

  const metrics = await reportMetrics(period, from, to);

  return (
    <main className="space-y-5">
      <section className="card rounded-2xl p-5">
        <h2 className="text-2xl font-bold text-[--color-navy]">Reports</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-4">
          <select
            name="period"
            defaultValue={period}
            className="rounded-lg border border-[--color-navy]/25 bg-white px-3 py-2"
          >
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="range">Custom range</option>
          </select>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="rounded-lg border border-[--color-navy]/25 bg-white px-3 py-2"
          />
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="rounded-lg border border-[--color-navy]/25 bg-white px-3 py-2"
          />
          <button
            type="submit"
            className="rounded-lg bg-[--color-navy] px-4 py-2 font-semibold text-white"
          >
            Apply
          </button>
        </form>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="card rounded-2xl p-4">
          <p className="text-sm text-[--color-navy]/70">total_tasks</p>
          <p className="mt-2 text-3xl font-bold">{metrics.totalTasks}</p>
        </article>
        <article className="card rounded-2xl p-4">
          <p className="text-sm text-[--color-navy]/70">compliance</p>
          <p className="mt-2 text-3xl font-bold">{(metrics.compliance * 100).toFixed(1)}%</p>
        </article>
        <article className="card rounded-2xl p-4">
          <p className="text-sm text-[--color-navy]/70">late_rate</p>
          <p className="mt-2 text-3xl font-bold">{(metrics.lateRate * 100).toFixed(1)}%</p>
        </article>
        <article className="card rounded-2xl p-4">
          <p className="text-sm text-[--color-navy]/70">missed_rate</p>
          <p className="mt-2 text-3xl font-bold">{(metrics.missedRate * 100).toFixed(1)}%</p>
        </article>
      </section>
    </main>
  );
}
