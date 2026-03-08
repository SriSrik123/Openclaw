import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTasks } from './task-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_STATE = path.resolve(__dirname, '..', 'public', 'state.json');

const feed = [];
let agents = {};
const MAX_FEED = 250;

async function ensureStateFile() {
  await fs.ensureFile(PUBLIC_STATE);
  if ((await fs.stat(PUBLIC_STATE)).size === 0) {
    await fs.writeJSON(
      PUBLIC_STATE,
      {
        updatedAt: new Date().toISOString(),
        agents: {},
        tasks: [],
        feed: [],
      },
      { spaces: 2 },
    );
  }
}

async function writeSnapshot() {
  await ensureStateFile();
  const { tasks } = await loadTasks();
  const payload = {
    updatedAt: new Date().toISOString(),
    agents,
    tasks,
    feed,
  };
  await fs.writeJSON(PUBLIC_STATE, payload, { spaces: 2 });
}

export async function setAgentsSnapshot(desc) {
  agents = desc;
  await writeSnapshot();
}

export async function appendEvent(event) {
  feed.push(event);
  if (feed.length > MAX_FEED) {
    feed.splice(0, feed.length - MAX_FEED);
  }
  await writeSnapshot();
}
