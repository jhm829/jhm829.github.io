/* Public portfolio display. No credentials are used here. */
const grid = document.getElementById('project-grid');
const filters = document.getElementById('filter-options');
const emptyState = document.getElementById('empty-state');
const errorState = document.getElementById('error-state');
const count = document.getElementById('project-count');
const dialog = document.getElementById('project-dialog');
const dialogContent = document.getElementById('dialog-content');
let projects = [];
let currentFilter = 'all';

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function allowedUrl(value, allowRelative = false) {
  if (typeof value !== 'string' || !value.trim()) return '';
  const raw = value.trim();
  if (allowRelative && /^uploads\/[\p{L}\p{N}._/%-]+$/u.test(raw) && !raw.includes('..')) return raw;
  try { const u = new URL(raw); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; }
}
function externalLink(url, title, cssClass = '') {
  const safe = allowedUrl(url, true);
  return safe ? `<a class="${cssClass}" href="${esc(safe)}" target="_blank" rel="noopener noreferrer">${esc(title)}</a>` : '';
}
function card(project) {
  const categories = (project.tech || []).slice(0, 5).map(t => `<span class="tag">${esc(t)}</span>`).join('');
  const img = allowedUrl(project.image, true);
  const image = img ? `<img src="${esc(img)}" alt="${esc(project.title)} 대표 이미지" loading="lazy"><div class="cover-overlay"></div>` : `<span class="cover-initials">${esc((project.title || 'PJ').slice(0, 2).toUpperCase())}</span>`;
  return `<article class="project-card">
    <div class="project-cover">${image}<span class="category-tag">${esc(project.category || 'Project')}</span></div>
    <div class="project-card-content"><h3>${esc(project.title)}</h3>
      <p class="project-summary">${esc(project.summary || '프로젝트 상세 내용을 확인해 주세요.')}</p>
      <div class="tag-row">${categories}</div>
      <div class="card-footer"><button type="button" class="detail-btn" data-id="${esc(project.id)}">자세히 보기 ↗</button>
        <div class="card-links">${externalLink(project.repoUrl, 'GitHub ↗')}${externalLink(project.demoUrl,'Demo ↗')}</div></div>
    </div></article>`;
}
function render() {
  const categories = [...new Set(projects.map(p => p.category).filter(Boolean))];
  if (currentFilter !== 'all' && !categories.includes(currentFilter)) currentFilter = 'all';
  filters.innerHTML = categories.map(c => `<button class="filter-chip ${currentFilter === c ? 'active' : ''}" type="button" data-filter="${esc(c)}">${esc(c)}</button>`).join('');
  document.querySelector('[data-filter="all"]').classList.toggle('active', currentFilter === 'all');
  const visible = projects.filter(p => currentFilter === 'all' || p.category === currentFilter);
  grid.innerHTML = visible.map(card).join('');
  emptyState.hidden = visible.length !== 0;
  if (!projects.length) count.textContent = '00 PROJECTS';
  else count.textContent = `${String(projects.length).padStart(2,'0')} PROJECT${projects.length === 1 ? '' : 'S'}`;
  grid.hidden = !visible.length;
}
function showProject(id) {
  const p = projects.find(project => project.id === id);
  if (!p) return;
  const img = allowedUrl(p.image, true);
  const header = img ? `<div class="dialog-cover"><img src="${esc(img)}" alt="${esc(p.title)} 대표 이미지"></div>` : '';
  const attachments = (p.attachments || []).filter(f => allowedUrl(f.url, true));
  dialogContent.innerHTML = `${header}<div class="dialog-detail">
      <span class="section-kicker">${esc(p.category || 'PROJECT')}</span><h2>${esc(p.title)}</h2>
      <p class="summary">${esc(p.summary || '')}</p>
      <div class="tag-row">${(p.tech || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      <div class="dialog-section"><h3>프로젝트 소개</h3><div class="dialog-description">${esc(p.description || p.summary || '상세 설명이 등록되지 않았습니다.')}</div></div>
      ${attachments.length ? `<div class="dialog-section"><h3>첨부파일 (${attachments.length})</h3>${attachments.map(f => externalLink(f.url, f.name, 'attachment-link')).join('')}</div>` : ''}
      <div class="dialog-actions">${externalLink(p.repoUrl, 'GitHub 저장소 ↗', 'button button-primary')}${externalLink(p.demoUrl, '데모 사이트 ↗', 'button button-ghost')}</div>
    </div>`;
  if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open','');
  document.body.classList.add('dialog-open');
}
document.getElementById('year').textContent = new Date().getFullYear();
document.querySelector('.filter-row').addEventListener('click', e => {
  const btn = e.target.closest('[data-filter]');
  if (!btn) return;
  currentFilter = btn.dataset.filter;
  render();
});
grid.addEventListener('click', e => {
  const btn = e.target.closest('[data-id]');
  if (btn) showProject(btn.dataset.id);
});
document.getElementById('dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

(async function loadProjects() {
  try {
    const response = await fetch('./data/projects.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('프로젝트 파일을 찾지 못했습니다.');
    const data = await response.json();
    if (!Array.isArray(data.projects)) throw new Error('프로젝트 형식 오류');
    projects = data.projects.filter(p => p && p.id && p.title).sort((a,b) => (b.updatedAt||'').localeCompare(a.updatedAt||''));
    render();
  } catch (error) {
    console.error('프로젝트 로딩 실패:', error);
    errorState.hidden = false;
    grid.hidden = true;
    emptyState.hidden = true;
  }
})();
