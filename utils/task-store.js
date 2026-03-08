import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pLimit from 'p-limit';

const { readJSON, writeJSON, ensureFile } = fs;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const TASK_FILE = path.join(DATA_DIR, 'tasks.json');
const ioQueue = pLimit(1);

async function initStore() {
  await ensureFile(TASK_FILE);
  try {
    await readJSON(TASK_FILE);
  } catch (err) {
    await writeJSON(TASK_FILE, { tasks: [], lastId: 0 }, { spaces: 2 });
  }
}

async function readStore() {
  await initStore();
  return readJSON(TASK_FILE);
}

async function writeStore(data) {
  await ensureFile(TASK_FILE);
  await writeJSON(TASK_FILE, data, { spaces: 2 });
}

export async function loadTasks() {
  return ioQueue(() => readStore());
}

export async function saveTasks(data) {
  return ioQueue(() => writeStore(data));
}

export async function createTask(payload) {
  return ioQueue(async () => {
    const store = await readStore();
    const id = `task-${store.lastId + 1}`;
    const task = {
      id,
      status: 'queued',
      createdAt: new Date().toISOString(),
      ...payload,
    };
    store.tasks.push(task);
    store.lastId += 1;
    await writeStore(store);
    return task;
  });
}

export async function updateTask(id, updates) {
  return ioQueue(async () => {
    const store = await readStore();
    store.tasks = store.tasks.map((task) =>
      task.id === id ? { ...task, ...updates } : task,
    );
    await writeStore(store);
  });
}

export async function findTask(id) {
  const store = await loadTasks();
  return store.tasks.find((task) => task.id === id);
}

export async function listTasks(filterFn = () => true) {
  const store = await loadTasks();
  return store.tasks.filter(filterFn);
}
