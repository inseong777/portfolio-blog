// 관리자 대시보드 로직
requireAuth();

// 로그아웃
document.getElementById('logout-btn').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('token');
  location.replace('/admin/login.html');
});

// ── Posts ─────────────────────────────────────────────────────────────────────
async function loadPosts() {
  const wrap = document.getElementById('posts-wrap');
  try {
    const posts = await fetchJSON('/api/admin/posts', { auth: true });
    if (!posts.length) {
      wrap.innerHTML = '<div class="empty-state">작성된 글이 없습니다.</div>';
      return;
    }
    wrap.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>제목</th>
            <th>슬러그</th>
            <th>날짜</th>
            <th>상태</th>
            <th style="width:140px;"></th>
          </tr>
        </thead>
        <tbody>
          ${posts.map(p => `
            <tr>
              <td>${esc(p.title)}</td>
              <td style="font-family:monospace; font-size:.82rem;">${esc(p.slug)}</td>
              <td>${esc(p.date)}</td>
              <td>${p.published
                ? '<span class="badge-pub">공개</span>'
                : '<span class="badge-draft">비공개</span>'
              }</td>
              <td>
                <div style="display:flex; gap:8px;">
                  <a class="btn btn-outline btn-sm" href="/admin/editor.html?slug=${encodeURIComponent(p.slug)}">편집</a>
                  <button class="btn btn-danger btn-sm" onclick="deletePost('${esc(p.slug)}')">삭제</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    if (err.status === 401) location.replace('/admin/login.html');
    wrap.innerHTML = '<div class="empty-state">글 목록을 불러올 수 없습니다.</div>';
  }
}

async function deletePost(slug) {
  if (!confirm(`"${slug}" 글을 삭제하시겠습니까?`)) return;
  try {
    await deleteJSON(`/api/posts/${encodeURIComponent(slug)}`);
    loadPosts();
  } catch (err) {
    alert(err.message || '삭제에 실패했습니다.');
  }
}

// ── Projects ──────────────────────────────────────────────────────────────────
async function loadProjects() {
  const wrap = document.getElementById('projects-wrap');
  try {
    const projects = await fetchJSON('/api/projects');
    if (!projects.length) {
      wrap.innerHTML = '<div class="empty-state">등록된 프로젝트가 없습니다.</div>';
      return;
    }
    wrap.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>제목</th>
            <th>기술스택</th>
            <th>날짜</th>
            <th style="width:140px;"></th>
          </tr>
        </thead>
        <tbody>
          ${projects.map(p => `
            <tr>
              <td>${esc(p.title)}</td>
              <td style="font-size:.82rem;">${(p.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join(' ')}</td>
              <td>${esc(p.date)}</td>
              <td>
                <div style="display:flex; gap:8px;">
                  <button class="btn btn-outline btn-sm" onclick="editProject(${p.id})">편집</button>
                  <button class="btn btn-danger btn-sm" onclick="deleteProject(${p.id})">삭제</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch {
    wrap.innerHTML = '<div class="empty-state">프로젝트를 불러올 수 없습니다.</div>';
  }
}

async function deleteProject(id) {
  if (!confirm('프로젝트를 삭제하시겠습니까?')) return;
  try {
    await deleteJSON(`/api/projects/${id}`);
    loadProjects();
  } catch (err) {
    alert(err.message || '삭제에 실패했습니다.');
  }
}

// ── Project Modal ─────────────────────────────────────────────────────────────
const modal = document.getElementById('project-modal');
const form = document.getElementById('project-form');

document.getElementById('add-project-btn').addEventListener('click', () => {
  openModal();
});

document.getElementById('modal-cancel').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

function openModal(project = null) {
  document.getElementById('modal-title').textContent = project ? '프로젝트 수정' : '프로젝트 추가';
  document.getElementById('project-id').value = project?.id || '';
  document.getElementById('p-title').value = project?.title || '';
  document.getElementById('p-desc').value = project?.description || '';
  document.getElementById('p-tags').value = (project?.tags || []).join(', ');
  document.getElementById('p-github').value = project?.github || '';
  document.getElementById('p-demo').value = project?.demo || '';
  document.getElementById('p-date').value = project?.date || new Date().toISOString().slice(0, 10);
  document.getElementById('modal-alert').innerHTML = '';
  modal.style.display = 'flex';
}

function closeModal() {
  modal.style.display = 'none';
}

async function editProject(id) {
  try {
    const projects = await fetchJSON('/api/projects');
    const project = projects.find(p => p.id === id);
    if (project) openModal(project);
  } catch {
    alert('프로젝트를 불러올 수 없습니다.');
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('project-id').value;
  const tagsRaw = document.getElementById('p-tags').value;
  const body = {
    title: document.getElementById('p-title').value.trim(),
    description: document.getElementById('p-desc').value.trim(),
    tags: tagsRaw.split(',').map(t => t.trim()).filter(Boolean),
    github: document.getElementById('p-github').value.trim(),
    demo: document.getElementById('p-demo').value.trim(),
    date: document.getElementById('p-date').value,
  };

  try {
    if (id) {
      await putJSON(`/api/projects/${id}`, body);
    } else {
      await postJSON('/api/projects', body);
    }
    closeModal();
    loadProjects();
  } catch (err) {
    document.getElementById('modal-alert').innerHTML =
      `<div class="alert alert-error">${esc(err.message || '저장에 실패했습니다.')}</div>`;
  }
});

// Init
loadPosts();
loadProjects();
