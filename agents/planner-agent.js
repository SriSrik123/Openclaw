import fs from 'node:fs';
import path from 'node:path';
import axios from 'axios';
import { AgentBase } from './agent-base.js';
import { formatAgentMessage } from '../utils/notifier.js';

function detectSteps(task) {
  const summary = task.summary?.toLowerCase() ?? '';
  const steps = [];
  if (summary.includes('email') || summary.includes('reach out')) {
    steps.push({
      role: 'email',
      summary: `Draft/send email: ${task.summary}`,
      priority: task.priority ?? 'medium',
    });
  }
  if (summary.includes('build') || summary.includes('fix') || summary.includes('code')) {
    steps.push({
      role: 'coding',
      summary: `Code work: ${task.summary}`,
      priority: 'high',
    });
  }
  if (summary.includes('schedule') || summary.includes('book') || summary.includes('call')) {
    steps.push({
      role: 'ops',
      summary: `Ops follow-up: ${task.summary}`,
      priority: 'medium',
    });
  }
  if (!steps.length) {
    steps.push({
      role: 'ops',
      summary: `General follow-up: ${task.summary}`,
      priority: task.priority ?? 'low',
    });
  }
  return steps;
}

export class PlannerAgent extends AgentBase {
  constructor(options = {}) {
    super({
      name: 'planner',
      role: 'planner',
      capabilities: ['decompose', 'trello-sync', 'prioritize'],
      ...options,
    });

    const configPath = path.resolve(options.rootDir ?? '.', 'config', 'trello.json');
    this.trelloConfig = null;
    if (fs.existsSync(configPath)) {
      this.trelloConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  }

  async handleTask(task) {
    this.emit('update', {
      agent: this.name,
      taskId: task.id,
      status: 'planning',
      message: formatAgentMessage(this.name, `Decomposing “${task.summary}”`),
    });

    const steps = detectSteps(task);

    if (this.trelloConfig) {
      await this.ensureTrelloCard(task, steps);
    }

    steps.forEach((step, index) => {
      this.emit('spawnTask', {
        parentId: task.id,
        ...step,
        payload: step.payload ?? task.payload ?? null,
        order: index + 1,
        origin: 'planner',
      });
    });

    this.complete(task.id, { steps });
    return { ok: true, steps };
  }

  async ensureTrelloCard(task, steps) {
    const { apiKey, token, lists } = this.trelloConfig;
    if (!apiKey || !token || !lists?.todo) return;
    try {
      await axios.post('https://api.trello.com/1/cards', null, {
        params: {
          key: apiKey,
          token,
          idList: lists.todo,
          name: task.summary,
          desc: steps.map((s, idx) => `${idx + 1}. ${s.summary}`).join('\n'),
        },
      });
      this.emit('update', {
        agent: this.name,
        role: this.role,
        taskId: task.id,
        status: 'trello',
        message: formatAgentMessage(this.name, 'Logged plan to Trello'),
      });
    } catch (error) {
      this.fail(task.id, error);
    }
  }
}
