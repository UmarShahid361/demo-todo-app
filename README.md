# Task Planner

A small but real task planner in plain JavaScript (no framework, no build
step), used to demo an AI coding agent working on an actual codebase.

- **Board:** Overdue / Today / Upcoming / Done columns, sorted by priority
  then due date
- **Tasks:** priority, due date, tags and notes, validated on create and edit
- **Search and filters:** free text, `#tag` prefixes, priority, status
- **Stats:** open, overdue, completion rate, per-tag counts, completion streak
- **Storage:** versioned saves in `localStorage`, with migration from the
  old format; unreadable data never breaks the app

## Layout

```
src/dates.js   date-only arithmetic ("YYYY-MM-DD"), testable with a fixed "today"
src/tasks.js   creating, validating, editing and completing tasks
src/query.js   board columns, filtering and sorting
src/stats.js   the numbers above the board
src/store.js   versioned persistence and migrations
src/app.js     the page: renders the board and wires up the forms
test/          node:test suite for everything above
```

## Run it

```bash
npm test                 # Node 20+
npx serve .              # or any static server, then open the printed URL
```
