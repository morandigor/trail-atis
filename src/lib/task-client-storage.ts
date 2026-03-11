export type TaskStatus = "pending" | "completed_on_time" | "completed_late" | "missed";

export type StoredTaskState = {
  status: Extract<TaskStatus, "completed_on_time" | "completed_late">;
  completedBy: string | null;
  notes: string | null;
  subtasksState: boolean[];
};

export function getTaskStorageKey(taskId: string) {
  return `checklist-task-state:${taskId}`;
}

export function getTaskDraftStorageKey(taskId: string) {
  return `checklist-task-draft:${taskId}`;
}
