import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { eventBus } from './event-bus.js';

const { appendFile, ensureFile } = fs;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_FILE = path.resolve(__dirname, '..', 'data', 'dispatch.log');

async function logLine(line) {
  await ensureFile(LOG_FILE);
  await appendFile(LOG_FILE, `${line}\n`);
}

export async function emitUpdate(event) {
  const timestamp = new Date().toISOString();
  const payload = { timestamp, ...event };
  await logLine(JSON.stringify(payload));
  eventBus.emit('update', payload);
  const humanReadable = `[#${event.taskId ?? 'n/a'}][${event.agent}] ${event.message ?? event.status}`;
  console.log(humanReadable);
}

export function formatAgentMessage(agent, text) {
  return `[${agent.toUpperCase()}] ${text}`;
}
