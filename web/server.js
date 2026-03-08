import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from '../orchestrator/router.js';
import { eventBus } from '../utils/event-bus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const PORT = process.env.PORT || 4173;

async function start() {
  const orchestrator = new Router({ rootDir: ROOT });
  const app = express();

  app.use(express.json());
  app.use(express.static(PUBLIC_DIR));

  app.get('/api/agents', (req, res) => {
    res.json({ agents: orchestrator.describeAgents() });
  });

  app.get('/api/tasks', async (req, res) => {
    const tasks = await orchestrator.list();
    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ tasks });
  });

  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const send = (event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    const heartbeat = setInterval(() => {
      res.write('event: ping\n');
      res.write(`data: ${Date.now()}\n\n`);
    }, 15000);

    eventBus.on('update', send);

    req.on('close', () => {
      clearInterval(heartbeat);
      eventBus.off('update', send);
    });
  });

  app.get('/api/log', async (req, res) => {
    try {
      const logPath = path.join(ROOT, 'data', 'dispatch.log');
      const content = await fs.promises.readFile(logPath, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      res.json({ entries: lines.slice(-200).map((l) => JSON.parse(l)) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    return res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`[UI] Listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('[UI] Failed to start server', err);
  process.exit(1);
});
