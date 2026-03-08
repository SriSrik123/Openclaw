import { AgentBase } from './agent-base.js';
import { formatAgentMessage } from '../utils/notifier.js';

export class OpsAgent extends AgentBase {
  constructor(options = {}) {
    super({
      name: 'ops',
      role: 'ops',
      capabilities: ['scheduling', 'reminders', 'summaries'],
      ...options,
    });
  }

  async handleTask(task) {
    this.emit('update', {
      agent: this.name,
      taskId: task.id,
      status: 'in_progress',
      message: formatAgentMessage(this.name, `Handling logistics for ${task.summary}`),
    });

    // Placeholder logic: in future integrate Google Calendar / reminders
    const note = `Ops scheduled follow-up for ${task.summary}`;

    this.emit('update', {
      agent: this.name,
      taskId: task.id,
      status: 'scheduled',
      message: formatAgentMessage(this.name, note),
    });

    this.complete(task.id, { note });
    return { ok: true };
  }
}
