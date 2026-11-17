import { isValidDate } from "./dates.js";

export const PRIORITIES = ["low", "medium", "high"];

export class TaskError extends Error {}

let lastId = 0;
/** Unique and increasing, even for tasks created in the same millisecond. */
export function nextId(now = Date.now()) {
  lastId = Math.max(lastId + 1, now);
  return lastId;
}

function normalizeTags(tags) {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase().replace(/^#/, "")).filter(Boolean))].sort();
}

/** Validates and fills defaults. Throws TaskError on bad input. */
export function createTask({ title, priority = "medium", due = null, tags = [], notes = "" }, now = Date.now()) {
  const trimmed = String(title ?? "").trim();
  if (!trimmed) throw new TaskError("A task needs a title.");
  if (trimmed.length > 200) throw new TaskError("Keep the title under 200 characters.");
  if (!PRIORITIES.includes(priority)) throw new TaskError(`Priority must be one of ${PRIORITIES.join(", ")}.`);
  if (due !== null && !isValidDate(due)) throw new TaskError("Due date must be YYYY-MM-DD.");
  return {
    id: nextId(now),
    title: trimmed,
    priority,
    due,
    tags: normalizeTags(tags),
    notes,
    done: false,
    completedAt: null,
    createdAt: new Date(now).toISOString(),
  };
}

/** Applies a partial edit, re-validating the fields it touches. */
export function updateTask(task, changes) {
  const merged = { ...task, ...changes };
  const checked = createTask(merged, Date.parse(task.createdAt));
  return { ...merged, title: checked.title, tags: checked.tags };
}

export function completeTask(task, today) {
  return task.done ? task : { ...task, done: true, completedAt: today };
}

export function reopenTask(task) {
  return { ...task, done: false, completedAt: null };
}
