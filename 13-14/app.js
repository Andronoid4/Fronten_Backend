// ==================== КОНСТАНТЫ ====================
const STORAGE_KEY = 'pwa-notes-data';
const SERVER_URL = 'https://localhost:3001';

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let notes = [];
let selectedColor = '#ffffff';
let socket = null;
let lastLocalNoteId = null;
let publicKey = ''; // будет получен с сервера

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// ЕДИНАЯ ФУНКЦИЯ ДЛЯ ЛОКАЛЬНЫХ УВЕДОМЛЕНИЙ (TOAST)
function showNotificationToast(message, type = 'success') {
    const oldToast = document.querySelector('.custom-toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#4f46e5'};
        color: white;
        padding: 12px 25px;
        border-radius: 8px;
        z-index: 9999;
        font-weight: bold;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.top = '0px';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ==================== ЗАМЕТКИ ====================
function loadNotes() {
    const stored = localStorage.getItem(STORAGE_KEY);
    notes = stored ? JSON.parse(stored) : [];
}

function saveNotes() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function createNoteObject(title, content, color, id = null) {
    return {
        id: id || Date.now().toString(),
        title: title.trim(),
        content: content.trim(),
        color: color,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

function addNote(note, fromSocket = false) {
    if (notes.some(n => n.id === note.id)) return;
    notes.unshift(note);
    saveNotes();
    renderNotes();

    // ЛОКАЛЬНОЕ УВЕДОМЛЕНИЕ ДЛЯ СВОЕЙ ЗАМЕТКИ
    if (!fromSocket) {
        showNotificationToast(`✅ Заметка "${note.title}" добавлена!`, 'success');
    }

    if (!fromSocket && socket && socket.connected) {
        lastLocalNoteId = note.id;
        socket.emit('newNote', {
            id: note.id,
            title: note.title,
            content: note.content,
            color: note.color
        });
    }
}

function renderNotes(filterText = '') {
    const notesGrid = document.getElementById('notes-grid');
    const emptyState = document.getElementById('empty-state');
    if (!notesGrid || !emptyState) return;

    const filtered = filterText
        ? notes.filter(n => n.title.toLowerCase().includes(filterText.toLowerCase()) ||
                            n.content.toLowerCase().includes(filterText.toLowerCase()))
        : notes;

    notesGrid.innerHTML = '';

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
        emptyState.style.display = 'block';
    } else {
        emptyState.classList.add('hidden');
        emptyState.style.display = 'none';
        filtered.forEach(note => notesGrid.appendChild(createNoteCard(note)));
    }
}

function createNoteCard(note) {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.style.backgroundColor = note.color;
    if (note.completed) card.classList.add('completed');

    card.innerHTML = `
        <div class="note-card-header">
            <h3 class="${note.completed ? 'done' : ''}">${escapeHtml(note.title)}</h3>
        </div>
        <p class="${note.completed ? 'done' : ''}">${escapeHtml(note.content)}</p>
        <div class="note-card-footer">
            <button class="complete-btn">${note.completed ? '✓' : '○'}</button>
            <div class="note-actions">
                <button class="edit-btn">✏️</button>
                <button class="delete-btn">🗑️</button>
            </div>
        </div>
    `;

    card.querySelector('.complete-btn').onclick = (e) => {
        e.stopPropagation();
        note.completed = !note.completed;
        saveNotes();
        renderNotes();
    };
    card.querySelector('.delete-btn').onclick = (e) => {
        e.stopPropagation();
        if (confirm('Удалить заметку?')) {
            notes = notes.filter(n => n.id !== note.id);
            saveNotes();
            renderNotes();
        }
    };
    card.querySelector('.edit-btn').onclick = (e) => {
        e.stopPropagation();
        openModal(note);
    };
    card.onclick = () => openModal(note);
    return card;
}

// ==================== МОДАЛЬНОЕ ОКНО ====================
function openModal(note = null) {
    const modal = document.getElementById('note-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    modal.classList.add('active');

    const titleInput = document.getElementById('note-title');
    const contentInput = document.getElementById('note-content');
    const idInput = document.getElementById('note-id');
    const modalTitle = document.getElementById('modal-title');
    const deleteBtn = document.getElementById('delete-note');

    if (note) {
        modalTitle.textContent = 'Редактировать заметку';
        idInput.value = note.id;
        titleInput.value = note.title;
        contentInput.value = note.content;
        selectedColor = note.color;
        deleteBtn.classList.remove('hidden');
    } else {
        modalTitle.textContent = 'Новая заметка';
        document.getElementById('note-form').reset();
        idInput.value = '';
        selectedColor = '#ffffff';
        deleteBtn.classList.add('hidden');
    }
    updateColorSelection();
}

function closeModal() {
    const modal = document.getElementById('note-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

function updateColorSelection() {
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.color === selectedColor);
    });
}

// ==================== НАВИГАЦИЯ ====================
async function loadContent(page) {
    const appContent = document.getElementById('app-content');
    if (!appContent) return;
    try {
        const response = await fetch(`./content/${page}.html`);
        const html = await response.text();
        appContent.innerHTML = html;

        if (page === 'home') {
            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.oninput = (e) => renderNotes(e.target.value);
            renderNotes();
        }
    } catch (err) {
        appContent.innerHTML = `<div class="card"><p class="text-error">Ошибка загрузки контента.</p></div>`;
        console.error(err);
    }
}

function setActiveTab(activeId) {
    const homeBtn = document.getElementById('home-btn');
    const aboutBtn = document.getElementById('about-btn');
    if (homeBtn) homeBtn.classList.remove('active');
    if (aboutBtn) aboutBtn.classList.remove('active');
    const activeBtn = document.getElementById(activeId);
    if (activeBtn) activeBtn.classList.add('active');
}

// ==================== WEBSOCKET ====================
function initSocket() {
    if (typeof io === 'undefined') return;
    socket = io('https://localhost:3001');
    socket.on('noteAdded', (data) => {
        if (data.id === lastLocalNoteId) return;
        showNotificationToast(`📌 Новая заметка от другого пользователя: ${data.title}`, 'info');
        addNote(createNoteObject(data.title, data.content, data.color, data.id), true);
    });
}

// ==================== PUSH-УВЕДОМЛЕНИЯ (опционально) ====================
async function getVapidPublicKey() {
    try {
        const response = await fetch(`${SERVER_URL}/vapid-public-key`);
        const data = await response.json();
        publicKey = data.publicKey;
        console.log('VAPID Public Key получен:', publicKey);
    } catch (err) {
        console.error('Ошибка получения VAPID ключа:', err);
    }
}

async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        console.log('Service Worker зарегистрирован:', registration.scope);
        setupPushButtons();
    } catch (error) {
        console.error('Ошибка регистрации Service Worker:', error);
    }
}

async function setupPushButtons() {
    const enableBtn = document.getElementById('enable-push');
    const disableBtn = document.getElementById('disable-push');
    if (!enableBtn || !disableBtn) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
        enableBtn.classList.add('hidden');
        disableBtn.classList.remove('hidden');
    } else {
        enableBtn.classList.remove('hidden');
        disableBtn.classList.add('hidden');
    }

    const newEnableBtn = enableBtn.cloneNode(true);
    const newDisableBtn = disableBtn.cloneNode(true);
    enableBtn.parentNode.replaceChild(newEnableBtn, enableBtn);
    disableBtn.parentNode.replaceChild(newDisableBtn, disableBtn);

    newEnableBtn.addEventListener('click', async () => {
        if (Notification.permission === 'denied') {
            showNotificationToast('Уведомления запрещены.', 'error');
            return;
        }
        await subscribeToPush();
        setupPushButtons();
    });

    newDisableBtn.addEventListener('click', async () => {
        await unsubscribeFromPush();
        setupPushButtons();
    });
}

async function subscribeToPush() {
    if (!('PushManager' in window) || !publicKey) {
        showNotificationToast('Push не поддерживается', 'error');
        return;
    }
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
        await fetch(`${SERVER_URL}/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });
        showNotificationToast('✅ Уведомления включены!', 'success');
    } catch (err) {
        console.error(err);
        showNotificationToast('Ошибка: ' + err.message, 'error');
    }
}

async function unsubscribeFromPush() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            await fetch(`${SERVER_URL}/unsubscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: subscription.endpoint })
            });
            await subscription.unsubscribe();
            showNotificationToast('🔕 Уведомления отключены', 'success');
        }
    } catch (err) {
        console.error(err);
        showNotificationToast('Ошибка отключения', 'error');
    }
}

// ==================== СТАРТ ====================
document.addEventListener('DOMContentLoaded', async () => {
    loadNotes();
    initSocket();
    await getVapidPublicKey();
    await registerServiceWorker();

    const addBtn = document.getElementById('add-note-btn');
    if (addBtn) addBtn.onclick = () => openModal();

    const closeBtn = document.getElementById('close-modal');
    if (closeBtn) closeBtn.onclick = closeModal;
    
    const modal = document.getElementById('note-modal');
    if (modal) modal.onclick = (e) => { if (e.target === modal) closeModal(); };

    const noteForm = document.getElementById('note-form');
    if (noteForm) {
        noteForm.onsubmit = (e) => {
            e.preventDefault();
            const id = document.getElementById('note-id').value;
            const title = document.getElementById('note-title').value;
            const content = document.getElementById('note-content').value;
            if (id) {
                const note = notes.find(n => n.id === id);
                if (note) {
                    note.title = title;
                    note.content = content;
                    note.color = selectedColor;
                    saveNotes();
                    renderNotes();
                    showNotificationToast(`✏️ Заметка "${title}" обновлена`, 'info');
                }
            } else {
                addNote(createNoteObject(title, content, selectedColor));
                showNotificationToast(`✅ Заметка добавлена!`, 'success');
            }
            closeModal();
        };
    }

    const deleteNoteBtn = document.getElementById('delete-note');
    if (deleteNoteBtn) {
        deleteNoteBtn.onclick = () => {
            const id = document.getElementById('note-id').value;
            notes = notes.filter(n => n.id !== id);
            saveNotes();
            renderNotes();
            closeModal();
        };
    }

    const colorPicker = document.querySelector('.color-picker');
    if (colorPicker) {
        colorPicker.onclick = (e) => {
            if (e.target.classList.contains('color-option')) {
                selectedColor = e.target.dataset.color;
                updateColorSelection();
            }
        };
    }

    const homeBtn = document.getElementById('home-btn');
    const aboutBtn = document.getElementById('about-btn');
    if (homeBtn) homeBtn.onclick = () => { setActiveTab('home-btn'); loadContent('home'); };
    if (aboutBtn) aboutBtn.onclick = () => { setActiveTab('about-btn'); loadContent('about'); };

    loadContent('home');
});