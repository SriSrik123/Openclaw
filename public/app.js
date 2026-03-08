const agentsContainer = document.getElementById('agents');
const tasksContainer = document.getElementById('tasks');
const feedContainer = document.getElementById('feed');
const statusBadge = document.getElementById('connection-status');

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return res.json();
}

function renderAgents(agents = {}) {
  agentsContainer.innerHTML = Object.entries(agents)
    .map(([key, agent]) => {
      return `
        <article class="agent-card">
          <h3>${agent.name}</h3>
          <small>${agent.role}</small>
          <p>${agent.capabilities.join(', ')}</p>
          <div class="status">
            <span>${agent.auto ? 'Auto' : 'Manual'}</span>
            <span>${agent.activeTasks} active</span>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderTasks(tasks = []) {
  if (!tasks.length) {
    tasksContainer.innerHTML = '<p>No tasks yet.</p>';
    return;
  }
  tasksContainer.innerHTML = tasks
    .map((task) => {
      return `
        <article class="task">
          <strong>${task.summary}</strong>
          <div class="meta">
            <span>Status: ${task.status}</span>
            <span>Agent: ${task.assignedTo ?? '—'}</span>
            <span>Priority: ${task.priority ?? '—'}</span>
          </div>
        </article>
      `;
    })
    .join('');
}

function addFeedEntry(event) {
  const entry = document.createElement('div');
  entry.className = 'feed-entry';
  entry.innerHTML = `
    <div><span class="agent">${event.agent}</span> · ${event.status}</div>
    <div>${event.message ?? ''}</div>
    <div class="time">${new Date(event.timestamp).toLocaleTimeString()}</div>
  `;
  feedContainer.appendChild(entry);
  const max = 100;
  while (feedContainer.children.length > max) {
    feedContainer.removeChild(feedContainer.firstChild);
  }
}

async function bootstrap() {
  const [{ agents }, { tasks }] = await Promise.all([
    fetchJSON('/api/agents'),
    fetchJSON('/api/tasks'),
  ]);
  renderAgents(agents);
  renderTasks(tasks);
}

function connectEvents() {
  const source = new EventSource('/api/events');
  source.onopen = () => {
    statusBadge.textContent = 'Live';
    statusBadge.style.background = '#1f4733';
  };
  source.onerror = () => {
    statusBadge.textContent = 'Reconnecting…';
    statusBadge.style.background = '#47331f';
  };
  source.onmessage = (event) => {
    const payload = JSON.parse(event.data);
    addFeedEntry(payload);
    if (payload.status === 'queued' || payload.status === 'done' || payload.status === 'error') {
      fetchJSON('/api/tasks').then(({ tasks }) => renderTasks(tasks));
    }
  };
}

bootstrap().catch((err) => {
  console.error(err);
  statusBadge.textContent = 'Error loading data';
  statusBadge.style.background = '#472222';
});

connectEvents();
