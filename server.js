require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const ADMIN_ID = process.env.ADMIN_ID || 'admin';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Data helpers ──────────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');

function readData(file) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
}

function writeData(file, data) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2), 'utf8');
}

// ── Auth middleware ────────────────────────────────────────────────────────────
function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { id, password } = req.body;
  if (!id || !password) {
    return res.status(400).json({ error: 'ID와 비밀번호를 입력해주세요.' });
  }
  if (id !== ADMIN_ID) {
    return res.status(401).json({ error: '아이디 또는 비밀번호가 틀렸습니다.' });
  }

  let valid = false;
  if (ADMIN_PASSWORD_HASH) {
    valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  } else {
    // 개발용: .env 없을 때 기본 비밀번호 'admin123' 허용
    valid = password === 'admin123';
  }

  if (!valid) {
    return res.status(401).json({ error: '아이디 또는 비밀번호가 틀렸습니다.' });
  }

  const token = jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// ── About ─────────────────────────────────────────────────────────────────────
app.get('/api/about', (req, res) => {
  res.json(readData('about.json'));
});

app.put('/api/about', authRequired, (req, res) => {
  writeData('about.json', req.body);
  res.json({ ok: true });
});

// ── Experience ────────────────────────────────────────────────────────────────
app.get('/api/experience', (req, res) => {
  res.json(readData('experience.json'));
});

app.put('/api/experience', authRequired, (req, res) => {
  writeData('experience.json', req.body);
  res.json({ ok: true });
});

// ── Projects ──────────────────────────────────────────────────────────────────
app.get('/api/projects', (req, res) => {
  res.json(readData('projects.json'));
});

app.get('/api/projects/:id', (req, res) => {
  const projects = readData('projects.json');
  const project = projects.find(p => String(p.id) === req.params.id);
  if (!project) return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
  res.json(project);
});

app.post('/api/projects', authRequired, (req, res) => {
  const projects = readData('projects.json');
  const newProject = {
    id: Date.now(),
    ...req.body,
    date: req.body.date || new Date().toISOString().slice(0, 10),
  };
  projects.unshift(newProject);
  writeData('projects.json', projects);
  res.status(201).json(newProject);
});

app.put('/api/projects/:id', authRequired, (req, res) => {
  const projects = readData('projects.json');
  const idx = projects.findIndex((p) => String(p.id) === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
  projects[idx] = { ...projects[idx], ...req.body, id: projects[idx].id };
  writeData('projects.json', projects);
  res.json(projects[idx]);
});

app.delete('/api/projects/:id', authRequired, (req, res) => {
  let projects = readData('projects.json');
  const before = projects.length;
  projects = projects.filter((p) => String(p.id) !== req.params.id);
  if (projects.length === before) return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
  writeData('projects.json', projects);
  res.json({ ok: true });
});

// ── Posts ─────────────────────────────────────────────────────────────────────
app.get('/api/posts', (req, res) => {
  const posts = readData('posts.json');
  // 공개용: content 제외하고 목록 반환
  const list = posts.filter((p) => p.published).map(({ content, ...rest }) => rest);
  res.json(list);
});

app.get('/api/posts/:slug', (req, res) => {
  const posts = readData('posts.json');
  const post = posts.find((p) => p.slug === req.params.slug && p.published);
  if (!post) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
  res.json(post);
});

app.post('/api/posts', authRequired, (req, res) => {
  const posts = readData('posts.json');
  let slug = req.body.slug;
  if (!slug) {
    const candidate = req.body.title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80);
    slug = candidate || String(Date.now());
  }

  if (posts.find((p) => p.slug === slug)) {
    return res.status(409).json({ error: '이미 사용 중인 슬러그입니다.' });
  }

  const newPost = {
    id: Date.now(),
    slug,
    title: req.body.title,
    summary: req.body.summary || '',
    content: req.body.content || '',
    date: req.body.date || new Date().toISOString().slice(0, 10),
    published: req.body.published !== undefined ? req.body.published : true,
  };
  posts.unshift(newPost);
  writeData('posts.json', posts);
  res.status(201).json(newPost);
});

app.put('/api/posts/:slug', authRequired, (req, res) => {
  const posts = readData('posts.json');
  const idx = posts.findIndex((p) => p.slug === req.params.slug);
  if (idx === -1) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
  posts[idx] = { ...posts[idx], ...req.body, id: posts[idx].id, slug: posts[idx].slug };
  writeData('posts.json', posts);
  res.json(posts[idx]);
});

app.delete('/api/posts/:slug', authRequired, (req, res) => {
  let posts = readData('posts.json');
  const before = posts.length;
  posts = posts.filter((p) => p.slug !== req.params.slug);
  if (posts.length === before) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
  writeData('posts.json', posts);
  res.json({ ok: true });
});

// Admin: 전체 목록 (비공개 포함)
app.get('/api/admin/posts', authRequired, (req, res) => {
  res.json(readData('posts.json'));
});

app.get('/api/admin/posts/:slug', authRequired, (req, res) => {
  const posts = readData('posts.json');
  const post = posts.find((p) => p.slug === req.params.slug);
  if (!post) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
  res.json(post);
});

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get('/{*path}', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
