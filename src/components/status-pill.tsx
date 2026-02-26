import clsx from "clsx";

type Status = "pending" | "completed_on_time" | "completed_late" | "missed";

const labelByStatus: Record<Status, string> = {
  pending: "Pending",
  completed_on_time: "On time",
  completed_late: "Late",
  missed: "Missed",
};

export function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        {
          "bg-[--color-butter] text-[--color-navy]": status === "pending",
          "bg-[--color-acid] text-[--color-navy]": status === "completed_on_time",
          "bg-[--color-lemon] text-[--color-navy]": status === "completed_late",
          "bg-red-200 text-red-900": status === "missed",
        },
      )}
    >
      {labelByStatus[status]}
    </span>
  );
}
