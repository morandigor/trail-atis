import { TaskCard } from "@/components/task-card";
import { listTasksForWeekday } from "@/lib/local-db";
import { WEEKDAY_CODES, type WeekdayCode } from "@/lib/time";

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
          <TaskCard
            key={task.id}
            taskId={task.id}
            title={task.task_templates?.title ?? "Untitled task"}
            category={task.task_templates?.category ?? "Uncategorized"}
            scheduledAt={task.scheduled_at}
            status={task.status}
            subtasks={task.task_templates?.subtasks ?? []}
            initialState={task.subtasks_state}
            returnTo={`/checklist/today?day=${day}`}
            completedBy={task.completed_by}
            notes={task.notes}
          />
        ))}
      </section>
    </main>
  );
}
