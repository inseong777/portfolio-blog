// ── 공통 유틸 ──────────────────────────────────────────────────────────────────

/** HTML 이스케이프 */
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** GET JSON */
async function fetchJSON(url, opts = {}) {
  const headers = {};
  if (opts.auth) {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = 'Bearer ' + token;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/** POST JSON */
async function postJSON(url, data) {
  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return body;
}

/** PUT JSON */
async function putJSON(url, data) {
  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return body;
}

/** DELETE */
async function deleteJSON(url) {
  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    method: 'DELETE',
    headers: token ? { Authorization: 'Bearer ' + token } : {},
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return body;
}

/** 관리자 인증 필요 (없으면 로그인 페이지로) */
function requireAuth() {
  if (!localStorage.getItem('token')) {
    location.replace('/admin/login.html');
  }
}

// ── Theme ─────────────────────────────────────────────────────────────────────
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  _updateThemeBtns(next);
}

function _updateThemeBtns(theme) {
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.textContent = theme === 'dark' ? '☀' : '☾';
    btn.title = theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  _updateThemeBtns(document.documentElement.getAttribute('data-theme') || 'dark');
});
