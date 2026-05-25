/* Admin Panel JavaScript */

let currentSection = 'dashboard';
let editingItem = null;
let editingType = null;

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initNavigation();
    initSidebarToggle();
    loadDashboard();
});

async function checkAuth() {
    try {
        const res = await fetch('/api/auth/check');
        const data = await res.json();
        if (!data.authenticated) window.location.href = '/admin/login.html';
    } catch (e) {
        window.location.href = '/admin/login.html';
    }
}

// --- Navigation ---
function initNavigation() {
    document.querySelectorAll('.sidebar__link[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(link.dataset.section);
        });
    });
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/admin/login.html';
    });
}

function showSection(name) {
    currentSection = name;
    document.querySelectorAll('.content').forEach(el => el.classList.add('content--hidden'));
    document.getElementById('section-' + name).classList.remove('content--hidden');
    document.querySelectorAll('.sidebar__link[data-section]').forEach(l => l.classList.remove('sidebar__link--active'));
    const activeLink = document.querySelector(`.sidebar__link[data-section="${name}"]`);
    if (activeLink) activeLink.classList.add('sidebar__link--active');

    const titles = { dashboard: 'Панель управления', news: 'Новости', events: 'Мероприятия', sports: 'Виды спорта' };
    document.getElementById('pageTitle').textContent = titles[name] || '';

    if (name === 'news') loadNews();
    if (name === 'events') loadEvents();
    if (name === 'sports') loadSports();
    if (name === 'dashboard') loadDashboard();

    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('open');
}

function initSidebarToggle() {
    document.getElementById('sidebarToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
}

// --- Dashboard ---
async function loadDashboard() {
    try {
        const [news, events, sports] = await Promise.all([
            fetch('/api/admin/news').then(r => r.json()),
            fetch('/api/admin/events').then(r => r.json()),
            fetch('/api/admin/sports').then(r => r.json())
        ]);
        document.getElementById('newsCount').textContent = news.length;
        document.getElementById('eventsCount').textContent = events.length;
        document.getElementById('sportsCount').textContent = sports.length;
    } catch (e) {
        console.error('Failed to load dashboard', e);
    }
}

// --- NEWS ---
async function loadNews() {
    try {
        const news = await fetch('/api/admin/news').then(r => r.json());
        const tbody = document.getElementById('newsTable');
        tbody.innerHTML = news.map(item => `
            <tr>
                <td><strong>${escHtml(item.title)}</strong></td>
                <td>${formatDate(item.date)}</td>
                <td><span class="status ${item.published ? 'status--published' : 'status--draft'}">${item.published ? 'Опубликовано' : 'Черновик'}</span></td>
                <td class="actions">
                    <button class="btn btn--sm btn--edit" onclick="editItem('news', ${item.id})">Ред.</button>
                    <button class="btn btn--sm btn--delete" onclick="deleteItem('news', ${item.id})">Удал.</button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
}

// --- EVENTS ---
async function loadEvents() {
    try {
        const events = await fetch('/api/admin/events').then(r => r.json());
        const tbody = document.getElementById('eventsTable');
        const catLabels = { championship: 'Чемпионат', festival: 'Фестиваль', tournament: 'Турнир', seminar: 'Семинар' };
        tbody.innerHTML = events.map(item => `
            <tr>
                <td><strong>${escHtml(item.title)}</strong></td>
                <td>${formatDate(item.date)}</td>
                <td><span class="category-badge">${catLabels[item.category] || item.category}</span></td>
                <td><span class="status ${item.published ? 'status--published' : 'status--draft'}">${item.published ? 'Опубликовано' : 'Черновик'}</span></td>
                <td class="actions">
                    <button class="btn btn--sm btn--edit" onclick="editItem('events', ${item.id})">Ред.</button>
                    <button class="btn btn--sm btn--delete" onclick="deleteItem('events', ${item.id})">Удал.</button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
}

// --- SPORTS ---
async function loadSports() {
    try {
        const sports = await fetch('/api/admin/sports').then(r => r.json());
        const tbody = document.getElementById('sportsTable');
        tbody.innerHTML = sports.map(item => `
            <tr>
                <td><strong>${escHtml(item.title)}</strong></td>
                <td><code>${item.id}</code></td>
                <td><span class="status ${item.published ? 'status--published' : 'status--draft'}">${item.published ? 'Опубликовано' : 'Черновик'}</span></td>
                <td class="actions">
                    <button class="btn btn--sm btn--edit" onclick="editItem('sports', '${item.id}')">Ред.</button>
                    <button class="btn btn--sm btn--delete" onclick="deleteItem('sports', '${item.id}')">Удал.</button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
}

// --- MODAL ---
function openModal(type, item = null) {
    editingType = type;
    editingItem = item;
    const modal = document.getElementById('modalOverlay');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('modalForm');

    if (type === 'news') {
        title.textContent = item ? 'Редактировать новость' : 'Добавить новость';
        form.innerHTML = `
            <div class="form-group">
                <label>Заголовок</label>
                <input type="text" name="title" required value="${item ? escAttr(item.title) : ''}">
            </div>
            <div class="form-group">
                <label>Текст</label>
                <textarea name="text" required>${item ? escHtml(item.text) : ''}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Дата</label>
                    <input type="date" name="date" value="${item ? item.date : new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>&nbsp;</label>
                    <div class="form-check">
                        <input type="checkbox" name="published" ${!item || item.published ? 'checked' : ''}>
                        <label>Опубликовать</label>
                    </div>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn" onclick="closeModal()" style="background:#ddd;color:#333;">Отмена</button>
                <button type="submit" class="btn btn--primary">${item ? 'Сохранить' : 'Добавить'}</button>
            </div>
        `;
    } else if (type === 'events') {
        title.textContent = item ? 'Редактировать мероприятие' : 'Добавить мероприятие';
        form.innerHTML = `
            <div class="form-group">
                <label>Название</label>
                <input type="text" name="title" required value="${item ? escAttr(item.title) : ''}">
            </div>
            <div class="form-group">
                <label>Описание</label>
                <textarea name="description" required>${item ? escHtml(item.description) : ''}</textarea>
            </div>
            <div class="form-group">
                <label>Место проведения</label>
                <input type="text" name="location" value="${item ? escAttr(item.location) : ''}">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Дата</label>
                    <input type="date" name="date" value="${item ? item.date : new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>Категория</label>
                    <select name="category">
                        <option value="championship" ${item && item.category === 'championship' ? 'selected' : ''}>Чемпионат</option>
                        <option value="festival" ${item && item.category === 'festival' ? 'selected' : ''}>Фестиваль</option>
                        <option value="tournament" ${item && item.category === 'tournament' ? 'selected' : ''}>Турнир</option>
                        <option value="seminar" ${item && item.category === 'seminar' ? 'selected' : ''}>Семинар</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Теги (через запятую)</label>
                <input type="text" name="tags" value="${item ? (item.tags || []).join(', ') : ''}">
            </div>
            <div class="form-group">
                <div class="form-check">
                    <input type="checkbox" name="published" ${!item || item.published ? 'checked' : ''}>
                    <label>Опубликовать</label>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn" onclick="closeModal()" style="background:#ddd;color:#333;">Отмена</button>
                <button type="submit" class="btn btn--primary">${item ? 'Сохранить' : 'Добавить'}</button>
            </div>
        `;
    } else if (type === 'sports') {
        title.textContent = item ? 'Редактировать вид спорта' : 'Добавить вид спорта';
        form.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>ID (латиницей)</label>
                    <input type="text" name="id" ${item ? 'readonly' : 'required'} value="${item ? item.id : ''}" ${item ? 'style="background:#eee;"' : ''}>
                </div>
                <div class="form-group">
                    <label>Название</label>
                    <input type="text" name="title" required value="${item ? escAttr(item.title) : ''}">
                </div>
            </div>
            <div class="form-group">
                <label>Краткое описание</label>
                <textarea name="shortDescription" style="height:80px">${item ? escHtml(item.shortDescription) : ''}</textarea>
            </div>
            <div class="form-group">
                <label>Полное описание</label>
                <textarea name="fullDescription">${item ? escHtml(item.fullDescription) : ''}</textarea>
            </div>
            <div class="form-group">
                <label>Особенности (каждая с новой строки)</label>
                <textarea name="features" style="height:100px">${item ? (item.features || []).join('\n') : ''}</textarea>
            </div>
            <div class="form-group">
                <div class="form-check">
                    <input type="checkbox" name="published" ${!item || item.published ? 'checked' : ''}>
                    <label>Опубликовать</label>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn" onclick="closeModal()" style="background:#ddd;color:#333;">Отмена</button>
                <button type="submit" class="btn btn--primary">${item ? 'Сохранить' : 'Добавить'}</button>
            </div>
        `;
    }

    form.onsubmit = (e) => { e.preventDefault(); saveItem(); };
    modal.classList.add('show');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
    editingItem = null;
    editingType = null;
}

// --- Save item ---
async function saveItem() {
    const form = document.getElementById('modalForm');
    const formData = new FormData(form);
    let body = {};

    if (editingType === 'news') {
        body = {
            title: formData.get('title'),
            text: formData.get('text'),
            date: formData.get('date'),
            published: form.querySelector('[name="published"]').checked
        };
    } else if (editingType === 'events') {
        body = {
            title: formData.get('title'),
            description: formData.get('description'),
            location: formData.get('location'),
            date: formData.get('date'),
            category: formData.get('category'),
            tags: formData.get('tags').split(',').map(t => t.trim()).filter(Boolean),
            published: form.querySelector('[name="published"]').checked
        };
    } else if (editingType === 'sports') {
        body = {
            id: formData.get('id'),
            title: formData.get('title'),
            shortDescription: formData.get('shortDescription'),
            fullDescription: formData.get('fullDescription'),
            features: formData.get('features').split('\n').map(f => f.trim()).filter(Boolean),
            published: form.querySelector('[name="published"]').checked
        };
    }

    try {
        const isEdit = !!editingItem;
        const id = editingItem ? (editingItem.id) : null;
        const url = isEdit ? `/api/admin/${editingType}/${id}` : `/api/admin/${editingType}`;
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            showToast(isEdit ? 'Сохранено!' : 'Добавлено!', 'success');
            closeModal();
            showSection(editingType || currentSection);
        } else {
            showToast('Ошибка сохранения', 'error');
        }
    } catch (e) {
        showToast('Ошибка сети', 'error');
    }
}

// --- Edit item ---
async function editItem(type, id) {
    try {
        const items = await fetch(`/api/admin/${type}`).then(r => r.json());
        const item = items.find(i => String(i.id) === String(id));
        if (item) openModal(type, item);
    } catch (e) {
        showToast('Ошибка загрузки', 'error');
    }
}

// --- Delete item ---
async function deleteItem(type, id) {
    if (!confirm('Удалить этот элемент?')) return;
    try {
        const res = await fetch(`/api/admin/${type}/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Удалено!', 'success');
            showSection(type);
        } else {
            showToast('Ошибка удаления', 'error');
        }
    } catch (e) {
        showToast('Ошибка сети', 'error');
    }
}

// --- Helpers ---
function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const d = new Date(dateStr);
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show' + (type ? ' toast--' + type : '');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}
