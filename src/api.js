/**
 * FlowAble Frontend API Client
 * Interfaces with FastAPI backend endpoints.
 */

const API_BASE = '';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchStatus() {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json();
}

export async function askQuestion(question, sessionId = null) {
  const res = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, session_id: sessionId }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Server error' }));
    throw new Error(errorData.detail || `Error (${res.status})`);
  }
  return res.json();
}

export async function fetchMemories(limit = 25) {
  const res = await fetch(`${API_BASE}/api/memories?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch memories');
  return res.json();
}

export async function searchMemories(query, limit = 10) {
  const res = await fetch(`${API_BASE}/api/memories/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit }),
  });
  if (!res.ok) throw new Error('Failed to search memories');
  return res.json();
}

export async function deleteMemory(pointId) {
  const res = await fetch(`${API_BASE}/api/memories/${pointId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete memory');
  return res.json();
}

export async function createManualMemory({ title, text, actionItems = [], category = 'general' }) {
  const res = await fetch(`${API_BASE}/api/memories/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      text,
      action_items: actionItems,
      category,
    }),
  });
  if (!res.ok) throw new Error('Failed to save manual memory');
  return res.json();
}

export async function sendOmiWebhook(payload, uid = 'test_device') {
  const res = await fetch(`${API_BASE}/omi/conversation?uid=${uid}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Webhook error' }));
    throw new Error(err.detail || 'Webhook failed');
  }
  return res.json();
}

export async function fetchActivity(limit = 50) {
  const res = await fetch(`${API_BASE}/api/activity?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch activity log');
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/api/stats`);
  if (!res.ok) throw new Error('Failed to fetch statistics');
  return res.json();
}
