import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from './router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

async function main() {
  const router = new Router({ rootDir: ROOT });
  const args = process.argv.slice(2);

  // Heartbeats every 10 minutes
  setInterval(() => {
    Object.values(router.agents).forEach((agent) => agent.heartbeat());
  }, 10 * 60 * 1000).unref();

  if (!args.length) {
    console.log('Usage: node orchestrator/index.js "Plan investor update"');
    console.log('Or run `npm run demo` for a full flow.');
    return;
  }

  if (args[0] === 'demo') {
    await demo(router);
    return;
  }

  await router.enqueue({
    summary: args.join(' '),
    priority: 'medium',
    origin: 'cli',
  });
}

async function demo(router) {
  await router.enqueue({
    summary: 'Build landing page update and email investors',
    priority: 'high',
    origin: 'demo',
    payload: { to: 'investors@example.com', subject: 'Product update' },
  });
  await router.enqueue({
    summary: 'Schedule onboarding call with ACME',
    priority: 'medium',
    origin: 'demo',
    payload: { to: 'acme@example.com', subject: 'Onboarding call' },
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
