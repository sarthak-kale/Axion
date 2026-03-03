/**
 * AXION PRO MAX - Focus Mode Module
 * Anti-Gravity Productivity Suite
 * Version: 1.0.0
 */

const FocusMode = {
  data: {
    duration: 25 * 60 * 1000, // 25 minutes default
    timeRemaining: 25 * 60 * 1000,
    isRunning: false,
    isPaused: false,
    currentTask: null,
    sessionCount: 0,
    timer: null
  },

  init() {
    this.loadState();
    this.render();
    this.setupEventListeners();
    this.enterFullscreen();
  },

  loadState() {
    const saved = Utils.storage.get('focusModeState');
    if (saved) {
      this.data = { ...this.data, ...saved };
    }
  },

  saveState() {
    Utils.storage.set('focusModeState', this.data);
  },

  render() {
    this.updateTimerDisplay();
    this.updateTaskDisplay();
    this.updateControls();
    this.updateSessionCount();
  },

  updateTimerDisplay() {
    const timerEl = document.getElementById('focus-timer');
    if (timerEl) {
      timerEl.textContent = Utils.formatTime(this.data.timeRemaining);
    }
    
    // Update progress circle
    const progress = document.getElementById('focus-progress');
    if (progress) {
      const percentage = this.data.timeRemaining / this.data.duration;
      const circumference = 2 * Math.PI * 140;
      const offset = circumference - (percentage * circumference);
      progress.style.strokeDashoffset = offset;
    }
  },

  updateTaskDisplay() {
    const taskEl = document.getElementById('focus-task-name');
    if (taskEl) {
      taskEl.textContent = this.data.currentTask || 'No task selected';
    }
  },

  updateControls() {
    const startBtn = document.getElementById('focus-start-btn');
    const pauseBtn = document.getElementById('focus-pause-btn');
    const resetBtn = document.getElementById('focus-reset-btn');

    if (this.data.isRunning && !this.data.isPaused) {
      if (startBtn) startBtn.classList.add('hidden');
      if (pauseBtn) pauseBtn.classList.remove('hidden');
    } else if (this.data.isPaused) {
      if (startBtn) startBtn.classList.remove('hidden');
      if (pauseBtn) pauseBtn.classList.add('hidden');
    } else {
      if (startBtn) startBtn.classList.remove('hidden');
      if (pauseBtn) pauseBtn.classList.add('hidden');
    }
  },

  updateSessionCount() {
    const countEl = document.getElementById('session-count');
    if (countEl) {
      countEl.textContent = this.data.sessionCount;
    }
  },

  setupEventListeners() {
    const startBtn = document.getElementById('focus-start-btn');
    const pauseBtn = document.getElementById('focus-pause-btn');
    const resetBtn = document.getElementById('focus-reset-btn');
    const exitBtn = document.getElementById('focus-exit-btn');
    const taskSelectBtn = document.getElementById('select-task-btn');

    if (startBtn) startBtn.addEventListener('click', () => this.start());
    if (pauseBtn) pauseBtn.addEventListener('click', () => this.pause());
    if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
    if (exitBtn) exitBtn.addEventListener('click', () => this.exit());
    if (taskSelectBtn) taskSelectBtn.addEventListener('click', () => this.showTaskSelector());

    // Duration presets
    document.querySelectorAll('.duration-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const minutes = parseInt(btn.dataset.minutes);
        this.setDuration(minutes * 60 * 1000);
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        if (this.data.isRunning && !this.data.isPaused) {
          this.pause();
        } else {
          this.start();
        }
      }
      if (e.key === 'Escape') {
        this.exit();
      }
    });
  },

  enterFullscreen() {
    const container = document.getElementById('focus-container');
    if (container && document.documentElement.requestFullscreen) {
      // Don't auto-fullscreen, just make it immersive
      container.classList.add('focus-fullscreen');
    }
  },

  setDuration(duration) {
    this.data.duration = duration;
    this.data.timeRemaining = duration;
    this.saveState();
    this.render();
    Toast.show({ type: 'info', title: 'Duration updated', message: Utils.formatTime(duration) });
  },

  start() {
    if (this.data.isRunning && !this.data.isPaused) return;

    this.data.isRunning = true;
    this.data.isPaused = false;
    AppState.focusModeActive = true;

    this.data.timer = setInterval(() => {
      this.data.timeRemaining -= 1000;
      this.updateTimerDisplay();

      if (this.data.timeRemaining <= 0) {
        this.complete();
      }
    }, 1000);

    this.saveState();
    this.updateControls();
  },

  pause() {
    if (!this.data.isRunning) return;

    clearInterval(this.data.timer);
    this.data.timer = null;
    this.data.isPaused = true;
    AppState.focusModeActive = false;

    this.saveState();
    this.updateControls();
    
    Toast.show({ type: 'info', title: 'Focus paused' });
  },

  reset() {
    this.pause();
    this.data.isRunning = false;
    this.data.timeRemaining = this.data.duration;
    
    this.saveState();
    this.updateTimerDisplay();
    this.updateControls();
  },

  complete() {
    this.pause();
    this.data.isRunning = false;
    this.data.sessionCount++;
    this.data.timeRemaining = this.data.duration;

    // Save analytics
    const analytics = Utils.storage.get(AppConfig.storage.analytics) || {};
    analytics.focusSessions = (analytics.focusSessions || 0) + 1;
    analytics.totalFocusTime = (analytics.totalFocusTime || 0) + this.data.duration;
    Utils.storage.set(AppConfig.storage.analytics, analytics);

    // Mark task as complete if there's a current task
    if (this.data.currentTask) {
      const tasks = Utils.storage.get(AppConfig.storage.tasks) || [];
      const task = tasks.find(t => t.id === this.data.currentTaskId);
      if (task) {
        task.completed = true;
        Utils.storage.set(AppConfig.storage.tasks, tasks);
      }
    }

    this.saveState();
    this.updateTimerDisplay();
    this.updateSessionCount();
    this.updateControls();

    // Show celebration
    Confetti.burst(window.innerWidth / 2, window.innerHeight / 2, 100);
    
    Toast.show({
      type: 'success',
      title: 'Focus Session Complete! 🎉',
      message: 'Great work! Take a well-deserved break.'
    });
  },

  exit() {
    if (this.data.isRunning) {
      this.pause();
    }
    
    if (confirm('Exit Focus Mode?')) {
      const container = document.getElementById('focus-container');
      if (container) {
        container.classList.remove('focus-fullscreen');
      }
      window.location.href = 'dashboard.html';
    }
  },

  setTask(taskId, taskTitle) {
    this.data.currentTask = taskTitle;
    this.data.currentTaskId = taskId;
    this.saveState();
    this.updateTaskDisplay();
    Modal.close('task-selector-modal');
  },

  showTaskSelector() {
    const tasks = Utils.storage.get(AppConfig.storage.tasks) || [];
    const activeTasks = tasks.filter(t => !t.completed);

    const container = document.getElementById('task-selector-list');
    if (container) {
      if (activeTasks.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No active tasks</p>';
      } else {
        container.innerHTML = activeTasks.map(task => `
          <div class="task-selector-item" onclick="FocusMode.setTask('${task.id}', '${task.title}')">
            <div class="task-title">${task.title}</div>
            ${task.priority ? `<span class="badge badge-${task.priority}">${task.priority}</span>` : ''}
          </div>
        `).join('');
      }
    }

    Modal.open('task-selector-modal');
  }
};

window.FocusMode = FocusMode;
