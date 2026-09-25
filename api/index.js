const { createClient } = require('@libsql/client');
const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

let db;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.warn('TURSO_DATABASE_URL or TURSO_AUTH_TOKEN not set. RSVP endpoints will fail until env vars are configured.');
} else {
  db = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
  db.execute(`CREATE TABLE IF NOT EXISTS rsvps (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`).catch(err => {
    console.error('Failed to initialize Turso table:', err.message);
  });
}

app.get('/api/rsvps', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Database not configured' });
  try {
    const filter = req.query.filter;
    let result;
    if (filter) {
      result = await db.execute('SELECT * FROM rsvps WHERE LOWER(status) = LOWER(?) ORDER BY created_at DESC', [filter]);
    } else if (req.query.sort === 'oldest') {
      result = await db.execute('SELECT * FROM rsvps ORDER BY created_at ASC');
    } else {
      result = await db.execute('SELECT * FROM rsvps ORDER BY created_at DESC');
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch RSVPs' });
  }
});

app.get('/api/rsvps/stats', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Database not configured' });
  try {
    const rows = await db.execute('SELECT status FROM rsvps');
    const stats = rows.rows.reduce((acc, r) => {
      const s = r.status.toLowerCase();
      if (s === 'hadir') acc.hadir++;
      else if (s === 'tidak hadir') acc.tidakHadir++;
      else acc.masihRagu++;
      acc.total++;
      return acc;
    }, { hadir: 0, tidakHadir: 0, masihRagu: 0, total: 0 });
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.post('/api/rsvps', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Database not configured' });
  const { name, status, msg } = req.body;
  if (!name || !msg) {
    return res.status(400).json({ error: 'Nama dan ucapan wajib diisi' });
  }
  const id = crypto.randomBytes(8).toString('hex');
  const createdAt = new Date().toISOString();
  try {
    await db.execute('INSERT INTO rsvps (id, name, status, message, created_at) VALUES (?, ?, ?, ?, ?)', [id, name.trim(), status || 'Hadir', msg.trim(), createdAt]);
    res.status(201).json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save RSVP' });
  }
});

app.get('/admin', (req, res) => res.redirect('/admin/'));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

module.exports = app;
