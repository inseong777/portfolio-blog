// 블로그 목록 렌더링
(async function () {
  const listEl = document.getElementById('post-list');
  if (!listEl) return;

  try {
    const posts = await fetchJSON('/api/posts');
    if (!posts.length) {
      listEl.innerHTML = '<li class="empty-state">아직 작성된 글이 없습니다.</li>';
      return;
    }

    listEl.innerHTML = posts.map(post => `
      <li class="post-item">
        <div class="post-item-date">${esc(post.date)}</div>
        <a class="post-item-title" href="/blog/post.html?slug=${encodeURIComponent(post.slug)}">
          ${esc(post.title)}
        </a>
        ${post.summary ? `<p class="post-item-summary">${esc(post.summary)}</p>` : ''}
      </li>
    `).join('');
  } catch {
    listEl.innerHTML = '<li class="empty-state">글 목록을 불러올 수 없습니다.</li>';
  }
})();
