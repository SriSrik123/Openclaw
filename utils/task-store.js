import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { readJSON, writeJSON, ensureFile } = fs;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const TASK_FILE = path.join(DATA_DIR, 'tasks.json');

async function initStore() {
  await ensureFile(TASK_FILE);
  try {
    await readJSON(TASK_FILE);
  } catch (err) {
    await writeJSON(TASK_FILE, { tasks: [], lastId: 0 }, { spaces: 2 });
  }
}

export async function loadTasks() {
  await initStore();
  const data = await readJSON(TASK_FILE);
  return data;
}

export async function saveTasks(data) {
  await ensureFile(TASK_FILE);
  await writeJSON(TASK_FILE, data, { spaces: 2 });
}

export async function createTask(payload) {
  const store = await loadTasks();
  const id = `task-${store.lastId + 1}`;
  const task = {
    id,
    status: 'queued',
    createdAt: new Date().toISOString(),
    ...payload,
  };
  store.tasks.push(task);
  store.lastId += 1;
  await saveTasks(store);
  return task;
}

export async function updateTask(id, updates) {
  const store = await loadTasks();
  store.tasks = store.tasks.map((task) =>
    task.id === id ? { ...task, ...updates } : task,
  );
  await saveTasks(store);
}

export async function findTask(id) {
  const { tasks } = await loadTasks();
  return tasks.find((task) => task.id === id);
}

export async function listTasks(filterFn = () => true) {
  const { tasks } = await loadTasks();
  return tasks.filter(filterFn);
}
