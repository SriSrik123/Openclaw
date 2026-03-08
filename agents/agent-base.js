import { EventEmitter } from 'node:events';
import { differenceInMinutes } from 'date-fns';

export class AgentBase extends EventEmitter {
  constructor(options = {}) {
    super();
    const {
      name = 'agent',
      role = 'generic',
      capabilities = [],
      auto = true,
    } = options;

    this.name = name;
    this.role = role;
    this.capabilities = capabilities;
    this.auto = auto;
    this.lastHeartbeat = null;
    this.tasks = new Map();
  }

  describe() {
    return {
      name: this.name,
      role: this.role,
      capabilities: this.capabilities,
      auto: this.auto,
      activeTasks: this.tasks.size,
    };
  }

  assign(task) {
    this.tasks.set(task.id, {
      ...task,
      assignedAt: new Date().toISOString(),
      status: 'in_progress',
    });
    if (this.auto) {
      return this.handleTask(task);
    }
    return {
      ok: true,
      message: `${this.name} queued task ${task.id}`,
    };
  }

  complete(taskId, result = {}) {
    const task = this.tasks.get(taskId);
    if (!task) return;
    const now = new Date().toISOString();
    this.tasks.set(taskId, { ...task, status: 'done', completedAt: now });
    this.emit('update', {
      agent: this.name,
      role: this.role,
      taskId,
      status: 'done',
      timestamp: now,
      result,
    });
  }

  fail(taskId, error) {
    const task = this.tasks.get(taskId);
    const now = new Date().toISOString();
    this.emit('update', {
      agent: this.name,
      role: this.role,
      taskId,
      status: 'error',
      timestamp: now,
      error: error instanceof Error ? error.message : error,
    });
    if (task) {
      this.tasks.set(taskId, { ...task, status: 'error', completedAt: now });
    }
  }

  heartbeat() {
    const now = new Date();
    const age = this.lastHeartbeat
      ? differenceInMinutes(now, new Date(this.lastHeartbeat))
      : null;
    this.lastHeartbeat = now.toISOString();
    this.emit('heartbeat', {
      agent: this.name,
      role: this.role,
      timestamp: this.lastHeartbeat,
      minutesSinceLast: age,
    });
  }

  // Overridden by subclasses
  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  async handleTask(task) {
    throw new Error(`handleTask not implemented for ${this.name}`);
  }
}
