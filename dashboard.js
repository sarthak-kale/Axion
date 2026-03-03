/**
 * AXION PRO MAX - Dashboard Module
 * Anti-Gravity Productivity Suite
 * Version: 1.0.0
 */

const Dashboard = {
  data: {
    tasks: [],
    habits: [],
    notes: [],
    analytics: {}
  },

  init() {
    this.loadData();
    this.render();
    this.setupEventListeners();
    this.animateStats();
  },

  loadData() {
    this.data.tasks = Utils.storage.get(AppConfig.storage.tasks) || [];
    this.data.habits = Utils.storage.get(AppConfig.storage.habits) || [];
    this.data.notes = Utils.storage.get(AppConfig.storage.notes) || [];
    this.data.analytics = Utils.storage.get(AppConfig.storage.analytics) || this.getDefaultAnalytics();
  },

  getDefaultAnalytics() {
    return {
      totalTasks: 0,
      completedTasks: 0,
      totalHabits: 0,
      completedHabits: 0,
      focusSessions: 0,
      totalFocusTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      weeklyActivity: Array(7).fill(0),
      dailyScores: []
    };
  },

  render() {
    this.renderGreeting();
    this.renderStats();
    this.renderQuickActions();
    this.renderRecentTasks();
    this.renderProductivityScore();
    this.renderWeeklyHeatmap();
  },

  renderGreeting() {
    const greetingEl = document.getElementById('greeting');
    if (greetingEl) {
      greetingEl.textContent = Utils.getTimeGreeting();
    }
  },

  renderStats() {
    const stats = {
      'stat-tasks': this.data.tasks.length,
      'stat-completed': this.data.tasks.filter(t => t.completed).length,
      'stat-habits': this.data.habits.length,
      'stat-streak': this.data.analytics.currentStreak || 0
    };

    Object.entries(stats).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });
  },

  renderQuickActions() {
    const actionsContainer = document.getElementById('quick-actions');
    if (!actionsContainer) return;

    const actions = [
      { icon: '➕', label: 'New Task', action: () => window.location.href = 'tasks.html?action=new' },
      { icon: '🎯', label: 'Focus Mode', action: () => window.location.href = 'focus.html' },
      { icon: '📝', label: 'Add Note', action: () => window.location.href = 'notes.html?action=new' },
      { icon: '📊', label: 'Analytics', action: () => window.location.href = 'analytics.html' }
    ];

    actionsContainer.innerHTML = actions.map(action => `
      <button class="btn btn-secondary ripple-effect" onclick="${action.action.toString().replace(/function\(\)\{|\}/g, '')}">
        <span class="action-icon">${action.icon}</span>
        <span>${action.label}</span>
      </button>
    `).join('');
  },

  renderRecentTasks() {
    const container = document.getElementById('recent-tasks');
    if (!container) return;

    const recentTasks = this.data.tasks
      .filter(t => !t.completed)
      .slice(0, 5);

    if (recentTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">No tasks yet</div>
          <div class="empty-state-description">Create your first task to get started!</div>
        </div>
      `;
      return;
    }

    container.innerHTML = recentTasks.map(task => `
      <div class="task-item" data-id="${task.id}">
        <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="Dashboard.toggleTask('${task.id}')">
          ${task.completed ? '✓' : ''}
        </div>
        <div class="task-content">
          <div class="task-title">${task.title}</div>
          <div class="task-meta">
            ${task.dueDate ? `<span>📅 ${Utils.formatDate(task.dueDate)}</span>` : ''}
            ${task.priority ? `<span class="badge badge-${task.priority}">${task.priority}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  },

  renderProductivityScore() {
    const scoreContainer = document.getElementById('productivity-score');
    if (!scoreContainer) return;

    // Calculate score based on various metrics
    const taskCompletionRate = this.data.tasks.length > 0 
      ? (this.data.tasks.filter(t => t.completed).length / this.data.tasks.length) * 100 
      : 0;
    const habitCompletionRate = this.data.habits.length > 0
      ? (this.data.habits.filter(h => h.completedToday).length / this.data.habits.length) * 100
      : 0;
    const focusScore = Math.min(100, (this.data.analytics.totalFocusTime / (60 * 60 * 1000)) * 20); // 1 hour = 20 points

    const score = Math.round((taskCompletionRate * 0.4) + (habitCompletionRate * 0.3) + (focusScore * 0.3));

    // Animate the score circle
    const progress = scoreContainer.querySelector('.productivity-score-progress');
    const value = scoreContainer.querySelector('.productivity-score-value');

    if (progress) {
      const circumference = 2 * Math.PI * 65; // radius = 65
      const offset = circumference - (score / 100) * circumference;
      setTimeout(() => {
        progress.style.strokeDashoffset = offset;
      }, 100);
    }

    if (value) {
      let current = 0;
      const interval = setInterval(() => {
        current += 1;
        value.textContent = current;
        if (current >= score) clearInterval(interval);
      }, 20);
    }
  },

  renderWeeklyHeatmap() {
    const container = document.getElementById('heatmap');
    if (!container) return;

    // Generate sample data for the heatmap
    const weeks = 12;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let html = '<div class="heatmap-grid">';

    // Day labels
    html += '<div class="heatmap-row">';
    days.forEach(day => {
      html += `<div class="heatmap-cell-label">${day.charAt(0)}</div>`;
    });
    html += '</div>';

    // Generate cells
    for (let d = 0; d < 7; d++) {
      html += '<div class="heatmap-row">';
      for (let w = 0; w < weeks; w++) {
        // Random activity level for demo
        const level = Math.floor(Math.random() * 6);
        html += `<div class="heatmap-cell level-${level}" title="${days[d]} Week ${w + 1}: ${level * 2} tasks"></div>`;
      }
      html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
  },

  setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refresh-dashboard');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadData();
        this.render();
        Toast.show({ type: 'success', title: 'Dashboard refreshed!' });
      });
    }

    // Date display
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  },

  animateStats() {
    const statValues = document.querySelectorAll('.stat-value');
    statValues.forEach(stat => {
      const target = parseInt(stat.textContent) || 0;
      let current = 0;
      const increment = target / 30;
      
      const animate = () => {
        current += increment;
        if (current < target) {
          stat.textContent = Math.floor(current);
          requestAnimationFrame(animate);
        } else {
          stat.textContent = target;
        }
      };
      
      setTimeout(animate, 500);
    });
  },

  toggleTask(taskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      Utils.storage.set(AppConfig.storage.tasks, this.data.tasks);
      
      if (task.completed) {
        Confetti.burst(window.innerWidth / 2, window.innerHeight / 2);
        Toast.show({ type: 'success', title: 'Task completed! 🎉' });
      }
      
      this.renderRecentTasks();
      this.renderProductivityScore();
    }
  }
};

// Make Dashboard globally accessible
window.Dashboard = Dashboard;
