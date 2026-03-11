import { WEEKDAY_CODES, type WeekdayCode, toUtcTimestamp } from "@/lib/time";
import {
  ensureChecklistStorage,
  readChecklistStorage,
  writeChecklistStorage,
} from "@/lib/checklist-storage";

type Status = "pending" | "completed_on_time" | "completed_late" | "missed";

type Recurrence = { type: "daily" } | { type: "weekly"; days: WeekdayCode[] };

export type TaskTemplate = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  subtasks: string[];
  scheduled_time: string;
  recurrence: Recurrence;
  tolerance_minutes: number;
  active: boolean;
  created_at: string;
};

export type TaskInstance = {
  id: string;
  template_id: string;
  store_id: string;
  scheduled_at: string;
  status: Status;
  subtasks_state: boolean[];
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  created_at: string;
};

export type TodayTaskRow = TaskInstance & {
  task_templates: TaskTemplate | null;
};

export type SubmissionRow = TaskInstance & {
  task_templates: TaskTemplate | null;
};

type Store = {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
};

type LocalDb = {
  schema_version: number;
  stores: Store[];
  task_templates: TaskTemplate[];
  task_instances: TaskInstance[];
};

const CURRENT_SCHEMA_VERSION = 2;

const defaultTemplates: Omit<TaskTemplate, "id" | "created_at">[] = [
  {
    title: "Pleo receipts uploaded",
    category: "Admin",
    description: null,
    subtasks: [],
    scheduled_time: "15:00",
    recurrence: { type: "weekly", days: ["mon"] },
    tolerance_minutes: 10,
    active: true,
  },
  {
    title: "Daily time sheets",
    category: "Admin",
    description: null,
    subtasks: ["All Staff shift hours checked", "Timesheets approved"],
    scheduled_time: "09:30",
    recurrence: { type: "weekly", days: ["mon", "wed"] },
    tolerance_minutes: 10,
    active: true,
  },
  {
    title: "Project checklist tasks complete (see next tab)",
    category: "Admin",
    description: null,
    subtasks: [],
    scheduled_time: "15:00",
    recurrence: { type: "weekly", days: ["mon"] },
    tolerance_minutes: 10,
    active: true,
  },
  {
    title: "Salad spinner cleaning",
    category: "Cleaning",
    description: null,
    subtasks: ["No debris present", "Machinery fully cleaned"],
    scheduled_time: "20:00",
    recurrence: { type: "daily" },
    tolerance_minutes: 15,
    active: true,
  },
  {
    title: "Reco filter check",
    category: "Maintenance",
    description: null,
    subtasks: [],
    scheduled_time: "10:00",
    recurrence: { type: "weekly", days: ["mon"] },
    tolerance_minutes: 15,
    active: true,
  },
  {
    title: "Pump Cleaning",
    category: "Maintenance",
    description: null,
    subtasks: [
      "Visual check - no solid residue in the tank",
      "Visual check - floater is free from blockages",
    ],
    scheduled_time: "11:00",
    recurrence: { type: "daily" },
    tolerance_minutes: 15,
    active: true,
  },
  {
    title: "Cook line daily clean morning",
    category: "Maintenance",
    description: null,
    subtasks: [
      "Oven steam program checked",
      "Gaskets not damaged",
      "Clean canopy + drawer",
      "No leaks or cracks",
    ],
    scheduled_time: "09:00",
    recurrence: { type: "daily" },
    tolerance_minutes: 15,
    active: true,
  },
  {
    title: "MBWA Checklist- Positive Customer experience focus",
    category: "Operations",
    description: null,
    subtasks: [
      "Exterior and entrance clean, safe, and welcoming.",
      "Customers acknowledged quickly with warm, proactive service.",
      "Queue flow controlled and enough staff on the line.",
      "Dining area standards met: tables, floors, bins, bathrooms.",
      "Ambience right for daypart: lighting, music, temperature.",
      "Food and drinks presented correctly and look fresh.",
      "Displays and touchpoints ready: cakes, menus, promos, C&C tablets.",
      "No operational bottlenecks; tablets working and SOP followed.",
    ],
    scheduled_time: "10:00",
    recurrence: { type: "daily" },
    tolerance_minutes: 10,
    active: true,
  },
  {
    title: "Pre dinner checklist",
    category: "Operations",
    description: null,
    subtasks: [
      "Dinner roster filled out and communicated",
      "Afternoon checklist completed",
      "Hot food cooked based on afternoon par sheet",
      "Afternoon par sheet completed",
      "Clean Staubs and refill hot toppings",
    ],
    scheduled_time: "17:00",
    recurrence: { type: "daily" },
    tolerance_minutes: 10,
    active: true,
  },
  {
    title: "Afternoon checklist",
    category: "Operations",
    description: null,
    subtasks: [
      "Complete backups and communicate low stock to kitchen.",
      "Refill front line to par (no overfill) and keep it clean.",
      "Reset lobby: seating, tables, bins, floor, menus, cutlery.",
      "Reset line: bases, ingredients, dressings, crunches, grains.",
      "Refresh fridges and shelves using FIFO and clear labels.",
      "Clean key stations: line, fridges, front glass, floor.",
      "Restock packaging and set packing station for rush.",
      "Close support checks: toilets clean/stocked and tech charging.",
    ],
    scheduled_time: "15:00",
    recurrence: { type: "daily" },
    tolerance_minutes: 10,
    active: true,
  },
  {
    title: "Ancillary Display check",
    category: "Operations",
    description: null,
    subtasks: [
      "Tray Setup and Display",
      "Line all trays with baking paper",
      "Follow the correct tray layout for your site 3, 4, or 5 tray configuration",
      "Layer baking paper only between banana bread slices",
      "Labels match products and are positioned correctly",
      "Prop up all display trays to highlight the products",
      "Quality Checks",
      "Products appear fresh, evenly spaced, and correctly filled",
      "Baking paper clean and positioned correctly",
      "Display visually matches SOP examples for your tray count",
    ],
    scheduled_time: "10:00",
    recurrence: { type: "weekly", days: ["mon", "wed", "thu", "fri", "sat"] },
    tolerance_minutes: 10,
    active: true,
  },
  {
    title: "Protein Checks",
    category: "Operations",
    description: null,
    subtasks: [
      "Blackened chicken - mix through the fat underneath to ensure it all looks moist",
      "Herb Grilled Chicken - Chicken should be evenly-sliced, moist, slightly charred",
      "Steak - well-browned on the outside and pink and juicy in the middle of every slice",
      "Salmon - golden brown in parts and still soft and moist in the middle",
      "Tofu - dressed in the tofu marinade, golden brown, be firm and have some crisp edges but not be chewy or dry",
      "Miso Ginger Sweet Potato Wedges - Charred not mushy",
      "Umami Mushrooms - Charred, Chestnuts + Portobello mix present, well crumbled",
    ],
    scheduled_time: "11:00",
    recurrence: { type: "daily" },
    tolerance_minutes: 10,
    active: true,
  },
  {
    title: "Daily Team briefing",
    category: "People",
    description: null,
    subtasks: ["Team briefing held before opening"],
    scheduled_time: "11:00",
    recurrence: { type: "daily" },
    tolerance_minutes: 10,
    active: true,
  },
  {
    title: "Team bonus achievement",
    category: "People",
    description: null,
    subtasks: [],
    scheduled_time: "10:00",
    recurrence: { type: "weekly", days: ["mon"] },
    tolerance_minutes: 10,
    active: true,
  },
  {
    title: "Daily line count proteins",
    category: "Stock Count",
    description: null,
    subtasks: [
      "Both Chickens Counted",
      "Steak Counted",
      "Tofu Counted",
      "Salmon Counted",
    ],
    scheduled_time: "20:00",
    recurrence: { type: "daily" },
    tolerance_minutes: 10,
    active: true,
  },
  {
    title: "Kiosk Checks",
    category: "Technology",
    description: null,
    subtasks: ["All kiosks powered on", "All card readers powered on"],
    scheduled_time: "10:00",
    recurrence: { type: "daily" },
    tolerance_minutes: 10,
    active: true,
  },
  {
    title: "Checking snooze products for online channels",
    category: "Technology",
    description: null,
    subtasks: [
      "Sense-check before dinner service that all items snoozed are genuinely out of stock",
    ],
    scheduled_time: "11:00",
    recurrence: { type: "daily" },
    tolerance_minutes: 10,
    active: true,
  },
];

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return crypto.randomUUID();
}

function shouldSchedule(recurrence: Recurrence, date: Date) {
  if (recurrence.type === "daily") {
    return true;
  }

  return recurrence.days.includes(WEEKDAY_CODES[date.getUTCDay()]);
}

function normalizeTime(input: string) {
  const [h = "00", m = "00"] = input.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

function getCurrentWeekMonday() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const day = start.getUTCDay();
  start.setUTCDate(start.getUTCDate() + (day === 0 ? -6 : 1 - day));
  return start;
}

function instantiateDefaults(storeId: string): LocalDb {
  return {
    schema_version: CURRENT_SCHEMA_VERSION,
    stores: [
      {
        id: storeId,
        name: "Regent Street",
        active: true,
        created_at: nowIso(),
      },
    ],
    task_templates: defaultTemplates.map((template) => ({
      ...template,
      id: newId(),
      created_at: nowIso(),
    })),
    task_instances: [],
  };
}

function templateKey(template: Pick<TaskTemplate, "title" | "category" | "scheduled_time">) {
  return `${template.category.toLowerCase()}::${template.scheduled_time}::${template.title.toLowerCase()}`;
}

function normalizeDb(db: LocalDb): LocalDb {
  const normalized: LocalDb = {
    schema_version: db.schema_version ?? 1,
    stores: db.stores ?? [],
    task_templates: (db.task_templates ?? []).map((template) => ({
      ...template,
      subtasks: Array.isArray(template.subtasks) ? template.subtasks : [],
      scheduled_time: normalizeTime(template.scheduled_time ?? "00:00"),
    })),
    task_instances: (db.task_instances ?? []).map((instance) => ({
      ...instance,
      subtasks_state: Array.isArray(instance.subtasks_state) ? instance.subtasks_state : [],
    })),
  };

  if (normalized.stores.length === 0) {
    normalized.stores = [
      {
        id: newId(),
        name: "Regent Street",
        active: true,
        created_at: nowIso(),
      },
    ];
  }

  if (normalized.schema_version < CURRENT_SCHEMA_VERSION) {
    const migrated = instantiateDefaults(normalized.stores[0].id);
    migrated.stores[0] = normalized.stores[0];
    return migrated;
  }

  const existingKeys = new Set(normalized.task_templates.map((template) => templateKey(template)));

  for (const template of defaultTemplates) {
    if (existingKeys.has(templateKey(template))) {
      continue;
    }

    normalized.task_templates.push({
      ...template,
      id: newId(),
      created_at: nowIso(),
    });
  }

  const byTemplateId = new Map(normalized.task_templates.map((template) => [template.id, template]));

  normalized.task_instances = normalized.task_instances
    .filter((instance) => byTemplateId.has(instance.template_id))
    .map((instance) => {
    const template = byTemplateId.get(instance.template_id);
    const subtaskLength = template?.subtasks.length ?? 0;
    const base = Array.from({ length: subtaskLength }, (_, index) =>
      Boolean(instance.subtasks_state[index]),
    );
    return {
      ...instance,
      subtasks_state: base,
    };
    });

  normalized.schema_version = CURRENT_SCHEMA_VERSION;
  return normalized;
}

async function ensureDb() {
  await ensureChecklistStorage();

  try {
    const raw = await readChecklistStorage();
    const parsed = JSON.parse(raw) as LocalDb;
    const normalized = normalizeDb(parsed);
    await writeChecklistStorage(JSON.stringify(normalized, null, 2));
  } catch {
    const initial = instantiateDefaults(newId());
    await writeChecklistStorage(JSON.stringify(initial, null, 2));
  }
}

async function readDb() {
  await ensureDb();
  const raw = await readChecklistStorage();
  return normalizeDb(JSON.parse(raw) as LocalDb);
}

async function writeDb(db: LocalDb) {
  await writeChecklistStorage(JSON.stringify(normalizeDb(db), null, 2));
}

export async function generateInstances(days = 14, startOffsetDays = -7) {
  const db = await readDb();
  const store = db.stores[0];
  if (!store) {
    return 0;
  }

  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);

  let inserted = 0;

  for (const template of db.task_templates.filter((item) => item.active)) {
    for (let offset = startOffsetDays; offset < startOffsetDays + days; offset += 1) {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + offset);

      if (!shouldSchedule(template.recurrence, date)) {
        continue;
      }

      const scheduledAt = toUtcTimestamp(date, template.scheduled_time).toISOString();

      const exists = db.task_instances.some(
        (instance) =>
          instance.store_id === store.id &&
          instance.template_id === template.id &&
          instance.scheduled_at === scheduledAt,
      );

      if (exists) {
        continue;
      }

      db.task_instances.push({
        id: newId(),
        template_id: template.id,
        store_id: store.id,
        scheduled_at: scheduledAt,
        status: "pending",
        subtasks_state: template.subtasks.map(() => false),
        completed_at: null,
        completed_by: null,
        notes: null,
        created_at: nowIso(),
      });

      inserted += 1;
    }
  }

  await writeDb(db);
  return inserted;
}

export async function reconcileMissed() {
  const db = await readDb();
  const threshold = Date.now() - 2 * 60 * 60 * 1000;
  let count = 0;

  for (const instance of db.task_instances) {
    if (instance.status !== "pending") {
      continue;
    }

    if (new Date(instance.scheduled_at).getTime() < threshold) {
      instance.status = "missed";
      count += 1;
    }
  }

  await writeDb(db);
  return count;
}

export async function listTasksForWeekday(dayCode: WeekdayCode) {
  await generateInstances(21);
  await reconcileMissed();

  const db = await readDb();
  const weekStart = getCurrentWeekMonday();
  const dayIndex = WEEKDAY_CODES.indexOf(dayCode);
  const offset = dayIndex === 0 ? 6 : dayIndex - 1;
  const start = new Date(weekStart);
  start.setUTCDate(weekStart.getUTCDate() + offset);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const byId = new Map(db.task_templates.map((template) => [template.id, template]));

  const rows: TodayTaskRow[] = db.task_instances
    .filter((instance) => {
      const time = new Date(instance.scheduled_at).getTime();
      return time >= start.getTime() && time < end.getTime();
    })
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    .map((instance) => ({
      ...instance,
      task_templates: byId.get(instance.template_id) ?? null,
    }));

  return rows;
}

export async function toggleTaskSubtask(id: string, index: number, checked: boolean) {
  const db = await readDb();
  const instance = db.task_instances.find((item) => item.id === id);
  if (!instance || (instance.status !== "pending" && instance.status !== "missed")) {
    return false;
  }

  if (index < 0 || index >= instance.subtasks_state.length) {
    return false;
  }

  instance.subtasks_state[index] = checked;
  await writeDb(db);
  return true;
}

function normalizeSubmittedSubtasks(
  submittedState: boolean[] | null | undefined,
  currentState: boolean[],
) {
  if (!Array.isArray(submittedState) || submittedState.length !== currentState.length) {
    return currentState;
  }

  return submittedState.map((value) => Boolean(value));
}

export async function completeTask(
  id: string,
  notes: string | null,
  completedBy: string,
  submittedState?: boolean[] | null,
) {
  const db = await readDb();
  const instance = db.task_instances.find((item) => item.id === id);
  if (!instance || (instance.status !== "pending" && instance.status !== "missed")) {
    return { ok: false, reason: "not_open" as const };
  }

  instance.subtasks_state = normalizeSubmittedSubtasks(submittedState, instance.subtasks_state);

  if (instance.subtasks_state.some((value) => !value)) {
    return { ok: false, reason: "subtasks_incomplete" as const };
  }

  const template = db.task_templates.find((item) => item.id === instance.template_id);
  const toleranceMinutes = template?.tolerance_minutes ?? 10;

  const completedAt = new Date();
  const deadline = new Date(instance.scheduled_at);
  deadline.setMinutes(deadline.getMinutes() + toleranceMinutes);

  instance.completed_at = completedAt.toISOString();
  instance.completed_by = completedBy.trim();
  instance.notes = notes && notes.trim().length > 0 ? notes.trim() : null;
  if (instance.status === "missed") {
    instance.status = "completed_late";
  } else {
    instance.status = completedAt.getTime() <= deadline.getTime() ? "completed_on_time" : "completed_late";
  }

  await writeDb(db);
  return { ok: true as const, status: instance.status };
}

export async function listWeekSummary() {
  await generateInstances(21);
  await reconcileMissed();

  const db = await readDb();
  const weekStart = getCurrentWeekMonday();
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  const tasks = db.task_instances.filter((instance) => {
    const time = new Date(instance.scheduled_at).getTime();
    return time >= weekStart.getTime() && time < weekEnd.getTime();
  });

  return Array.from({ length: 7 }, (_, index) => {
    const start = new Date(weekStart);
    start.setUTCDate(start.getUTCDate() + index);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const dayTasks = tasks.filter((item) => {
      const time = new Date(item.scheduled_at).getTime();
      return time >= start.getTime() && time < end.getTime();
    });

    return {
      date: start.toISOString(),
      total: dayTasks.length,
      onTime: dayTasks.filter((item) => item.status === "completed_on_time").length,
      late: dayTasks.filter((item) => item.status === "completed_late").length,
      missed: dayTasks.filter((item) => item.status === "missed").length,
    };
  });
}

export async function listSubmissionHistory(params?: {
  from?: string;
  to?: string;
  status?: "all" | "completed_on_time" | "completed_late";
}) {
  await generateInstances(21);
  await reconcileMissed();

  const db = await readDb();
  const byId = new Map(db.task_templates.map((template) => [template.id, template]));

  const from = params?.from
    ? new Date(`${params.from}T00:00:00.000Z`).getTime()
    : Number.NEGATIVE_INFINITY;
  const to = params?.to
    ? new Date(`${params.to}T23:59:59.999Z`).getTime()
    : Number.POSITIVE_INFINITY;
  const statusFilter = params?.status ?? "all";

  const rows: SubmissionRow[] = db.task_instances
    .filter((instance) => instance.completed_at !== null)
    .filter((instance) => {
      const time = new Date(instance.completed_at as string).getTime();
      return time >= from && time <= to;
    })
    .filter((instance) => {
      if (statusFilter === "all") return true;
      return instance.status === statusFilter;
    })
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""))
    .map((instance) => ({
      ...instance,
      task_templates: byId.get(instance.template_id) ?? null,
    }));

  return rows;
}

export async function reportMetrics(period: "today" | "week" | "range", from?: string, to?: string) {
  await generateInstances(21);
  await reconcileMissed();

  const db = await readDb();

  let start: Date;
  let end: Date;

  if (period === "today") {
    start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
  } else if (period === "week") {
    start = getCurrentWeekMonday();
    end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
  } else {
    start = new Date(`${from ?? new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
    end = new Date(`${to ?? new Date().toISOString().slice(0, 10)}T23:59:59.999Z`);
  }

  const rows = db.task_instances.filter((instance) => {
    const time = new Date(instance.scheduled_at).getTime();
    return time >= start.getTime() && time <= end.getTime();
  });

  const totalTasks = rows.length;
  const onTime = rows.filter((row) => row.status === "completed_on_time").length;
  const late = rows.filter((row) => row.status === "completed_late").length;
  const missed = rows.filter((row) => row.status === "missed").length;

  return {
    totalTasks,
    compliance: totalTasks === 0 ? 0 : (onTime + late) / totalTasks,
    lateRate: totalTasks === 0 ? 0 : late / totalTasks,
    missedRate: totalTasks === 0 ? 0 : missed / totalTasks,
  };
}

export async function listTemplates() {
  const db = await readDb();
  return db.task_templates.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
}

export async function createTemplate(input: {
  title: string;
  category: string;
  description: string | null;
  subtasks: string[];
  scheduled_time: string;
  recurrence: Recurrence;
  tolerance_minutes: number;
  active: boolean;
}) {
  const db = await readDb();
  db.task_templates.push({
    ...input,
    id: newId(),
    scheduled_time: normalizeTime(input.scheduled_time),
    created_at: nowIso(),
  });
  await writeDb(db);
}

export async function updateTemplate(
  id: string,
  input: {
    title: string;
    category: string;
    description: string | null;
    subtasks: string[];
    scheduled_time: string;
    recurrence: Recurrence;
    tolerance_minutes: number;
    active: boolean;
  },
) {
  const db = await readDb();
  const template = db.task_templates.find((item) => item.id === id);
  if (!template) {
    return false;
  }

  template.title = input.title;
  template.category = input.category;
  template.description = input.description;
  template.subtasks = input.subtasks;
  template.scheduled_time = normalizeTime(input.scheduled_time);
  template.recurrence = input.recurrence;
  template.tolerance_minutes = input.tolerance_minutes;
  template.active = input.active;

  for (const instance of db.task_instances) {
    if (instance.template_id !== id || instance.status !== "pending") {
      continue;
    }

    instance.subtasks_state = input.subtasks.map((_, index) => Boolean(instance.subtasks_state[index]));
  }

  await writeDb(db);
  return true;
}

export async function deleteTemplate(id: string) {
  const db = await readDb();
  db.task_instances = db.task_instances.filter((instance) => instance.template_id !== id);
  const before = db.task_templates.length;
  db.task_templates = db.task_templates.filter((template) => template.id !== id);
  await writeDb(db);
  return before !== db.task_templates.length;
}
