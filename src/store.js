// Saved data is versioned so older saves keep loading after the format
// changes. `storage` is anything with getItem/setItem (localStorage in the
// browser, a Map-backed stub in tests).

export const STORAGE_KEY = "task-planner";
export const CURRENT_VERSION = 2;

/** v1 saved a bare array of { id, title, done }; v2 adds the planner fields. */
const MIGRATIONS = {
  1: (tasks) => ({
    version: 2,
    tasks: tasks.map((task) => ({
      priority: "medium",
      due: null,
      tags: [],
      notes: "",
      completedAt: null,
      createdAt: new Date(task.id).toISOString(),
      ...task,
    })),
  }),
};

export function migrate(saved) {
  let data = Array.isArray(saved) ? { version: 1, tasks: saved } : saved;
  while (data.version < CURRENT_VERSION) {
    const step = MIGRATIONS[data.version];
    if (!step) throw new Error(`No migration from version ${data.version}`);
    data = step(data.tasks);
  }
  return data;
}

/** Never throws: unreadable data starts an empty list rather than breaking the app. */
export function load(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? migrate(JSON.parse(raw)).tasks : [];
  } catch {
    return [];
  }
}

export function save(storage, tasks) {
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: CURRENT_VERSION, tasks }));
}
