/**
 * AXION PRO MAX - Habits Module
 * Anti-Gravity Productivity Suite
 * Version: 1.0.0
 */

const Habits = {
  data: {
    habits: [],
    filter: 'all'
  },

  init() {
    this.loadData();
    this.checkStreaks();
    this.render();
    this.setupEventListeners();
  },

  loadData() {
    this.data.habits = Utils.storage.get(AppConfig.storage.habits) || [];
  },

  saveData() {
    Utils.storage.set(AppConfig.storage.habits, this.data.habits);
    this.updateAnalytics();
  },

  checkStreaks() {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    this.data.habits.forEach(habit => {
      if (!habit.completedToday) {
        // Check if streak should be reset
        if (habit.lastCompleted !== today && habit.lastCompleted !== yesterday) {
          habit.streak = 0;
        }
      }
    });
  },

  updateAnalytics() {
    const analytics = Utils.storage.get(AppConfig.storage.analytics) || {};
    
    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toDateString();
      
      const allCompleted = this.data.habits.every(h => {
        return h.completedDates && h.completedDates.includes(dateStr);
      });
      
      if (allCompleted && this.data.habits.length > 0) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }

    analytics.currentStreak = currentStreak;
    analytics.longestStreak = Math.max(analytics.longestStreak || 0, currentStreak);
    
    Utils.storage.set(AppConfig.storage.analytics, analytics);
  },

  render() {
    this.renderHabitList();
    this.renderStats();
    this.renderStreakCalendar();
  },

  renderHabitList() {
    const container = document.getElementById('habit-list');
    if (!container) return;

    if (this.data.habits.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎯</div>
          <div class="empty-state-title">No habits yet</div>
          <div class="empty-state-description">Start building positive habits today!</div>
          <button class="btn btn-primary" onclick="Habits.openModal()">Create Habit</button>
        </div>
      `;
      return;
    }

    container.innerHTML = this.data.habits.map(habit => `
      <div class="habit-item" data-id="${habit.id}">
        <div class="habit-info">
          <div class="habit-name">${habit.name}</div>
          <div class="habit-meta">
            <span class="streak-badge">🔥 ${habit.streak || 0} day streak</span>
            ${habit.goal ? `<span class="goal-badge">Goal: ${habit.goal}</span>` : ''}
          </div>
        </div>
        <div class="habit-actions">
          <button class="btn btn-sm ${habit.completedToday ? 'btn-primary' : 'btn-secondary'}" 
                  onclick="Habits.toggleHabit('${habit.id}')">
            ${habit.completedToday ? '✓ Done' : 'Mark Done'}
          </button>
          <button class="btn btn-ghost btn-sm" onclick="Habits.editHabit('${habit.id}')">Edit</button>
          <button class="btn btn-ghost btn-sm" onclick="Habits.deleteHabit('${habit.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  },

  renderStats() {
    const totalHabits = this.data.habits.length;
    const completedToday = this.data.habits.filter(h => h.completedToday).length;
    const totalStreak = this.data.habits.reduce((sum, h) => sum + (h.streak || 0), 0);

    const stats = {
      'habit-total': totalHabits,
      'habit-completed': completedToday,
      'habit-streak': totalStreak
    };

    Object.entries(stats).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });

    // Update progress
    const progressEl = document.getElementById('habit-progress');
    if (progressEl && totalHabits > 0) {
      const percentage = (completedToday / totalHabits) * 100;
      progressEl.style.width = `${percentage}%`;
    }
  },

  renderStreakCalendar() {
    const container = document.getElementById('streak-calendar');
    if (!container) return;

    const weeks = 8;
    let html = '<div class="streak-calendar-grid">';

    // Generate calendar cells for past 8 weeks
    for (let w = 0; w < weeks; w++) {
      html += '<div class="streak-week">';
      for (let d = 0; d < 7; d++) {
        const date = new Date();
        date.setDate(date.getDate() - ((weeks - 1 - w) * 7 + (6 - d)));
        const dateStr = date.toDateString();
        
        // Check if all habits were completed on this date
        const allCompleted = this.data.habits.length > 0 && 
          this.data.habits.every(h => h.completedDates && h.completedDates.includes(dateStr));
        
        const level = allCompleted ? 5 : 0;
        const isToday = date.toDateString() === new Date().toDateString();
        
        html += `<div class="heatmap-cell level-${level} ${isToday ? 'today' : ''}" 
                      title="${date.toDateString()}: ${allCompleted ? 'All completed!' : 'Not completed'}"></div>`;
      }
      html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
  },

  setupEventListeners() {
    const addBtn = document.getElementById('add-habit-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openModal());
    }

    const closeBtn = document.getElementById('habit-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    const form = document.getElementById('habit-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveHabit();
      });
    }
  },

  openModal(habitId = null) {
    const form = document.getElementById('habit-form');
    
    if (habitId) {
      const habit = this.data.habits.find(h => h.id === habitId);
      if (habit) {
        document.getElementById('habit-name').value = habit.name;
        document.getElementById('habit-goal').value = habit.goal || '';
        document.getElementById('habit-frequency').value = habit.frequency || 'daily';
        form.dataset.habitId = habitId;
      }
    } else {
      form.reset();
      delete form.dataset.habitId;
    }

    Modal.open('habit-modal');
  },

  closeModal() {
    Modal.close('habit-modal');
  },

  saveHabit() {
    const form = document.getElementById('habit-form');
    const habitId = form.dataset.habitId;

    const habitData = {
      name: document.getElementById('habit-name').value.trim(),
      goal: document.getElementById('habit-goal').value.trim(),
      frequency: document.getElementById('habit-frequency').value,
      createdAt: new Date().toISOString()
    };

    if (!habitData.name) {
      Toast.show({ type: 'error', title: 'Error', message: 'Habit name is required!' });
      return;
    }

    if (habitId) {
      const index = this.data.habits.findIndex(h => h.id === habitId);
      if (index !== -1) {
        this.data.habits[index] = { ...this.data.habits[index], ...habitData };
      }
    } else {
      habitData.id = Utils.generateId();
      habitData.streak = 0;
      habitData.completedToday = false;
      habitData.completedDates = [];
      habitData.lastCompleted = null;
      this.data.habits.unshift(habitData);
    }

    this.saveData();
    this.closeModal();
    this.render();
    
    Toast.show({
      type: 'success',
      title: habitId ? 'Habit Updated!' : 'Habit Created!',
      message: habitData.name
    });
  },

  toggleHabit(habitId) {
    const habit = this.data.habits.find(h => h.id === habitId);
    if (!habit) return;

    const today = new Date().toDateString();

    if (habit.completedToday) {
      // Undo completion
      habit.completedToday = false;
      habit.completedDates = habit.completedDates.filter(d => d !== today);
      habit.streak = Math.max(0, (habit.streak || 1) - 1);
    } else {
      // Mark as complete
      habit.completedToday = true;
      habit.lastCompleted = today;
      if (!habit.completedDates) habit.completedDates = [];
      habit.completedDates.push(today);
      habit.streak = (habit.streak || 0) + 1;
      
      Confetti.burst(window.innerWidth / 2, window.innerHeight / 2);
      Toast.show({ type: 'success', title: 'Habit completed! 🎉', message: habit.name });
    }

    this.saveData();
    this.render();
  },

  editHabit(habitId) {
    this.openModal(habitId);
  },

  deleteHabit(habitId) {
    if (confirm('Are you sure you want to delete this habit?')) {
      this.data.habits = this.data.habits.filter(h => h.id !== habitId);
      this.saveData();
      this.render();
      Toast.show({ type: 'success', title: 'Habit deleted!' });
    }
  }
};

window.Habits = Habits;
