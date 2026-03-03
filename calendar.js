/**
 * AXION PRO MAX - Calendar Module
 * Anti-Gravity Productivity Suite
 * Version: 1.0.0
 */

const CalendarApp = {
  data: {
    currentDate: new Date(),
    selectedDate: null,
    tasks: [],
    view: 'month'
  },

  init() {
    this.loadData();
    this.render();
    this.setupEventListeners();
  },

  loadData() {
    this.data.tasks = Utils.storage.get(AppConfig.storage.tasks) || [];
  },

  render() {
    this.renderHeader();
    this.renderCalendarGrid();
    this.renderTaskList();
  },

  renderHeader() {
    const monthEl = document.getElementById('calendar-month');
    if (monthEl) {
      monthEl.textContent = this.data.currentDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    }
  },

  renderCalendarGrid() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;

    const year = this.data.currentDate.getFullYear();
    const month = this.data.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let html = '<div class="calendar-grid">';
    
    // Day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
      html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Generate 6 weeks of days
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const isToday = currentDate.getTime() === today.getTime();
      const isCurrentMonth = currentDate.getMonth() === month;
      const isSelected = this.data.selectedDate && 
        currentDate.toDateString() === this.data.selectedDate.toDateString();
      
      // Check if date has tasks
      const hasTasks = this.data.tasks.some(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate).toDateString() === currentDate.toDateString();
      });
      
      html += `
        <div class="calendar-day ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasTasks ? 'has-task' : ''}" 
             onclick="CalendarApp.selectDate('${currentDate.toISOString()}')">
          ${currentDate.getDate()}
        </div>
      `;
    }
    
    html += '</div>';
    grid.innerHTML = html;
  },

  renderTaskList() {
    const container = document.getElementById('calendar-tasks');
    if (!container) return;

    let tasksToShow = this.data.tasks;
    
    if (this.data.selectedDate) {
      tasksToShow = this.data.tasks.filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate).toDateString() === this.data.selectedDate.toDateString();
      });
    }

    if (tasksToShow.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-title">
            ${this.data.selectedDate 
              ? `No tasks on ${Utils.formatDate(this.data.selectedDate)}` 
              : 'No upcoming tasks'}
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = tasksToShow.map(task => `
      <div class="task-item ${task.completed ? 'completed' : ''}">
        <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="CalendarApp.toggleTask('${task.id}')">
          ${task.completed ? '✓' : ''}
        </div>
        <div class="task-content">
          <div class="task-title">${task.title}</div>
          <div class="task-meta">
            ${task.priority ? `<span class="badge badge-${task.priority}">${task.priority}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  },

  setupEventListeners() {
    const prevBtn = document.getElementById('calendar-prev');
    const nextBtn = document.getElementById('calendar-next');
    const todayBtn = document.getElementById('calendar-today');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.navigateMonth(-1));
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.navigateMonth(1));
    }
    if (todayBtn) {
      todayBtn.addEventListener('click', () => this.goToToday());
    }
  },

  navigateMonth(delta) {
    this.data.currentDate.setMonth(this.data.currentDate.getMonth() + delta);
    this.render();
  },

  goToToday() {
    this.data.currentDate = new Date();
    this.data.selectedDate = new Date();
    this.render();
  },

  selectDate(dateString) {
    this.data.selectedDate = new Date(dateString);
    this.render();
  },

  toggleTask(taskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      Utils.storage.set(AppConfig.storage.tasks, this.data.tasks);
      this.renderTaskList();
      
      if (task.completed) {
        Confetti.burst(window.innerWidth / 2, window.innerHeight / 2);
      }
    }
  }
};

window.CalendarApp = CalendarApp;
