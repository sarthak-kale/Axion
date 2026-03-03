/**
 * AXION PRO MAX - Analytics Module
 * Anti-Gravity Productivity Suite
 * Version: 1.0.0
 */

const Analytics = {
  data: {
    analytics: {},
    tasks: [],
    habits: [],
    notes: []
  },

  init() {
    this.loadData();
    this.render();
    this.setupEventListeners();
  },

  loadData() {
    this.data.analytics = Utils.storage.get(AppConfig.storage.analytics) || this.getDefaultAnalytics();
    this.data.tasks = Utils.storage.get(AppConfig.storage.tasks) || [];
    this.data.habits = Utils.storage.get(AppConfig.storage.habits) || [];
    this.data.notes = Utils.storage.get(AppConfig.storage.notes) || [];
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
      dailyScores: [],
      taskCompletionByDay: {},
      habitCompletionByDay: {}
    };
  },

  render() {
    this.renderOverview();
    this.renderProductivityScore();
    this.renderActivityHeatmap();
    this.renderTaskStats();
    this.renderFocusStats();
    this.renderStreakStats();
  },

  renderOverview() {
    // Calculate totals
    const totalTasks = this.data.tasks.length;
    const completedTasks = this.data.tasks.filter(t => t.completed).length;
    const totalHabits = this.data.habits.length;
    const completedHabits = this.data.habits.filter(h => h.completedToday).length;

    const stats = {
      'analytics-tasks-total': totalTasks,
      'analytics-tasks-completed': completedTasks,
      'analytics-habits-total': totalHabits,
      'analytics-notes-total': this.data.notes.length
    };

    Object.entries(stats).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });
  },

  renderProductivityScore() {
    const scoreContainer = document.getElementById('productivity-score');
    if (!scoreContainer) return;

    // Calculate weighted productivity score
    const taskRate = this.data.tasks.length > 0 
      ? (this.data.tasks.filter(t => t.completed).length / this.data.tasks.length) * 100 
      : 0;
    const habitRate = this.data.habits.length > 0
      ? (this.data.habits.filter(h => h.completedToday).length / this.data.habits.length) * 100
      : 0;
    const focusHours = (this.data.analytics.totalFocusTime || 0) / (60 * 60 * 1000);
    const focusScore = Math.min(100, focusHours * 20);

    const score = Math.round((taskRate * 0.4) + (habitRate * 0.3) + (focusScore * 0.3));

    // Animate score
    const valueEl = scoreContainer.querySelector('.stat-value');
    if (valueEl) {
      let current = 0;
      const interval = setInterval(() => {
        current += 1;
        valueEl.textContent = current;
        if (current >= score) clearInterval(interval);
      }, 20);
    }

    // Update progress circle
    const progress = scoreContainer.querySelector('.productivity-score-progress');
    if (progress) {
      const circumference = 2 * Math.PI * 65;
      const offset = circumference - (score / 100) * circumference;
      setTimeout(() => {
        progress.style.strokeDashoffset = offset;
      }, 100);
    }

    // Update label
    const labelEl = scoreContainer.querySelector('.stat-label');
    if (labelEl) {
      let label = 'Getting started';
      if (score >= 80) label = 'Excellent!';
      else if (score >= 60) label = 'Good progress';
      else if (score >= 40) label = 'Fair';
      else if (score >= 20) label = 'Just started';
      labelEl.textContent = label;
    }
  },

  renderActivityHeatmap() {
    const container = document.getElementById('activity-heatmap');
    if (!container) return;

    const weeks = 16;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let html = '<div class="heatmap-container">';
    
    // Generate cells for past 16 weeks
    for (let w = weeks - 1; w >= 0; w--) {
      html += '<div class="heatmap-week">';
      for (let d = 6; d >= 0; d--) {
        const date = new Date();
        date.setDate(date.getDate() - (w * 7 + d));
        const dateStr = date.toDateString();
        
        // Calculate activity level
        let level = 0;
        
        // Check tasks completed
        const tasksCompleted = this.data.tasks.filter(t => {
          if (!t.completedAt) return false;
          return new Date(t.completedAt).toDateString() === dateStr;
        }).length;
        
        // Check habits completed
        const habitsCompleted = this.data.habits.filter(h => {
          return h.completedDates && h.completedDates.includes(dateStr);
        }).length;
        
        const totalActivity = tasksCompleted + habitsCompleted;
        if (totalActivity > 0) level = Math.min(5, Math.ceil(totalActivity / 2));
        
        const isToday = date.toDateString() === new Date().toDateString();
        
        html += `<div class="heatmap-cell level-${level} ${isToday ? 'today' : ''}" 
                      title="${date.toLocaleDateString()}: ${totalActivity} activities"></div>`;
      }
      html += '</div>';
    }
    
    // Day labels
    html += '<div class="heatmap-labels">';
    [1, 3, 5].forEach(d => {
      html += `<span>${days[d]}</span>`;
    });
    html += '</div>';
    
    html += '</div>';
    container.innerHTML = html;
  },

  renderTaskStats() {
    // Task completion chart data
    const completed = this.data.tasks.filter(t => t.completed).length;
    const active = this.data.tasks.length - completed;

    const activeEl = document.getElementById('task-active-count');
    const completedEl = document.getElementById('task-completed-count');
    
    if (activeEl) activeEl.textContent = active;
    if (completedEl) completedEl.textContent = completed;

    // Update progress bars
    const progressEl = document.getElementById('task-progress');
    if (progressEl && this.data.tasks.length > 0) {
      const percentage = (completed / this.data.tasks.length) * 100;
      progressEl.style.width = `${percentage}%`;
    }
  },

  renderFocusStats() {
    const focusSessions = this.data.analytics.focusSessions || 0;
    const totalTime = this.data.analytics.totalFocusTime || 0;
    
    const hours = Math.floor(totalTime / (60 * 60 * 1000));
    const minutes = Math.floor((totalTime % (60 * 60 * 1000)) / (60 * 1000));

    const stats = {
      'focus-sessions': focusSessions,
      'focus-hours': hours,
      'focus-minutes': minutes
    };

    Object.entries(stats).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });

    // Average session length
    const avgEl = document.getElementById('focus-avg');
    if (avgEl && focusSessions > 0) {
      const avgMinutes = Math.round(totalTime / focusSessions / 60000);
      avgEl.textContent = `${avgMinutes} min`;
    }
  },

  renderStreakStats() {
    const currentStreak = this.data.analytics.currentStreak || 0;
    const longestStreak = this.data.analytics.longestStreak || 0;

    const stats = {
      'streak-current': currentStreak,
      'streak-longest': longestStreak
    };

    Object.entries(stats).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });
  },

  setupEventListeners() {
    const refreshBtn = document.getElementById('refresh-analytics');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadData();
        this.render();
        Toast.show({ type: 'success', title: 'Analytics refreshed!' });
      });
    }

    const exportBtn = document.getElementById('export-analytics');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData());
    }
  },

  exportData() {
    const data = {
      analytics: this.data.analytics,
      tasks: this.data.tasks,
      habits: this.data.habits,
      notes: this.data.notes,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `axion-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    Toast.show({ type: 'success', title: 'Data exported!' });
  }
};

window.Analytics = Analytics;
