import { AgentBase } from './agent-base.js';
import { formatAgentMessage } from '../utils/notifier.js';

export class CodingAgent extends AgentBase {
  constructor(options = {}) {
    super({
      name: 'coding',
      role: 'coding',
      capabilities: ['repo-ops', 'tests', 'codex-hand-off'],
      ...options,
    });
  }

  async handleTask(task) {
    this.emit('update', {
      agent: this.name,
      taskId: task.id,
      status: 'queued',
      message: formatAgentMessage(this.name, `Preparing workspace for ${task.summary}`),
    });

    // Placeholder: in future, spawn coding-agent CLI here.
    const instructions = [
      '1. Checkout feature branch',
      '2. Run tests',
      '3. Implement change',
      '4. Commit and push for review',
    ].join('\n');

    this.emit('update', {
      agent: this.name,
      taskId: task.id,
      status: 'in_progress',
      message: formatAgentMessage(this.name, 'Executing via coding-agent skill (stub)'),
      details: instructions,
    });

    this.complete(task.id, { notes: 'Coding agent stub completed (no-op).' });
    return { ok: true };
  }
}
