import { addDays } from "./dates.js";
import { columnFor } from "./query.js";

/** The numbers shown above the board. */
export function stats(tasks, today) {
  const done = tasks.filter((task) => task.done);
  const byTag = {};
  for (const task of tasks) {
    for (const tag of task.tags) byTag[tag] = (byTag[tag] ?? 0) + 1;
  }
  return {
    total: tasks.length,
    done: done.length,
    open: tasks.length - done.length,
    overdue: tasks.filter((task) => columnFor(task, today) === "overdue").length,
    completionRate: tasks.length ? Math.round((done.length / tasks.length) * 100) : 0,
    byTag,
    streak: streak(done, today),
  };
}

/** Consecutive days, ending today or yesterday, with at least one task completed. */
export function streak(doneTasks, today) {
  const days = new Set(doneTasks.map((task) => task.completedAt).filter(Boolean));
  let day = days.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (days.has(day)) {
    count += 1;
    day = addDays(day, -1);
  }
  return count;
}
