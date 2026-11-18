/*
 * GitHub Pages administration panel for jhm829.github.io.
 * SECURITY: Personal Access Token stays in this tab's JS memory only.
 * Never save the token to localStorage, cookies, repo files or URLs.
 */
const OWNER = 'jhm829';
const REPO = 'jhm829.github.io';
const BASE = `https://api.github.com/repos/${OWNER}/${REPO}/contents`;
const DATA_PATH = 'data/projects.json';
const MAX_FILE = 5 * 1024 * 1024;
let token = '';
let sha = null;
let projects = [];
let editingId = null;
let currentFiles = [];
let busy = false;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const status = (id, message, kind = '') => { const node = $(id); node.textContent = message; node.className = `admin-status ${kind}`; };
const encodePath = path => path.split('/').map(encodeURIComponent).join('/');

function base64FromBytes(bytes) {
  const step = 8192;
  const chunks = [];
  for (let i = 0; i < bytes.length; i += step) chunks.push(String.fromCharCode(...bytes.subarray(i, i + step)));
  return btoa(chunks.join(''));
}
function bytesFromBase64(content) {
  const raw = atob(content.replace(/\s/g,''));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
function jsonToBase64(value) { return base64FromBytes(new TextEncoder().encode(JSON.stringify(value,null,2) + '\n')); }
function getText(content) { return new TextDecoder().decode(bytesFromBase64(content)); }
function validateLink(value, localAllowed = false) {
  const link = value.trim();
  if (!link) return '';
  if (localAllowed && /^uploads\/[\p{L}\p{N}._/%-]+$/u.test(link) && !link.includes('..')) return link;
  try {const url = new URL(link); if (['http:', 'https:'].includes(url.protocol)) return url.href;} catch { /* invalid */ }
  throw new Error('링크는 https:// 로 시작하는 URL 또는 uploads/ 경로만 사용해 주세요.');
}
async function api(path, options = {}) {
  const response = await fetch(`${BASE}/${encodePath(path)}`, {
    ...options,
    headers: {
      'Accept':'application/vnd.github+json',
      'Authorization':`Bearer ${token}`,
      'X-GitHub-Api-Version':'2022-11-28',
      ...(options.body ? {'Content-Type':'application/json'} : {}),
      ...options.headers
    }
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) throw new Error('토큰이 잘못되었거나 만료되었습니다.');
    if (response.status === 403) throw new Error('권한이 부족합니다. Contents 읽기/쓰기 권한과 저장소 접근 범위를 확인해 주세요.');
    if (response.status === 404) {const err = new Error('저장소 또는 파일을 찾지 못했습니다. 이름과 저장소 접근 권한을 확인해 주세요.'); err.status = 404;throw err;}
    if (response.status === 409) throw new Error('다른 곳에서 파일이 수정되었습니다. 페이지를 새로고침하고 다시 연결해 주세요.');
    if (response.status === 422) throw new Error('저장할 수 없습니다. 기존 파일과 경로가 겹치거나 데이터가 올바르지 않을 수 있습니다.');
    throw new Error(result.message || `GitHub API 오류 (${response.status})`);
  }
  return result;
}
async function connect() {
  const supplied = $('token').value.trim();
  if (!supplied) return status('connect-status','GitHub 토큰을 입력해 주세요.','error');
  token = supplied;
  $('token').value = '';
  $('connect-button').disabled = true;
  status('connect-status','저장소에 연결하는 중입니다...');
  try {
    const file = await api(DATA_PATH);
    const data = JSON.parse(getText(file.content));
    if (!Array.isArray(data.projects)) throw new Error('data/projects.json 형식을 확인해 주세요.');
    sha = file.sha;
    projects = data.projects;
    $('editor-panel').classList.remove('admin-hidden');
    $('list-panel').classList.remove('admin-hidden');
    status('connect-status',`연결 성공! ${projects.length}개 프로젝트를 불러왔습니다. 토큰은 이 탭을 닫으면 사라집니다.`,'success');
    renderList();
  } catch (err) {
    token = '';
    status('connect-status', err.message, 'error');
  } finally {$('connect-button').disabled = false;}
}
async function saveData(nextProjects, commitMessage) {
  const payload = {message:commitMessage, content:jsonToBase64({projects:nextProjects}), branch:'main'};
  if (sha) payload.sha = sha;
  const result = await api(DATA_PATH, {method:'PUT', body:JSON.stringify(payload)});
  sha = result.content.sha;
  projects = nextProjects;
  renderList();
}
function safeFilename(name) {
  return name.normalize('NFC').replace(/[^\p{L}\p{N}._-]+/gu, '_').replace(/^\.+/, '').slice(0,100) || 'file';
}
async function uploadFile(file, projectId) {
  if (file.size > MAX_FILE) throw new Error(`${file.name}: 파일 하나의 크기는 5MB 이하여야 합니다.`);
  const basename = safeFilename(file.name);
  const path = `uploads/${projectId}/${Date.now()}-${Math.random().toString(36).slice(2,8)}-${basename}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  await api(path, {method:'PUT',body:JSON.stringify({message:`Attach ${basename} to ${projectId}`,content:base64FromBytes(bytes),branch:'main'})});
  return {name:file.name, url:path};
}
function clearForm() {
  editingId = null;
  currentFiles = [];
  $('project-form').reset();
  renderAttached();
  $('save-button').textContent = 'GitHub에 저장하기 ↗';
  status('editor-status','');
}
function renderAttached() {
  $('existing-files').innerHTML = currentFiles.map((file,i) => `<span class="existing-file">${esc(file.name)} <button type="button" data-remove="${i}" aria-label="첨부파일 목록에서 제거">×</button></span>`).join('');
}
function editProject(id) {
  const project = projects.find(p => p.id === id);
  if (!project) return;
  editingId = id;
  currentFiles = [...(project.attachments || [])];
  const values = {
    'project-title':project.title,'project-category':project.category || 'Other',
    'project-summary':project.summary,'project-description':project.description,
    'project-repo':project.repoUrl,'project-demo':project.demoUrl,
    'project-tech':(project.tech || []).join(', '),'project-image-url':project.image
  };
  Object.entries(values).forEach(([id,value]) => $(id).value = value || '');
  $('project-files').value = '';
  $('project-image-file').value = '';
  $('file-link-title').value = '';
  $('file-link-url').value = '';
  $('save-button').textContent = '수정 내용 GitHub에 저장 ↗';
  renderAttached();
  status('editor-status',`「${project.title}」 수정 중`);
  $('editor-panel').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderList() {
  $('admin-count').textContent = `(${projects.length})`;
  $('admin-list').innerHTML = projects.length ? projects.map(p => `<div class="admin-item"><div><h3>${esc(p.title)}</h3><p>${esc(p.category || 'Project')} · ${esc(p.summary || '')}</p></div><div class="admin-item-actions"><button type="button" class="small-button" data-edit="${esc(p.id)}">수정</button><button type="button" class="small-button danger" data-delete="${esc(p.id)}">삭제</button></div></div>`).join('') : '<p class="hint">아직 등록된 프로젝트가 없습니다. 위에서 첫 프로젝트를 추가해 주세요.</p>';
}
function setBusy(isBusy) {
  busy = isBusy;
  $('save-button').disabled = isBusy;
  $('reset-button').disabled = isBusy;
  $('connect-button').disabled = isBusy;
}
async function submitProject(e) {
  e.preventDefault();
  if (busy || !token) return;
  const title = $('project-title').value.trim();
  const summary = $('project-summary').value.trim();
  if (!title || !summary) return status('editor-status','프로젝트 제목과 한 줄 소개를 입력해 주세요.','error');
  let repoUrl, demoUrl, image, manualFile;
  try {
    repoUrl = validateLink($('project-repo').value);
    demoUrl = validateLink($('project-demo').value);
    image = validateLink($('project-image-url').value, true);
    manualFile = validateLink($('file-link-url').value, true);
  } catch (err) {return status('editor-status',err.message,'error');}
  if (manualFile && !$('file-link-title').value.trim()) return status('editor-status','파일 링크 이름도 적어 주세요.','error');
  const attachmentFiles = [...$('project-files').files];
  const picture = $('project-image-file').files[0];
  for (const file of [...attachmentFiles, ...(picture ? [picture] : [])]) {
    if (file.size > MAX_FILE) return status('editor-status',`${file.name}: 최대 파일 크기는 5MB입니다.`,'error');
  }
  const existing = projects.find(p => p.id === editingId);
  const projectId = editingId || (crypto.randomUUID ? crypto.randomUUID().slice(0,12) : Date.now().toString(36));
  const newProject = {
    id:projectId, title, category:$('project-category').value, summary,
    description:$('project-description').value.trim(), repoUrl, demoUrl,
    tech:$('project-tech').value.split(',').map(s => s.trim()).filter(Boolean).slice(0,15),
    image, attachments:[...currentFiles],
    createdAt:existing?.createdAt || new Date().toISOString(), updatedAt:new Date().toISOString()
  };
  if (manualFile) newProject.attachments.push({name:$('file-link-title').value.trim(),url:manualFile});
  setBusy(true);
  try {
    const pending = [...attachmentFiles];
    if (picture) pending.unshift(picture);
    for (let i = 0;i < pending.length;i++) {
      const file = pending[i];
      status('editor-status',`파일 업로드 중... ${i+1}/${pending.length} (${file.name})`);
      const link = await uploadFile(file, projectId);
      if (file === picture) newProject.image = link.url;
      else newProject.attachments.push(link);
    }
    status('editor-status','프로젝트 정보를 저장하는 중입니다...');
    const next = editingId ? projects.map(p => p.id === editingId ? newProject : p) : [newProject, ...projects];
    await saveData(next, `Portfolio: ${editingId ? 'update' : 'add'} ${title}`);
    clearForm();
    status('editor-status','저장 완료! 공개 사이트에 반영되기까지 잠시 걸릴 수 있습니다.','success');
  } catch (err) {status('editor-status',`${err.message} 파일 업로드 후 실패했다면 일부 파일은 저장소에 남을 수 있습니다.`,'error');}
  finally {setBusy(false);}
}
async function deleteProject(id) {
  const p = projects.find(p => p.id === id);
  if (!p || busy || !confirm(`「${p.title}」 프로젝트를 목록에서 삭제할까요?\n기존에 업로드한 파일은 GitHub 저장소에 남습니다.`)) return;
  setBusy(true);
  try {
    await saveData(projects.filter(p => p.id !== id),`Portfolio: remove ${p.title}`);
    if (editingId === id) clearForm();
    status('editor-status',`「${p.title}」 프로젝트 카드가 삭제되었습니다.`,'success');
  } catch (err) {status('editor-status',err.message,'error');}
  finally {setBusy(false);}
}
$('connect-button').addEventListener('click', connect);
$('token').addEventListener('keydown', e => {if(e.key === 'Enter'){e.preventDefault();connect();}});
$('project-form').addEventListener('submit', submitProject);
$('reset-button').addEventListener('click', clearForm);
$('existing-files').addEventListener('click', e => {
  const remove = e.target.closest('[data-remove]');
  if (!remove) return;
  currentFiles.splice(Number(remove.dataset.remove),1);
  renderAttached();
});
$('admin-list').addEventListener('click', e => {
  const edit = e.target.closest('[data-edit]');
  const del = e.target.closest('[data-delete]');
  if (edit) editProject(edit.dataset.edit);
  if (del) deleteProject(del.dataset.delete);
});
