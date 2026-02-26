import { listWeekSummary } from "@/lib/local-db";
import { formatShortDate } from "@/lib/time";

export default async function WeeklyChecklistPage() {
  const days = await listWeekSummary();

  return (
    <main className="space-y-4">
      <div className="card rounded-2xl p-5">
        <h2 className="text-2xl font-bold text-[--color-navy]">Weekly View</h2>
        <p className="text-sm text-[--color-navy]/75">Current week overview for Regent Street.</p>
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {days.map((day) => (
          <article key={day.date} className="card rounded-2xl p-4">
            <h3 className="text-lg font-semibold text-[--color-navy]">{formatShortDate(day.date)}</h3>
            <div className="mt-3 space-y-1 text-sm text-[--color-navy]/80">
              <p>Total: {day.total}</p>
              <p>On time: {day.onTime}</p>
              <p>Late: {day.late}</p>
              <p>Missed: {day.missed}</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
