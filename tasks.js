/**
 * AXION PRO MAX - Tasks Module
 * Anti-Gravity Productivity Suite
 * Version: 1.0.0
 */

const Tasks = {
  data: {
    tasks: [],
    filter: 'all',
    sortBy: 'date',
    searchQuery: ''
  },

  init() {
    this.loadData();
    this.render();
    this.setupEventListeners();
    this.checkUrlParams();
  },

  loadData() {
    this.data.tasks = Utils.storage.get(AppConfig.storage.tasks) || [];
  },

  saveData() {
    Utils.storage.set(AppConfig.storage.tasks, this.data.tasks);
  },

  checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      setTimeout(() => this.openModal(), 500);
    }
  },

  render() {
    this.renderTaskList();
    this.renderFilters();
    this.renderStats();
  },

  renderTaskList() {
    const container = document.getElementById('task-list');
    if (!container) return;

    let filteredTasks = this.getFilteredTasks();

    if (filteredTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">No tasks found</div>
          <div class="empty-state-description">
            ${this.data.tasks.length === 0 
              ? 'Create your first task to get started!' 
              : 'Try adjusting your filters or search query.'}
          </div>
          <button class="btn btn-primary" onclick="Tasks.openModal()">Create Task</button>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredTasks.map(task => `
      <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
        <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="Tasks.toggleTask('${task.id}')">
          ${task.completed ? '✓' : ''}
        </div>
        <div class="task-content">
          <div class="task-title">${task.title}</div>
          <div class="task-meta">
            ${task.dueDate ? `<span>📅 ${Utils.formatDate(task.dueDate)}</span>` : ''}
            ${task.category ? `<span class="badge">${task.category}</span>` : ''}
            ${task.priority ? `<span class="badge badge-${task.priority}">${task.priority}</span>` : ''}
          </div>
        </div>
        <div class="task-actions">
          <button class="btn btn-ghost btn-sm" onclick="Tasks.editTask('${task.id}')">Edit</button>
          <button class="btn btn-ghost btn-sm" onclick="Tasks.deleteTask('${task.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  },

  renderFilters() {
    const container = document.getElementById('filter-tabs');
    if (!container) return;

    const filters = [
      { value: 'all', label: 'All Tasks' },
      { value: 'active', label: 'Active' },
      { value: 'completed', label: 'Completed' }
    ];

    container.innerHTML = filters.map(f => `
      <div class="tab ${this.data.filter === f.value ? 'active' : ''}" 
           onclick="Tasks.setFilter('${f.value}')">
        ${f.label}
      </div>
    `).join('');
  },

  renderStats() {
    const total = this.data.tasks.length;
    const completed = this.data.tasks.filter(t => t.completed).length;
    const active = total - completed;

    const statsEl = document.getElementById('task-stats');
    if (statsEl) {
      statsEl.textContent = `${completed}/${total} completed`;
    }
  },

  getFilteredTasks() {
    let tasks = [...this.data.tasks];

    // Apply status filter
    if (this.data.filter === 'active') {
      tasks = tasks.filter(t => !t.completed);
    } else if (this.data.filter === 'completed') {
      tasks = tasks.filter(t => t.completed);
    }

    // Apply search
    if (this.data.searchQuery) {
      const query = this.data.searchQuery.toLowerCase();
      tasks = tasks.filter(t => 
        t.title.toLowerCase().includes(query) || 
        (t.description && t.description.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    switch (this.data.sortBy) {
      case 'date':
        tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'priority':
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        tasks.sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));
        break;
      case 'dueDate':
        tasks.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
        break;
    }

    return tasks;
  },

  setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('task-search');
    if (searchInput) {
      const debouncedSearch = Utils.debounce((query) => {
        this.data.searchQuery = query;
        this.renderTaskList();
      }, 300);
      searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value));
    }

    // Sort select
    const sortSelect = document.getElementById('task-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.data.sortBy = e.target.value;
        this.renderTaskList();
      });
    }

    // Add task button
    const addBtn = document.getElementById('add-task-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openModal());
    }

    // Modal close
    const closeBtn = document.getElementById('task-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    // Form submit
    const taskForm = document.getElementById('task-form');
    if (taskForm) {
      taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveTask();
      });
    }

    // Delete completed tasks button
    const deleteCompletedBtn = document.getElementById('delete-completed');
    if (deleteCompletedBtn) {
      deleteCompletedBtn.addEventListener('click', () => this.deleteCompleted());
    }
  },

  openModal(taskId = null) {
    const modal = document.getElementById('task-modal');
    const form = document.getElementById('task-form');
    
    if (taskId) {
      const task = this.data.tasks.find(t => t.id === taskId);
      if (task) {
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-due-date').value = task.dueDate || '';
        document.getElementById('task-priority').value = task.priority || 'medium';
        document.getElementById('task-category').value = task.category || '';
        form.dataset.taskId = taskId;
      }
    } else {
      form.reset();
      delete form.dataset.taskId;
    }

    Modal.open('task-modal');
  },

  closeModal() {
    Modal.close('task-modal');
  },

  saveTask() {
    const form = document.getElementById('task-form');
    const taskId = form.dataset.taskId;

    const taskData = {
      title: document.getElementById('task-title').value.trim(),
      description: document.getElementById('task-description').value.trim(),
      dueDate: document.getElementById('task-due-date').value || null,
      priority: document.getElementById('task-priority').value,
      category: document.getElementById('task-category').value || null,
      completed: false,
      createdAt: new Date().toISOString()
    };

    if (!taskData.title) {
      Toast.show({ type: 'error', title: 'Error', message: 'Task title is required!' });
      return;
    }

    if (taskId) {
      // Update existing task
      const index = this.data.tasks.findIndex(t => t.id === taskId);
      if (index !== -1) {
        this.data.tasks[index] = { ...this.data.tasks[index], ...taskData };
      }
    } else {
      // Create new task
      taskData.id = Utils.generateId();
      this.data.tasks.unshift(taskData);
    }

    this.saveData();
    this.closeModal();
    this.render();
    
    Toast.show({
      type: 'success',
      title: taskId ? 'Task Updated!' : 'Task Created!',
      message: taskData.title
    });
  },

  toggleTask(taskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveData();
      
      if (task.completed) {
        Confetti.burst(window.innerWidth / 2, window.innerHeight / 2);
        Toast.show({ type: 'success', title: 'Task completed! 🎉' });
      }
      
      this.render();
    }
  },

  editTask(taskId) {
    this.openModal(taskId);
  },

  deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.data.tasks = this.data.tasks.filter(t => t.id !== taskId);
      this.saveData();
      this.render();
      Toast.show({ type: 'success', title: 'Task deleted!' });
    }
  },

  deleteCompleted() {
    const completedTasks = this.data.tasks.filter(t => t.completed);
    if (completedTasks.length === 0) {
      Toast.show({ type: 'info', title: 'No completed tasks!' });
      return;
    }

    if (confirm(`Delete ${completedTasks.length} completed tasks?`)) {
      this.data.tasks = this.data.tasks.filter(t => !t.completed);
      this.saveData();
      this.render();
      Toast.show({ type: 'success', title: 'Completed tasks deleted!' });
    }
  },

  setFilter(filter) {
    this.data.filter = filter;
    this.render();
  }
};

window.Tasks = Tasks;
