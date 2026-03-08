const agentsContainer = document.getElementById('agents');
const tasksContainer = document.getElementById('tasks');
const feedContainer = document.getElementById('feed');
const statusBadge = document.getElementById('connection-status');

async function fetchState() {
  const res = await fetch('state.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load state.json');
  return res.json();
}

function renderAgents(agents = {}) {
  agentsContainer.innerHTML = Object.entries(agents)
    .map(([key, agent]) => `
        <article class="agent-card">
          <h3>${agent.name}</h3>
          <small>${agent.role}</small>
          <p>${agent.capabilities.join(', ')}</p>
          <div class="status">
            <span>${agent.auto ? 'Auto' : 'Manual'}</span>
            <span>${agent.activeTasks} active</span>
          </div>
        </article>
      `)
    .join('');
}

function renderTasks(tasks = []) {
  if (!tasks.length) {
    tasksContainer.innerHTML = '<p>No tasks yet.</p>';
    return;
  }
  tasksContainer.innerHTML = tasks
    .map(
      (task) => `
        <article class="task">
          <strong>${task.summary}</strong>
          <div class="meta">
            <span>Status: ${task.status}</span>
            <span>Agent: ${task.assignedTo ?? '—'}</span>
            <span>Priority: ${task.priority ?? '—'}</span>
          </div>
        </article>
      `,
    )
    .join('');
}

function renderFeed(feed = []) {
  feedContainer.innerHTML = feed
    .slice()
    .reverse()
    .map(
      (event) => `
        <div class="feed-entry">
          <div><span class="agent">${event.agent}</span> · ${event.status}</div>
          <div>${event.message ?? ''}</div>
          <div class="time">${new Date(event.timestamp).toLocaleTimeString()}</div>
        </div>
      `,
    )
    .join('');
}

async function refresh() {
  try {
    const state = await fetchState();
    renderAgents(state.agents);
    renderTasks(state.tasks);
    renderFeed(state.feed);
    statusBadge.textContent = `Updated ${new Date(state.updatedAt).toLocaleTimeString()}`;
    statusBadge.style.background = '#1f4733';
  } catch (error) {
    console.error(error);
    statusBadge.textContent = 'Error loading state';
    statusBadge.style.background = '#472222';
  }
}

refresh();
setInterval(refresh, 4000);
