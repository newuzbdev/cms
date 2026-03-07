const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');

const DATA_PATH = path.join(__dirname, 'data', 'content.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const CLIENT_DIR = path.join(__dirname, '..', 'client');
const PUBLIC_DIR = path.join(__dirname, 'public');

[path.dirname(DATA_PATH), UPLOADS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /^image\/(jpeg|png|gif|webp)$/i;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only images (jpeg, png, gif, webp) allowed'));
  }
});

function readContent() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { seo: { description: '' }, blocks: [] };
  }
}

function writeContent(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

const app = express();
app.use(express.json());

app.get('/api/content', (req, res) => {
  try {
    const data = readContent();
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read content' });
  }
});

app.put('/api/content', (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid body' });
    }
    const current = readContent();
    const merged = {
      seo: data.seo != null ? { ...current.seo, ...data.seo } : current.seo,
      blocks: Array.isArray(data.blocks) ? data.blocks : current.blocks
    };
    writeContent(merged);
    const written = readContent();
    res.set('Cache-Control', 'no-store');
    res.json(written);
  } catch (e) {
    res.status(500).json({ error: 'Failed to save content' });
  }
});

app.post('/api/upload', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

app.put('/api/blocks/reorder', (req, res) => {
  try {
    const { blocks } = req.body;
    if (!Array.isArray(blocks)) {
      return res.status(400).json({ error: 'blocks must be an array' });
    }
    const data = readContent();
    const reordered = blocks.map((b, i) => ({
      ...(typeof b === 'object' ? b : {}),
      order: i + 1
    }));
    data.blocks = reordered;
    writeContent(data);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to reorder blocks' });
  }
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
});

app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(PUBLIC_DIR));
app.use(express.static(CLIENT_DIR));

app.get('*', function (req, res, next) {
  if (req.path.startsWith('/api') || req.path.startsWith('/admin') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(CLIENT_DIR, 'index.html'));
});

const PORT = process.env.PORT || 3001;

// On Vercel, the app is used as a serverless function; don't call listen().
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Public page: http://localhost:${PORT}/`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
  });
}

module.exports = { app };
