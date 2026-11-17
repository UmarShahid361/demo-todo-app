import assert from "node:assert/strict";
import { test } from "node:test";
import { addDays, daysBetween, isValidDate } from "../src/dates.js";
import { board, columnFor, filterTasks, sortTasks } from "../src/query.js";
import { stats, streak } from "../src/stats.js";
import { CURRENT_VERSION, load, migrate, save } from "../src/store.js";
import { TaskError, completeTask, createTask, reopenTask, updateTask } from "../src/tasks.js";

const TODAY = "2026-11-17";
const task = (fields) => createTask({ title: "Task", ...fields });

test("dates: validation and arithmetic across month and year ends", () => {
  assert.equal(isValidDate("2026-02-29"), false);
  assert.equal(isValidDate("2028-02-29"), true);
  assert.equal(isValidDate("17/11/2026"), false);
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(daysBetween("2026-11-17", "2026-11-10"), -7);
});

test("tasks: validated, trimmed, tags normalized", () => {
  const t = task({ title: "  Ship v2 ", tags: ["#Work", "work", " urgent "] });
  assert.equal(t.title, "Ship v2");
  assert.deepEqual(t.tags, ["urgent", "work"]);
  assert.throws(() => task({ title: " " }), TaskError);
  assert.throws(() => task({ priority: "urgent" }), TaskError);
  assert.throws(() => task({ due: "2026-13-01" }), TaskError);
});

test("tasks: ids stay unique within the same millisecond", () => {
  const ids = new Set(Array.from({ length: 50 }, () => createTask({ title: "x" }, 1000).id));
  assert.equal(ids.size, 50);
});

test("tasks: update re-validates; complete and reopen", () => {
  const t = task({});
  assert.throws(() => updateTask(t, { priority: "nope" }), TaskError);
  assert.equal(updateTask(t, { title: " Renamed " }).title, "Renamed");
  const done = completeTask(t, TODAY);
  assert.equal(done.completedAt, TODAY);
  assert.equal(completeTask(done, "2026-12-01").completedAt, TODAY);
  assert.equal(reopenTask(done).done, false);
});

test("board: columns by due date", () => {
  assert.equal(columnFor(task({ due: "2026-11-16" }), TODAY), "overdue");
  assert.equal(columnFor(task({ due: TODAY }), TODAY), "today");
  assert.equal(columnFor(task({ due: "2026-11-20" }), TODAY), "upcoming");
  assert.equal(columnFor(task({}), TODAY), "upcoming");
  assert.equal(columnFor(completeTask(task({ due: "2026-01-01" }), TODAY), TODAY), "done");
});

test("sorting: priority, then due date, undated last", () => {
  const tasks = [
    task({ title: "low", priority: "low", due: "2026-11-18" }),
    task({ title: "high-undated", priority: "high" }),
    task({ title: "high-soon", priority: "high", due: "2026-11-18" }),
  ];
  assert.deepEqual(sortTasks(tasks).map((t) => t.title), ["high-soon", "high-undated", "low"]);
  const grouped = board(tasks, TODAY);
  assert.equal(grouped.upcoming.length, 3);
  assert.equal(grouped.overdue.length, 0);
});

test("filters: text, #tag prefix, priority, status", () => {
  const tasks = [
    task({ title: "Write report", tags: ["work"], priority: "high" }),
    task({ title: "Groceries", tags: ["home"], notes: "milk, eggs" }),
    completeTask(task({ title: "Old report", tags: ["work"] }), TODAY),
  ];
  assert.equal(filterTasks(tasks, { text: "report" }).length, 2);
  assert.equal(filterTasks(tasks, { text: "eggs" }).length, 1);
  assert.equal(filterTasks(tasks, { text: "#wo" }).length, 2);
  assert.equal(filterTasks(tasks, { priority: "high" }).length, 1);
  assert.equal(filterTasks(tasks, { tag: "work", status: "open" }).length, 1);
});

test("stats: counts, completion rate and streak", () => {
  const tasks = [
    completeTask(task({ tags: ["work"] }), TODAY),
    completeTask(task({}), "2026-11-16"),
    task({ due: "2026-11-01", tags: ["work"] }),
  ];
  const s = stats(tasks, TODAY);
  assert.equal(s.completionRate, 67);
  assert.equal(s.overdue, 1);
  assert.deepEqual(s.byTag, { work: 2 });
  assert.equal(s.streak, 2);
  assert.equal(streak([completeTask(task({}), "2026-11-16")], TODAY), 1);
  assert.equal(streak([completeTask(task({}), "2026-11-14")], TODAY), 0);
});

test("store: v1 saves migrate; bad data never breaks loading", () => {
  const migrated = migrate([{ id: 1700000000000, title: "Legacy", done: true }]);
  assert.equal(migrated.version, CURRENT_VERSION);
  assert.equal(migrated.tasks[0].priority, "medium");
  assert.equal(migrated.tasks[0].title, "Legacy");

  const memory = new Map();
  const storage = { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v) };
  const t = task({ title: "Persist me" });
  save(storage, [t]);
  assert.deepEqual(load(storage), [t]);
  memory.set("task-planner", "{ not json");
  assert.deepEqual(load(storage), []);
});
