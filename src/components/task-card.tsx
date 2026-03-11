"use client";

import { useEffect, useState } from "react";

import { StatusPill } from "@/components/status-pill";
import { TaskSubtasks } from "@/components/task-subtasks";
import { formatTime } from "@/lib/time";
import { getTaskStorageKey, type StoredTaskState, type TaskStatus } from "@/lib/task-client-storage";

type TaskCardProps = {
  taskId: string;
  title: string;
  category: string;
  scheduledAt: string;
  deadlineAt: string | null;
  status: TaskStatus;
  subtasks: string[];
  initialState: boolean[];
  returnTo: string;
  completedBy: string | null;
  notes: string | null;
};

function readStoredTaskState(taskId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getTaskStorageKey(taskId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredTaskState;
    if (
      parsed.status !== "completed_on_time" &&
      parsed.status !== "completed_late"
    ) {
      return null;
    }

    return {
      status: parsed.status,
      completedBy: typeof parsed.completedBy === "string" ? parsed.completedBy : null,
      notes: typeof parsed.notes === "string" ? parsed.notes : null,
      subtasksState: Array.isArray(parsed.subtasksState)
        ? parsed.subtasksState.map((item) => Boolean(item))
        : [],
    } satisfies StoredTaskState;
  } catch {
    return null;
  }
}

export function TaskCard({
  taskId,
  title,
  category,
  scheduledAt,
  deadlineAt,
  status,
  subtasks,
  initialState,
  returnTo,
  completedBy,
  notes,
}: TaskCardProps) {
  const [storedState, setStoredState] = useState<StoredTaskState | null>(null);

  useEffect(() => {
    setStoredState(readStoredTaskState(taskId));
  }, [taskId]);

  const effectiveStatus = storedState?.status ?? status;
  const effectiveCompletedBy = storedState?.completedBy ?? completedBy;
  const effectiveNotes = storedState?.notes ?? notes;
  const effectiveState =
    storedState && storedState.subtasksState.length === subtasks.length
      ? storedState.subtasksState
      : initialState;

  return (
    <article className="card rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[--color-navy]/60">
            {category}
          </p>
          <h3 className="text-lg font-semibold text-[--color-navy]">{title}</h3>
          <p className="text-sm text-[--color-navy]/70">
            Scheduled at {formatTime(scheduledAt)}
            {deadlineAt ? ` • Deadline at ${formatTime(deadlineAt)}` : ""}
          </p>
        </div>
        <StatusPill status={effectiveStatus} />
      </div>

      <TaskSubtasks
        key={`${taskId}:${effectiveStatus}:${effectiveState.join(",")}`}
        taskId={taskId}
        status={effectiveStatus}
        subtasks={subtasks}
        initialState={effectiveState}
        returnTo={returnTo}
        onCompleted={setStoredState}
      />

      {effectiveCompletedBy ? (
        <p className="mt-3 text-sm text-[--color-navy]/70">Completed by: {effectiveCompletedBy}</p>
      ) : null}

      {effectiveNotes ? (
        <p className="mt-3 rounded-lg bg-[--color-butter] px-3 py-2 text-sm text-[--color-navy]/80">
          Note: {effectiveNotes}
        </p>
      ) : null}
    </article>
  );
}
