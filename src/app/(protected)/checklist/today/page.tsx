import { StatusPill } from "@/components/status-pill";
import { TaskSubtasks } from "@/components/task-subtasks";
import { listTasksForWeekday } from "@/lib/local-db";
import { formatTime, WEEKDAY_CODES, type WeekdayCode } from "@/lib/time";

export const dynamic = "force-dynamic";

const weekDayOrder: WeekdayCode[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const weekDayLabels: Record<WeekdayCode, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

function getDefaultDayCode(): WeekdayCode {
  const day = new Date().getUTCDay();
  return WEEKDAY_CODES[day];
}

export default async function TodayChecklistPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const requestedDay = (params.day ?? getDefaultDayCode()) as WeekdayCode;
  const day = WEEKDAY_CODES.includes(requestedDay) ? requestedDay : getDefaultDayCode();
  const tasks = await listTasksForWeekday(day);
  const visibleTasks = tasks.filter((task) => {
    const title = task.task_templates?.title?.trim();
    return Boolean(task.task_templates && title);
  });

  return (
    <main className="space-y-5">
      <div className="card rounded-2xl p-5">
        <h2 className="text-2xl font-bold text-[--color-navy]">Daily Checklist</h2>
        <p className="text-sm text-[--color-navy]/75">Store: Regent Street</p>
        <p className="mt-1 text-sm font-semibold text-[--color-navy]/85">
          Selected day: {weekDayLabels[day]}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {weekDayOrder.map((dayCode) => (
            <a
              key={dayCode}
              href={`/checklist/today?day=${dayCode}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                day === dayCode
                  ? "bg-[var(--color-navy)] text-white"
                  : "bg-[--color-butter] text-[--color-navy] hover:bg-[--color-lemon]"
              }`}
            >
              {weekDayLabels[dayCode]}
            </a>
          ))}
        </div>
      </div>

      <section className="space-y-3">
        {visibleTasks.length === 0 ? (
          <div className="card rounded-2xl p-6 text-sm text-[--color-navy]/70">
            No tasks found for {weekDayLabels[day]}.
          </div>
        ) : null}

        {visibleTasks.map((task) => (
          <article key={task.id} className="card rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[--color-navy]/60">
                  {task.task_templates?.category ?? "Uncategorized"}
                </p>
                <h3 className="text-lg font-semibold text-[--color-navy]">
                  {task.task_templates?.title ?? "Untitled task"}
                </h3>
                <p className="text-sm text-[--color-navy]/70">
                  Scheduled at {formatTime(task.scheduled_at)}
                </p>
              </div>
              <StatusPill status={task.status} />
            </div>

            <TaskSubtasks
              taskId={task.id}
              status={task.status}
              subtasks={task.task_templates?.subtasks ?? []}
              initialState={task.subtasks_state}
              returnTo={`/checklist/today?day=${day}`}
            />

            {task.completed_by ? (
              <p className="mt-3 text-sm text-[--color-navy]/70">Completed by: {task.completed_by}</p>
            ) : null}

            {task.notes ? (
              <p className="mt-3 rounded-lg bg-[--color-butter] px-3 py-2 text-sm text-[--color-navy]/80">
                Note: {task.notes}
              </p>
            ) : null}
          </article>
        ))}
      </section>
    </main>
  );
}
