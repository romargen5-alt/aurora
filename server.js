const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'db.json');
const INITIAL_FILE = path.join(__dirname, 'data', 'initial.json');

// --- Data helpers ---
function loadData() {
    if (!fs.existsSync(DATA_FILE)) {
        const initial = JSON.parse(fs.readFileSync(INITIAL_FILE, 'utf8'));
        fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
        return initial;
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'natsport-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Static files
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// --- Admin Auth ---
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

function requireAuth(req, res, next) {
    if (req.session && req.session.isAdmin) return next();
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.redirect('/admin/login.html');
}

// --- Auth endpoints ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        req.session.isAdmin = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Неверный логин или пароль' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/auth/check', (req, res) => {
    res.json({ authenticated: !!(req.session && req.session.isAdmin) });
});

// --- Public API ---
app.get('/api/news', (req, res) => {
    const data = loadData();
    const published = data.news.filter(n => n.published);
    res.json(published);
});

app.get('/api/events', (req, res) => {
    const data = loadData();
    const published = data.events.filter(e => e.published);
    const { category } = req.query;
    if (category && category !== 'all') {
        return res.json(published.filter(e => e.category === category));
    }
    res.json(published);
});

app.get('/api/sports', (req, res) => {
    const data = loadData();
    const published = data.sports.filter(s => s.published);
    res.json(published);
});

// --- Admin API (protected) ---

// NEWS
app.get('/api/admin/news', requireAuth, (req, res) => {
    const data = loadData();
    res.json(data.news);
});

app.post('/api/admin/news', requireAuth, (req, res) => {
    const data = loadData();
    const newItem = {
        id: Date.now(),
        title: req.body.title || '',
        text: req.body.text || '',
        date: req.body.date || new Date().toISOString().split('T')[0],
        published: req.body.published !== false
    };
    data.news.unshift(newItem);
    saveData(data);
    res.json(newItem);
});

app.put('/api/admin/news/:id', requireAuth, (req, res) => {
    const data = loadData();
    const idx = data.news.findIndex(n => n.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    data.news[idx] = { ...data.news[idx], ...req.body, id: data.news[idx].id };
    saveData(data);
    res.json(data.news[idx]);
});

app.delete('/api/admin/news/:id', requireAuth, (req, res) => {
    const data = loadData();
    data.news = data.news.filter(n => n.id !== parseInt(req.params.id));
    saveData(data);
    res.json({ success: true });
});

// EVENTS
app.get('/api/admin/events', requireAuth, (req, res) => {
    const data = loadData();
    res.json(data.events);
});

app.post('/api/admin/events', requireAuth, (req, res) => {
    const data = loadData();
    const newItem = {
        id: Date.now(),
        title: req.body.title || '',
        description: req.body.description || '',
        location: req.body.location || '',
        date: req.body.date || new Date().toISOString().split('T')[0],
        category: req.body.category || 'tournament',
        tags: req.body.tags || [],
        published: req.body.published !== false
    };
    data.events.push(newItem);
    saveData(data);
    res.json(newItem);
});

app.put('/api/admin/events/:id', requireAuth, (req, res) => {
    const data = loadData();
    const idx = data.events.findIndex(e => e.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    data.events[idx] = { ...data.events[idx], ...req.body, id: data.events[idx].id };
    saveData(data);
    res.json(data.events[idx]);
});

app.delete('/api/admin/events/:id', requireAuth, (req, res) => {
    const data = loadData();
    data.events = data.events.filter(e => e.id !== parseInt(req.params.id));
    saveData(data);
    res.json({ success: true });
});

// SPORTS
app.get('/api/admin/sports', requireAuth, (req, res) => {
    const data = loadData();
    res.json(data.sports);
});

app.post('/api/admin/sports', requireAuth, (req, res) => {
    const data = loadData();
    const newItem = {
        id: req.body.id || 'sport-' + Date.now(),
        title: req.body.title || '',
        shortDescription: req.body.shortDescription || '',
        fullDescription: req.body.fullDescription || '',
        features: req.body.features || [],
        published: req.body.published !== false
    };
    data.sports.push(newItem);
    saveData(data);
    res.json(newItem);
});

app.put('/api/admin/sports/:id', requireAuth, (req, res) => {
    const data = loadData();
    const idx = data.sports.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    data.sports[idx] = { ...data.sports[idx], ...req.body, id: data.sports[idx].id };
    saveData(data);
    res.json(data.sports[idx]);
});

app.delete('/api/admin/sports/:id', requireAuth, (req, res) => {
    const data = loadData();
    data.sports = data.sports.filter(s => s.id !== req.params.id);
    saveData(data);
    res.json({ success: true });
});

// --- Admin panel route ---
app.get('/admin', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// --- Frontend pages (serve HTML) ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/sports', (req, res) => res.sendFile(path.join(__dirname, 'sports.html')));
app.get('/events', (req, res) => res.sendFile(path.join(__dirname, 'events.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'about.html')));
app.get('/contacts', (req, res) => res.sendFile(path.join(__dirname, 'contacts.html')));

// Fallback for .html files
app.get('/:page.html', (req, res) => {
    const filePath = path.join(__dirname, req.params.page + '.html');
    if (fs.existsSync(filePath)) return res.sendFile(filePath);
    res.status(404).send('Page not found');
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin/login.html`);
    console.log(`Login: ${ADMIN_USER} / ${ADMIN_PASS}`);
});
