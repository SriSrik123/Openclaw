import path from 'node:path';
import { PlannerAgent } from '../agents/planner-agent.js';
import { CodingAgent } from '../agents/coding-agent.js';
import { EmailAgent } from '../agents/email-agent.js';
import { OpsAgent } from '../agents/ops-agent.js';
import {
  createTask,
  updateTask,
  listTasks,
} from '../utils/task-store.js';
import { emitUpdate } from '../utils/notifier.js';

export class Router {
  constructor(options = {}) {
    this.rootDir = options.rootDir ?? path.resolve('.');
    this.agents = {
      planner: new PlannerAgent({ rootDir: this.rootDir }),
      coding: new CodingAgent(),
      email: new EmailAgent({ himalayaProfile: 'sri-gmail' }),
      ops: new OpsAgent(),
    };

    Object.values(this.agents).forEach((agent) => {
      agent.on('update', (event) => emitUpdate({ source: 'agent', ...event }));
      agent.on('spawnTask', (payload) => this.spawnFromAgent(agent, payload));
      agent.on('heartbeat', (event) => emitUpdate({ source: 'heartbeat', ...event }));
    });
  }

  describeAgents() {
    return Object.fromEntries(
      Object.entries(this.agents).map(([key, agent]) => [key, agent.describe()])
    );
  }

  async enqueue(taskPayload, agentKey = 'planner') {
    const task = await createTask({
      ...taskPayload,
      assignedTo: agentKey,
    });
    await emitUpdate({
      source: 'orchestrator',
      agent: agentKey,
      taskId: task.id,
      status: 'queued',
      message: `[LEAD] Routed ${task.summary} to ${agentKey}`,
    });
    await this.dispatch(task, agentKey);
    return task;
  }

  async dispatch(task, agentKey) {
    const agent = this.agents[agentKey];
    if (!agent) throw new Error(`No agent registered for key ${agentKey}`);
    await updateTask(task.id, { status: 'assigned', assignedTo: agentKey });
    return agent.assign(task);
  }

  async spawnFromAgent(agent, payload) {
    const childTask = await this.enqueue(
      {
        parentId: payload.parentId,
        summary: payload.summary,
        priority: payload.priority,
        origin: payload.origin ?? agent.name,
        payload: payload.payload,
      },
      payload.role,
    );
    await emitUpdate({
      source: 'spawn',
      agent: agent.name,
      taskId: childTask.id,
      message: `[LEAD] ${agent.name} spawned ${childTask.id} -> ${payload.role}`,
    });
  }

  async list(filterFn) {
    return listTasks(filterFn);
  }
}
