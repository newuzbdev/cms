const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');

const IS_VERCEL = Boolean(process.env.VERCEL);
const USE_BLOB = IS_VERCEL && process.env.BLOB_READ_WRITE_TOKEN;
const BLOB_CONTENT_PATH = 'cms-landing/content.json';

const ORIGINAL_DATA_PATH = path.join(__dirname, 'data', 'content.json');
const ORIGINAL_UPLOADS_DIR = path.join(__dirname, 'uploads');

const DATA_PATH = IS_VERCEL
  ? path.join('/tmp', 'cms-landing-data', 'content.json')
  : ORIGINAL_DATA_PATH;
const UPLOADS_DIR = IS_VERCEL
  ? path.join('/tmp', 'cms-landing-data', 'uploads')
  : ORIGINAL_UPLOADS_DIR;

const CLIENT_DIR = path.join(__dirname, '..', 'client');
const PUBLIC_DIR = path.join(__dirname, 'public');

if (USE_BLOB) {
  try {
    const blob = require('@vercel/blob');
    var blobPut = blob.put;
    var blobGet = blob.get;
    var blobList = blob.list;
  } catch (e) {
    // @vercel/blob not available
  }
}

[path.dirname(DATA_PATH), UPLOADS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function streamToText(stream) {
  if (!stream) return '';
  if (typeof stream.getReader === 'function') {
    const reader = stream.getReader();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString('utf8');
  }
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

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

const DEFAULT_CONTENT = { seo: { description: '' }, blocks: [] };

async function readContentFromBlob() {
  if (!USE_BLOB || !blobGet) return null;
  try {
    const result = await blobGet(BLOB_CONTENT_PATH, { access: 'private' });
    if (result && result.stream) {
      const raw = await streamToText(result.stream);
      return raw ? JSON.parse(raw) : null;
    }
  } catch (_) {}
  return null;
}

async function readContent() {
  if (USE_BLOB && blobGet) {
    try {
      let data = await readContentFromBlob();
      if (data) return data;
      let blobs = [];
      if (blobList) {
        const listRes = await blobList({ prefix: 'cms-landing/' });
        blobs = listRes.blobs || [];
      }
      const contentBlob = (blobs && blobs.length)
        ? (blobs.find((b) => (b.pathname || '').endsWith('content.json')) || blobs[0])
        : null;
      if (contentBlob && contentBlob.url) {
        const result = await blobGet(contentBlob.url, { access: 'private' });
        if (result && result.stream) {
          const raw = await streamToText(result.stream);
          data = raw ? JSON.parse(raw) : null;
          if (data) return data;
        }
      }
      if (fs.existsSync(ORIGINAL_DATA_PATH)) {
        const raw = fs.readFileSync(ORIGINAL_DATA_PATH, 'utf8');
        return JSON.parse(raw);
      }
      return DEFAULT_CONTENT;
    } catch (e) {
      if (fs.existsSync(ORIGINAL_DATA_PATH)) {
        try {
          const raw = fs.readFileSync(ORIGINAL_DATA_PATH, 'utf8');
          return JSON.parse(raw);
        } catch (_) {}
      }
      return DEFAULT_CONTENT;
    }
  }
  try {
    if (IS_VERCEL && !fs.existsSync(DATA_PATH) && fs.existsSync(ORIGINAL_DATA_PATH)) {
      const raw = fs.readFileSync(ORIGINAL_DATA_PATH, 'utf8');
      return JSON.parse(raw);
    }
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_CONTENT;
  }
}

async function writeContent(data) {
  if (USE_BLOB && blobPut) {
    const body = JSON.stringify(data, null, 2);
    await blobPut(BLOB_CONTENT_PATH, body, {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true
    });
    return;
  }
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

const app = express();
app.use(express.json());

app.get('/api/content', async (req, res) => {
  try {
    const data = await readContent();
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read content' });
  }
});

app.put('/api/content', async (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid body' });
    }
    const current = await readContent();
    const merged = {
      seo: data.seo != null ? { ...current.seo, ...data.seo } : current.seo,
      blocks: Array.isArray(data.blocks) ? data.blocks : current.blocks
    };
    await writeContent(merged);
    const written = await readContent();
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

app.put('/api/blocks/reorder', async (req, res) => {
  try {
    const { blocks } = req.body;
    if (!Array.isArray(blocks)) {
      return res.status(400).json({ error: 'blocks must be an array' });
    }
    const data = await readContent();
    const reordered = blocks.map((b, i) => ({
      ...(typeof b === 'object' ? b : {}),
      order: i + 1
    }));
    data.blocks = reordered;
    await writeContent(data);
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
