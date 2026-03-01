// 프로젝트 카드 렌더링
(async function () {
  const grid = document.getElementById('project-grid');
  if (!grid) return;

  try {
    const projects = await fetchJSON('/api/projects');
    if (!projects.length) {
      grid.innerHTML = '<div class="empty-state">등록된 프로젝트가 없습니다.</div>';
      return;
    }

    grid.innerHTML = projects.map(p => `
      <div class="project-card">
        <div class="project-card-title">${esc(p.title)}</div>
        <p class="project-card-desc">${esc(p.description)}</p>
        <div class="project-card-tags">
          ${(p.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
        </div>
        <div class="project-card-links">
          ${p.github ? `<a href="${esc(p.github)}" target="_blank" rel="noopener">GitHub →</a>` : ''}
          ${p.demo ? `<a href="${esc(p.demo)}" target="_blank" rel="noopener">Demo →</a>` : ''}
        </div>
      </div>
    `).join('');
  } catch {
    grid.innerHTML = '<div class="empty-state">프로젝트를 불러올 수 없습니다.</div>';
  }
})();
