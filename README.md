# Multi-Agent Framework (Lead-Orchestrated)

This project sets up a local-first agent collective where the Lead agent (me) coordinates specialist agents:

- **Planner Agent** – decomposes goals, syncs with Trello, maintains task graph.
- **Coding Agent** – handles code workstreams (future integration with coding-agent skill or Codex CLI).
- **Email Agent** – triages and drafts replies via Himalaya CLI (`sri-gmail`).
- **Ops Agent** – schedules, reminders, and general logistics (calendar/Trello syncing).

Key decisions:

1. **Language** – Node.js with native ES modules for quick automation and CLI access.
2. **Persistence** – lightweight JSON store under `data/` so state survives restarts.
3. **Integrations** – Planner pushes/pulls Trello cards; Email agent shells out to Himalaya; both run automatically.
4. **Communication** – All agents report through the Lead orchestrator. Sri still sees agent-tagged updates, but only speaks with the Lead agent.

## Layout

```
multi-agent/
├── agents/
│   ├── agent-base.js            # shared scaffold
│   ├── planner-agent.js         # Trello-driven planner
│   ├── coding-agent.js          # code executor placeholder
│   ├── email-agent.js           # Himalaya integration
│   └── ops-agent.js             # scheduling + logistics
├── orchestrator/
│   ├── index.js                 # CLI enqueue entrypoint
│   └── router.js                # task routing + message bus
├── web/
│   └── server.js                # Express server + SSE feed
├── public/
│   ├── index.html               # Agent Control Room UI
│   ├── app.js                   # frontend logic
│   └── styles.css               # glassmorphic styling
├── data/
│   ├── tasks.json               # persisted tasks/graph
│   └── dispatch.log             # human-readable event log
├── config/
│   ├── agents.json              # capabilities + routing
│   └── trello.json.example      # Trello credentials template
├── utils/
│   ├── task-store.js            # read/write helpers
│   ├── notifier.js              # piping updates back to Sri + UI
│   └── event-bus.js             # shared emitter for UI/SSE
└── README.md
```

## Usage

1. `npm install`
2. Add `config/trello.json` credentials (optional) + ensure Himalaya is configured locally.
3. **Live UI:** `npm start` → <http://localhost:4173> shows agents, task queue, and live feed via Server Sent Events.
4. **CLI enqueue:** `npm run cli "Task summary"`
5. **Demo workload:** `npm run demo`

Each specialist agent can later be swapped for a remote agent (e.g., coding-agent skill). The orchestrator only requires that agents expose `handleTask`, `heartbeat`, and `report` methods.
