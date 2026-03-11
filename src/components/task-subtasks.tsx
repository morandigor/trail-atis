"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import {
  getTaskDraftStorageKey,
  getTaskStorageKey,
  type StoredTaskState,
  type TaskStatus,
} from "@/lib/task-client-storage";

type TaskSubtasksProps = {
  taskId: string;
  status: TaskStatus;
  subtasks: string[];
  initialState: boolean[];
  returnTo: string;
  onCompleted?: (value: StoredTaskState) => void;
};

function persistTaskState(taskId: string, value: StoredTaskState) {
  window.localStorage.setItem(getTaskStorageKey(taskId), JSON.stringify(value));
  window.localStorage.removeItem(getTaskDraftStorageKey(taskId));
}

function readStoredSubtasks(taskId: string) {
  try {
    const raw = window.localStorage.getItem(getTaskDraftStorageKey(taskId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { subtasksState?: boolean[] };
    return Array.isArray(parsed.subtasksState) ? parsed.subtasksState.map((item) => Boolean(item)) : null;
  } catch {
    return null;
  }
}

export function TaskSubtasks({
  taskId,
  status,
  subtasks,
  initialState,
  returnTo,
  onCompleted,
}: TaskSubtasksProps) {
  const [state, setState] = useState<boolean[]>(() => {
    if (typeof window === "undefined") {
      return initialState;
    }

    const storedState = readStoredSubtasks(taskId);
    return storedState && storedState.length === initialState.length ? storedState : initialState;
  });
  const [syncingIndex, setSyncingIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
    } else {
      window.localStorage.setItem(
        getTaskDraftStorageKey(taskId),
        JSON.stringify({
          subtasksState: next,
        }),
      );
    }

    setSyncingIndex(null);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEdit || !allDone || isSyncing || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const formData = new FormData(event.currentTarget);
    formData.set("return_to", returnTo);
    formData.set("subtasks_state", JSON.stringify(state));

    const completedBy = (formData.get("completed_by")?.toString() || "").trim();
    const notes = (formData.get("notes")?.toString() || "").trim();
    const response = await fetch(`/api/tasks/${taskId}/complete`, {
      method: "POST",
      headers: {
        "x-requested-with": "fetch",
      },
      body: formData,
    });

    if (!response.ok) {
      setSubmitError("Unable to save this task.");
      setIsSubmitting(false);
      return;
    }

    const result = (await response.json()) as { status?: StoredTaskState["status"] };

    const storedState: StoredTaskState = {
      status: result.status === "completed_late" ? "completed_late" : "completed_on_time",
      completedBy: completedBy || null,
      notes: notes || null,
      subtasksState: state,
    };

    persistTaskState(taskId, storedState);
    onCompleted?.(storedState);
    window.location.assign(returnTo);
  };

  return (
    <>
      <form
        action={`/api/tasks/${taskId}/complete`}
        method="post"
        onSubmit={onSubmit}
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
      ) : submitError ? (
        <p className="mt-2 text-xs text-red-700">{submitError}</p>
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
