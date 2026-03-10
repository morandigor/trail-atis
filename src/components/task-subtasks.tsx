"use client";

import { useMemo, useState } from "react";

type TaskSubtasksProps = {
  taskId: string;
  status: "pending" | "completed_on_time" | "completed_late" | "missed";
  subtasks: string[];
  initialState: boolean[];
  returnTo: string;
};

export function TaskSubtasks({ taskId, status, subtasks, initialState, returnTo }: TaskSubtasksProps) {
  const [state, setState] = useState<boolean[]>(initialState);
  const [syncingIndex, setSyncingIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canEdit = status === "pending" || status === "missed";
  const isSyncing = syncingIndex !== null;

  const allDone = useMemo(() => state.every(Boolean), [state]);

  const onToggle = async (index: number, checked: boolean) => {
    const previous = [...state];
    const next = [...state];
    next[index] = checked;
    setState(next);
    setSyncingIndex(index);

    const response = await fetch(`/api/tasks/${taskId}/subtasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ index, checked }),
    });

    if (!response.ok) {
      setState(previous);
    }

    setSyncingIndex(null);
  };

  return (
    <>
      <form
        action={`/api/tasks/${taskId}/complete`}
        method="post"
        onSubmit={() => setIsSubmitting(true)}
        className="mt-4 grid gap-2 md:grid-cols-3"
      >
        <input
          type="text"
          name="completed_by"
          placeholder="Team member name"
          required
          disabled={!canEdit || isSubmitting}
          className="rounded-lg border border-[--color-navy]/25 bg-white px-3 py-2 text-sm outline-none focus:border-[--color-navy] disabled:opacity-50"
        />
        <input
          type="text"
          name="notes"
          placeholder="Optional notes"
          disabled={!canEdit || isSubmitting}
          className="rounded-lg border border-[--color-navy]/25 bg-white px-3 py-2 text-sm outline-none focus:border-[--color-navy] disabled:opacity-50"
        />
        <div className="flex gap-2">
          <input type="hidden" name="return_to" value={returnTo} />
          <input type="hidden" name="subtasks_state" value={JSON.stringify(state)} />
          <button
            type="submit"
            disabled={!canEdit || !allDone || isSyncing || isSubmitting}
            className="rounded-lg border border-[--color-navy] bg-[--color-acid] px-4 py-2 text-sm font-bold text-[--color-navy] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Mark as complete
          </button>
        </div>
      </form>

      {!canEdit ? (
        <p className="mt-2 text-xs text-[--color-navy]/65">This task is already completed.</p>
      ) : isSyncing ? (
        <p className="mt-2 text-xs text-[--color-navy]/65">Saving subtasks...</p>
      ) : !allDone ? (
        <p className="mt-2 text-xs text-[--color-navy]/65">Check all subtasks to enable submit.</p>
      ) : null}

      {subtasks.length > 0 ? (
        <div className="mt-4 rounded-lg border border-[--color-navy]/15 bg-white/70 p-3">
          <p className="mb-2 text-sm font-semibold text-[--color-navy]">Subtasks</p>
          <div className="space-y-2">
            {subtasks.map((subtask, index) => (
              <label key={`${taskId}-${index}`} className="flex items-start gap-2 text-sm text-[--color-navy]/85">
                <input
                  type="checkbox"
                  checked={Boolean(state[index])}
                  disabled={!canEdit || isSubmitting || syncingIndex === index}
                  onChange={(event) => onToggle(index, event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[--color-navy]/40"
                />
                <span>{subtask}</span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-[--color-navy]/65">No subtasks. You can complete this task directly.</p>
      )}
    </>
  );
}
