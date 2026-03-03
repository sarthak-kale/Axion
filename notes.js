/**
 * AXION PRO MAX - Notes Module
 * Anti-Gravity Productivity Suite
 * Version: 1.0.0
 */

const Notes = {
  data: {
    notes: [],
    selectedNote: null,
    searchQuery: '',
    filter: 'all'
  },

  init() {
    this.loadData();
    this.render();
    this.setupEventListeners();
    this.checkUrlParams();
  },

  loadData() {
    this.data.notes = Utils.storage.get(AppConfig.storage.notes) || [];
  },

  saveData() {
    Utils.storage.set(AppConfig.storage.notes, this.data.notes);
  },

  checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      setTimeout(() => this.createNote(), 500);
    }
  },

  render() {
    this.renderNoteList();
    this.renderEditor();
  },

  renderNoteList() {
    const container = document.getElementById('note-list');
    if (!container) return;

    let filteredNotes = this.getFilteredNotes();

    if (filteredNotes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <div class="empty-state-title">No notes yet</div>
          <div class="empty-state-description">Create your first note!</div>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredNotes.map(note => `
      <div class="note-item ${this.data.selectedNote === note.id ? 'selected' : ''}" 
           onclick="Notes.selectNote('${note.id}')">
        <div class="note-title">${note.title || 'Untitled'}</div>
        <div class="note-preview">${note.content.substring(0, 100)}...</div>
        <div class="note-meta">
          <span>${Utils.formatDate(note.updatedAt)}</span>
          ${note.category ? `<span class="badge">${note.category}</span>` : ''}
        </div>
      </div>
    `).join('');
  },

  renderEditor() {
    const editorContainer = document.getElementById('note-editor');
    if (!editorContainer) return;

    if (!this.data.selectedNote) {
      const note = this.data.notes.find(n => n.id === this.data.selectedNote);
      if (!note) {
        editorContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">✏️</div>
            <div class="empty-state-title">Select a note</div>
            <div class="empty-state-description">Choose a note from the list or create a new one</div>
          </div>
        `;
        return;
      }
    }

    const note = this.data.notes.find(n => n.id === this.data.selectedNote);
    if (!note) return;

    editorContainer.innerHTML = `
      <input type="text" class="note-title-input" id="note-title" 
             value="${note.title || ''}" placeholder="Note title..." 
             oninput="Notes.updateNote('${note.id}', 'title', this.value)">
      <textarea class="note-content-input" id="note-content" 
                placeholder="Start writing..."
                oninput="Notes.updateNote('${note.id}', 'content', this.value)">${note.content || ''}</textarea>
      <div class="note-footer">
        <span class="note-date">Last edited: ${Utils.formatDate(note.updatedAt)}</span>
        <button class="btn btn-ghost btn-sm" onclick="Notes.deleteNote('${note.id}')">Delete</button>
      </div>
    `;
  },

  getFilteredNotes() {
    let notes = [...this.data.notes];

    if (this.data.searchQuery) {
      const query = this.data.searchQuery.toLowerCase();
      notes = notes.filter(n => 
        n.title.toLowerCase().includes(query) || 
        n.content.toLowerCase().includes(query)
      );
    }

    notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return notes;
  },

  setupEventListeners() {
    const searchInput = document.getElementById('note-search');
    if (searchInput) {
      const debouncedSearch = Utils.debounce((query) => {
        this.data.searchQuery = query;
        this.renderNoteList();
      }, 300);
      searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value));
    }

    const addBtn = document.getElementById('add-note-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.createNote());
    }
  },

  createNote() {
    const newNote = {
      id: Utils.generateId(),
      title: '',
      content: '',
      category: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.notes.unshift(newNote);
    this.data.selectedNote = newNote.id;
    this.saveData();
    this.render();
    
    // Focus on title input
    setTimeout(() => {
      const titleInput = document.getElementById('note-title');
      if (titleInput) titleInput.focus();
    }, 100);
  },

  selectNote(noteId) {
    this.data.selectedNote = noteId;
    this.renderNoteList();
    this.renderEditor();
  },

  updateNote(noteId, field, value) {
    const note = this.data.notes.find(n => n.id === noteId);
    if (note) {
      note[field] = value;
      note.updatedAt = new Date().toISOString();
      this.saveData();
      
      // Update preview in list
      this.renderNoteList();
    }
  },

  deleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    this.data.notes = this.data.notes.filter(n => n.id !== noteId);
    
    if (this.data.selectedNote === noteId) {
      this.data.selectedNote = this.data.notes.length > 0 ? this.data.notes[0].id : null;
    }
    
    this.saveData();
    this.render();
    
    Toast.show({ type: 'success', title: 'Note deleted!' });
  }
};

window.Notes = Notes;
