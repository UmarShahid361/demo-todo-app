import { daysBetween } from "./dates.js";
import { PRIORITIES } from "./tasks.js";

/** Which board column a task belongs in on `today`. */
export function columnFor(task, today) {
  if (task.done) return "done";
  if (!task.due) return "upcoming";
  const days = daysBetween(today, task.due);
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  return "upcoming";
}

export const COLUMNS = ["overdue", "today", "upcoming", "done"];

/**
 * Filters by free text (title, notes, #tag), tag, priority and status.
 * Every filter is optional; an empty filter keeps everything.
 */
export function filterTasks(tasks, { text = "", tag = null, priority = null, status = "all" } = {}) {
  const needle = text.trim().toLowerCase();
  return tasks.filter((task) => {
    if (status === "open" && task.done) return false;
    if (status === "done" && !task.done) return false;
    if (tag && !task.tags.includes(tag)) return false;
    if (priority && task.priority !== priority) return false;
    if (!needle) return true;
    if (needle.startsWith("#")) return task.tags.some((t) => t.startsWith(needle.slice(1)));
    return task.title.toLowerCase().includes(needle) || task.notes.toLowerCase().includes(needle);
  });
}

/** Highest priority first, then earliest due date (no date last), then oldest. */
export function sortTasks(tasks) {
  const rank = (task) => PRIORITIES.length - PRIORITIES.indexOf(task.priority);
  return [...tasks].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      (a.due ?? "9999-12-31").localeCompare(b.due ?? "9999-12-31") ||
      a.createdAt.localeCompare(b.createdAt),
  );
}

/** Tasks grouped into the board's columns, each column sorted. */
export function board(tasks, today) {
  const grouped = Object.fromEntries(COLUMNS.map((column) => [column, []]));
  for (const task of tasks) grouped[columnFor(task, today)].push(task);
  for (const column of COLUMNS) grouped[column] = sortTasks(grouped[column]);
  return grouped;
}
