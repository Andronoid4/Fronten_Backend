// Константы
const STORAGE_KEY = 'pwa-notes-data';
const NOTES_GRID = document.getElementById('notes-grid');
const EMPTY_STATE = document.getElementById('empty-state');
const NOTE_MODAL = document.getElementById('note-modal');
const NOTE_FORM = document.getElementById('note-form');
const SEARCH_INPUT = document.getElementById('search-input');
const STATUS_TEXT = document.getElementById('status-text');
const STATUS_INDICATOR = document.getElementById('status-indicator');

// Элементы модального окна
const ADD_NOTE_BTN = document.getElementById('add-note-btn');
const CLOSE_MODAL = document.getElementById('close-modal');
const MODAL_TITLE = document.getElementById('modal-title');
const NOTE_ID_INPUT = document.getElementById('note-id');
const NOTE_TITLE_INPUT = document.getElementById('note-title');
const NOTE_CONTENT_INPUT = document.getElementById('note-content');
const NOTE_COLOR_INPUT = document.getElementById('note-color');
const DELETE_NOTE_BTN = document.getElementById('delete-note');
const COLOR_OPTIONS = document.querySelectorAll('.color-option');

// Состояние приложения
let notes = [];
let selectedColor = '#ffffff';

// ==================== ФУНКЦИИ РАБОТЫ С ДАННЫМИ ====================

function loadNotes() {
    const stored = localStorage.getItem(STORAGE_KEY);
    notes = stored ? JSON.parse(stored) : [];
    renderNotes();
}

function saveNotes() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function createNote(title, content, color) {
    return {
        id: Date.now().toString(),
        title,
        content,
        color,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

function addNote(note) {
    notes.unshift(note);
    saveNotes();
    renderNotes();
}

function updateNote(id, updates) {
    notes = notes.map(note => 
        note.id === id 
            ? { ...note, ...updates, updatedAt: new Date().toISOString() }
            : note
    );
    saveNotes();
    renderNotes();
}

function deleteNote(id) {
    notes = notes.filter(note => note.id !== id);
    saveNotes();
    renderNotes();
}

function getNoteById(id) {
    return notes.find(note => note.id === id);
}

function toggleNoteCompleted(id) {
    const note = getNoteById(id);
    if (note) {
        updateNote(id, { completed: !note.completed });
    }
}

// ==================== ФУНКЦИИ ОТРИСОВКИ ====================

function renderNotes(filterText = '') {
    const filteredNotes = filterText 
        ? notes.filter(note => 
            note.title.toLowerCase().includes(filterText.toLowerCase()) ||
            note.content.toLowerCase().includes(filterText.toLowerCase())
          )
        : notes;

    NOTES_GRID.innerHTML = '';
    
    if (filteredNotes.length === 0) {
        EMPTY_STATE.classList.remove('hidden');
        NOTES_GRID.classList.add('hidden');
    } else {
        EMPTY_STATE.classList.add('hidden');
        NOTES_GRID.classList.remove('hidden');
        
        filteredNotes.forEach(note => {
            const card = createNoteCard(note);
            NOTES_GRID.appendChild(card);
        });
    }
}

function createNoteCard(note) {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.style.backgroundColor = note.color;
    card.dataset.id = note.id;
    
    if (note.completed) {
        card.classList.add('completed');
    }
    
    const date = new Date(note.updatedAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    card.innerHTML = `
        <div class="note-card-header">
            <h3 class="note-card-title ${note.completed ? 'done' : ''}">${escapeHtml(note.title)}</h3>
            <span class="note-card-date">${date}</span>
        </div>
        <p class="note-card-content ${note.completed ? 'done' : ''}">${escapeHtml(note.content)}</p>
        <div class="note-card-footer">
            <div class="note-footer-left">
                <button class="complete-btn ${note.completed ? 'completed' : ''}" data-id="${note.id}" title="${note.completed ? 'Отметить как невыполненное' : 'Отметить как выполненное'}">
                    ${note.completed ? '✓' : ''}
                </button>
                <div class="note-color-indicator" style="background: ${note.color}"></div>
            </div>
            <div class="note-actions">
                <button class="action-btn edit-btn" data-id="${note.id}">✏️</button>
                <button class="action-btn delete-btn" data-id="${note.id}">🗑️</button>
            </div>
        </div>
    `;
    
    // Обработчик кнопки выполнения
    const completeBtn = card.querySelector('.complete-btn');
    completeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNoteCompleted(note.id);
    });
    
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('action-btn') && !e.target.classList.contains('complete-btn')) {
            openEditModal(note.id);
        }
    });
    
    card.querySelector('.edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(note.id);
    });
    
    card.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Удалить эту заметку?')) {
            deleteNote(note.id);
        }
    });
    
    return card;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== МОДАЛЬНОЕ ОКНО ====================

function openAddModal() {
    MODAL_TITLE.textContent = 'Новая заметка';
    NOTE_ID_INPUT.value = '';
    NOTE_TITLE_INPUT.value = '';
    NOTE_CONTENT_INPUT.value = '';
    selectedColor = '#ffffff';
    NOTE_COLOR_INPUT.value = selectedColor;
    DELETE_NOTE_BTN.classList.add('hidden');
    updateColorSelection();
    NOTE_MODAL.classList.remove('hidden');
    NOTE_TITLE_INPUT.focus();
}

function openEditModal(id) {
    const note = getNoteById(id);
    if (!note) return;
    
    MODAL_TITLE.textContent = 'Редактировать заметку';
    NOTE_ID_INPUT.value = note.id;
    NOTE_TITLE_INPUT.value = note.title;
    NOTE_CONTENT_INPUT.value = note.content;
    selectedColor = note.color;
    NOTE_COLOR_INPUT.value = selectedColor;
    DELETE_NOTE_BTN.classList.remove('hidden');
    updateColorSelection();
    NOTE_MODAL.classList.remove('hidden');
    NOTE_TITLE_INPUT.focus();
}

function closeNoteModal() {
    NOTE_MODAL.classList.add('hidden');
}

function updateColorSelection() {
    COLOR_OPTIONS.forEach(option => {
        if (option.dataset.color === selectedColor) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

// ==================== СТАТУС СЕТИ ====================

function updateNetworkStatus() {
    if (navigator.onLine) {
        STATUS_TEXT.textContent = 'Онлайн';
        STATUS_INDICATOR.className = 'status-dot online';
    } else {
        STATUS_TEXT.textContent = 'Офлайн';
        STATUS_INDICATOR.className = 'status-dot offline';
    }
}

// ==================== СОБЫТИЯ ====================

ADD_NOTE_BTN.addEventListener('click', openAddModal);
CLOSE_MODAL.addEventListener('click', closeNoteModal);

NOTE_MODAL.addEventListener('click', (e) => {
    if (e.target === NOTE_MODAL) {
        closeNoteModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !NOTE_MODAL.classList.contains('hidden')) {
        closeNoteModal();
    }
});

COLOR_OPTIONS.forEach(option => {
    option.addEventListener('click', () => {
        selectedColor = option.dataset.color;
        NOTE_COLOR_INPUT.value = selectedColor;
        updateColorSelection();
    });
});

NOTE_FORM.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = NOTE_ID_INPUT.value;
    const title = NOTE_TITLE_INPUT.value.trim();
    const content = NOTE_CONTENT_INPUT.value.trim();
    
    if (!title || !content) {
        alert('Заполните заголовок и содержимое');
        return;
    }
    
    if (id) {
        updateNote(id, { title, content, color: selectedColor });
    } else {
        const note = createNote(title, content, selectedColor);
        addNote(note);
    }
    
    closeNoteModal();
});

DELETE_NOTE_BTN.addEventListener('click', () => {
    const id = NOTE_ID_INPUT.value;
    if (id && confirm('Удалить эту заметку?')) {
        deleteNote(id);
        closeNoteModal();
    }
});

SEARCH_INPUT.addEventListener('input', (e) => {
    renderNotes(e.target.value.trim());
});

window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

// Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('✅ Service Worker зарегистрирован:', registration.scope);
        } catch (error) {
            console.error('❌ Ошибка регистрации Service Worker:', error);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    updateNetworkStatus();
});