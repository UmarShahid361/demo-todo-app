// The browser side: wires the pure modules to the page. All the logic worth
// testing lives in tasks/query/stats/store; this file only renders.
import { todayString } from "./dates.js";
import { COLUMNS, board, filterTasks } from "./query.js";
import { stats } from "./stats.js";
import { load, save } from "./store.js";
import { TaskError, completeTask, createTask, reopenTask } from "./tasks.js";

const LABELS = { overdue: "Overdue", today: "Today", upcoming: "Upcoming", done: "Done" };
const $ = (selector) => document.querySelector(selector);

let tasks = load(localStorage);

function update(next) {
  tasks = next;
  save(localStorage, tasks);
  render();
}

function card(task) {
  const item = document.createElement("li");
  item.className = `card priority-${task.priority}${task.done ? " done" : ""}`;

  const check = document.createElement("input");
  check.type = "checkbox";
  check.checked = task.done;
  check.setAttribute("aria-label", `Mark ${task.title} ${task.done ? "not done" : "done"}`);
  check.addEventListener("change", () =>
    update(tasks.map((t) => (t.id === task.id ? (t.done ? reopenTask(t) : completeTask(t, todayString())) : t))),
  );

  const body = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = task.title;
  const meta = document.createElement("small");
  meta.textContent = [task.due, ...task.tags.map((tag) => `#${tag}`)].filter(Boolean).join("  ");
  body.append(title, meta);

  const remove = document.createElement("button");
  remove.className = "remove";
  remove.textContent = "×";
  remove.setAttribute("aria-label", `Delete ${task.title}`);
  remove.addEventListener("click", () => update(tasks.filter((t) => t.id !== task.id)));

  item.append(check, body, remove);
  return item;
}

function render() {
  const today = todayString();
  const visible = filterTasks(tasks, { text: $("#search").value, priority: $("#filter-priority").value || null });
  const grouped = board(visible, today);
  const columns = COLUMNS.map((column) => {
    const section = document.createElement("section");
    const heading = document.createElement("h2");
    heading.textContent = `${LABELS[column]} (${grouped[column].length})`;
    const list = document.createElement("ul");
    list.append(...grouped[column].map(card));
    section.append(heading, list);
    return section;
  });
  $("#board").replaceChildren(...columns);

  const s = stats(tasks, today);
  $("#stats").textContent = `${s.open} open · ${s.overdue} overdue · ${s.completionRate}% done · ${s.streak}-day streak`;
}

$("#new-task").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const task = createTask({
      title: $("#title").value,
      priority: $("#priority").value,
      due: $("#due").value || null,
      tags: $("#tags").value.split(","),
    });
    $("#error").textContent = "";
    event.target.reset();
    update([...tasks, task]);
  } catch (err) {
    if (!(err instanceof TaskError)) throw err;
    $("#error").textContent = err.message;
  }
});

$("#search").addEventListener("input", render);
$("#filter-priority").addEventListener("change", render);

render();
