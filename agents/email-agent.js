import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
import { AgentBase } from './agent-base.js';
import { formatAgentMessage } from '../utils/notifier.js';

const exec = promisify(execCb);

export class EmailAgent extends AgentBase {
  constructor(options = {}) {
    super({
      name: 'email',
      role: 'email',
      capabilities: ['triage', 'draft', 'send'],
      ...options,
    });
    this.himalayaProfile = options.himalayaProfile ?? 'sri-gmail';
    this.simulateByDefault = options.simulate ?? true;
  }

  async handleTask(task) {
    const body = task.payload?.body ?? `Follow up: ${task.summary}`;
    const to = task.payload?.to ?? 'team@srisrikanth.com';
    this.emit('update', {
      agent: this.name,
      taskId: task.id,
      status: 'drafting',
      message: formatAgentMessage(this.name, `Drafting email to ${to}`),
    });

    const command = `himalaya --account ${this.himalayaProfile} compose --to "${to}" --subject "${task.payload?.subject ?? task.summary}" --body "${body}"`;

    const dryRun = task.dryRun ?? this.simulateByDefault;
    if (dryRun) {
      this.emit('update', {
        agent: this.name,
        taskId: task.id,
        status: 'dry_run',
        message: formatAgentMessage(this.name, `Would run: ${command}`),
      });
      this.complete(task.id, { dryRun: true, command });
      return { ok: true };
    }

    try {
      const { stdout, stderr } = await exec(command);
      this.emit('update', {
        agent: this.name,
        taskId: task.id,
        status: 'sent',
        message: formatAgentMessage(this.name, `Email sent to ${to}`),
        stdout,
        stderr,
      });
      this.complete(task.id, { stdout });
    } catch (error) {
      this.fail(task.id, error);
    }
  }
}
