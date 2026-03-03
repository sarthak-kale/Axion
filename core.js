/**
 * AXION PRO MAX - Core Application Logic
 * Anti-Gravity Productivity Suite
 * Version: 1.0.0
 */

// =====================================================
// APP STATE & CONFIGURATION
// =====================================================

const AppConfig = {
  appName: 'AXION PRO MAX',
  version: '1.0.0',
  storage: {
    tasks: 'axion_tasks',
    habits: 'axion_habits',
    notes: 'axion_notes',
    settings: 'axion_settings',
    analytics: 'axion_analytics',
    onboarding: 'axion_onboarding_complete'
  },
  defaults: {
    focusDuration: 25 * 60 * 1000, // 25 minutes
    shortBreak: 5 * 60 * 1000,
    longBreak: 15 * 60 * 1000
  }
};

const AppState = {
  currentPage: 'dashboard',
  sidebarCollapsed: false,
  isOnline: navigator.onLine,
  installPrompt: null,
  focusModeActive: false,
  currentFocusTask: null,
  focusTimer: null,
  focusTimeRemaining: AppConfig.defaults.focusDuration
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

const Utils = {
  // Debounce function for search inputs
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function for scroll events
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Format date
  formatDate(date, format = 'short') {
    const d = new Date(date);
    const options = format === 'short' 
      ? { month: 'short', day: 'numeric' }
      : { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  },

  // Format time
  formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  },

  // Get time of day greeting
  getTimeGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  },

  // LocalStorage helpers with error handling
  storage: {
    get(key) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        console.error('Storage get error:', e);
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error('Storage set error:', e);
        return false;
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (e) {
        console.error('Storage remove error:', e);
        return false;
      }
    }
  },

  // Animate element
  animate(element, animationClass) {
    element.classList.add(animationClass);
    setTimeout(() => element.classList.remove(animationClass), 600);
  },

  // RequestAnimationFrame wrapper for smooth animations
  smoothAnimation(callback) {
    let running = false;
    return function(...args) {
      if (!running) {
        running = true;
        requestAnimationFrame(() => {
          callback.apply(this, args);
          running = false;
        });
      }
    };
  }
};

// =====================================================
// PWA SERVICE WORKER REGISTRATION
// =====================================================

const ServiceWorkerManager = {
  async register() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('SW registered:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateToast();
            }
          });
        });
        
        return registration;
      } catch (error) {
        console.error('SW registration failed:', error);
        return null;
      }
    }
    return null;
  },

  showUpdateToast() {
    Toast.show({
      type: 'info',
      title: 'Update Available',
      message: 'Refresh to get the latest version!'
    });
  }
};

// =====================================================
// PWA INSTALL BANNER
// =====================================================

const InstallBanner = {
  init() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      AppState.installPrompt = e;
      this.show();
    });

    // Check if already installed
    window.addEventListener('appinstalled', () => {
      AppState.installPrompt = null;
      this.hide();
    });
  },

  show() {
    // Only show once per session
    if (sessionStorage.getItem('installBannerShown')) return;
    
    const banner = document.getElementById('install-banner');
    if (banner) {
      banner.classList.add('active');
      sessionStorage.setItem('installBannerShown', 'true');
    }
  },

  hide() {
    const banner = document.getElementById('install-banner');
    if (banner) {
      banner.classList.remove('active');
    }
  },

  async install() {
    if (!AppState.installPrompt) return;
    
    const prompt = AppState.installPrompt;
    prompt.prompt();
    
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      console.log('App installed');
    }
    this.hide();
  }
};

// =====================================================
// TOAST NOTIFICATIONS
// =====================================================

const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show({ type = 'info', title, message, duration = 4000 }) {
    if (!this.container) this.init();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">
        ${this.getIcon(type)}
      </div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    `;

    this.container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.3s ease-out reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  getIcon(type) {
    const icons = {
      success: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    return icons[type] || icons.info;
  }
};

// =====================================================
// MODAL SYSTEM
// =====================================================

const Modal = {
  open(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  close(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  closeAll() {
    document.querySelectorAll('.modal-overlay.active').forEach(modal => {
      modal.classList.remove('active');
    });
    document.body.style.overflow = '';
  }
};

// =====================================================
// DROPDOWN MENUS
// =====================================================

const Dropdown = {
  init() {
    document.addEventListener('click', (e) => {
      const toggle = e.target.closest('.dropdown-toggle');
      if (toggle) {
        const dropdown = toggle.closest('.dropdown');
        this.toggle(dropdown);
      } else {
        this.closeAll();
      }
    });
  },

  toggle(dropdown) {
    const wasActive = dropdown.classList.contains('active');
    this.closeAll();
    if (!wasActive) {
      dropdown.classList.add('active');
    }
  },

  closeAll() {
    document.querySelectorAll('.dropdown.active').forEach(d => d.classList.remove('active'));
  }
};

// =====================================================
// CONFETTI EFFECT
// =====================================================

const Confetti = {
  colors: ['#7c3aed', '#06b6d4', '#f472b6', '#10b981', '#f59e0b'],
  
  burst(x, y, count = 50) {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    container.style.left = x + 'px';
    container.style.top = y + 'px';
    document.body.appendChild(container);

    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.backgroundColor = this.colors[Math.floor(Math.random() * this.colors.length)];
      piece.style.left = (Math.random() - 0.5) * 200 + 'px';
      piece.style.animationDelay = Math.random() * 0.2 + 's';
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      container.appendChild(piece);
    }

    setTimeout(() => container.remove(), 1500);
  }
};

// =====================================================
// SIDEBAR
// =====================================================

const Sidebar = {
  init() {
    const toggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        AppState.sidebarCollapsed = sidebar.classList.contains('collapsed');
      });
    }

    // Set active nav item based on current page
    this.setActiveNavItem();
  },

  setActiveNavItem() {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    document.querySelectorAll('.nav-item').forEach(item => {
      const href = item.getAttribute('href');
      if (href && href.includes(currentPage)) {
        item.classList.add('active');
      }
    });
  }
};

// =====================================================
// HEADER & SEARCH
// =====================================================

const Header = {
  init() {
    const searchInput = document.querySelector('.header-search input');
    if (searchInput) {
      const debouncedSearch = Utils.debounce((query) => {
        console.log('Searching for:', query);
        // Implement search logic
      }, 300);
      
      searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
      });
    }
  }
};

// =====================================================
// KEYBOARD SHORTCUTS
// =====================================================

const KeyboardShortcuts = {
  init() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // N - New task
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        Modal.open('task-modal');
      }

      // F - Focus mode
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        window.location.href = 'focus.html';
      }

      // / - Search
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('.header-search input');
        if (searchInput) searchInput.focus();
      }

      // Escape - Exit focus mode
      if (e.key === 'Escape') {
        if (AppState.focusModeActive) {
          FocusMode.exit();
        } else {
          Modal.closeAll();
        }
      }

      // Delete - Delete selected task
      if (e.key === 'Delete') {
        const selectedTask = document.querySelector('.task-item.selected');
        if (selectedTask) {
          selectedTask.remove();
          Toast.show({
            type: 'success',
            title: 'Task Deleted'
          });
        }
      }
    });
  }
};

// =====================================================
// ONLINE/OFFLINE DETECTION
// =====================================================

const NetworkStatus = {
  init() {
    window.addEventListener('online', () => {
      AppState.isOnline = true;
      Toast.show({
        type: 'success',
        title: 'Back Online',
        message: 'Your changes will be synced.'
      });
    });

    window.addEventListener('offline', () => {
      AppState.isOnline = false;
      Toast.show({
        type: 'warning',
        title: 'Offline Mode',
        message: 'Changes will be saved locally.'
      });
    });
  }
};

// =====================================================
// SMOOTH SCROLL
// =====================================================

const SmoothScroll = {
  init() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }
};

// =====================================================
// RIPPLE EFFECT
// =====================================================

const RippleEffect = {
  init() {
    document.addEventListener('click', (e) => {
      const button = e.target.closest('.ripple-effect');
      if (button) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        button.appendChild(ripple);
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
        ripple.style.top = e.clientY - rect.top - size / 2 + 'px';
        
        setTimeout(() => ripple.remove(), 600);
      }
    });
  }
};

// =====================================================
// SPLASH SCREEN
// =====================================================

const SplashScreen = {
  init() {
    const splash = document.querySelector('.splash-screen');
    if (splash) {
      setTimeout(() => {
        splash.classList.add('hidden');
        // Trigger page animations after splash
        this.triggerPageAnimations();
      }, 2500);
    }
  },

  triggerPageAnimations() {
    document.querySelectorAll('.slide-up, .fade-in, .blur-reveal').forEach((el, index) => {
      el.style.animationDelay = `${index * 0.1}s`;
      el.classList.add('animate-in');
    });
  }
};

// =====================================================
// ONBOARDING
// =====================================================

const Onboarding = {
  init() {
    const hasSeenOnboarding = Utils.storage.get(AppConfig.storage.onboarding);
    if (!hasSeenOnboarding) {
      setTimeout(() => this.showTooltip(), 3000);
    }
  },

  showTooltip() {
    const tooltip = document.createElement('div');
    tooltip.className = 'onboarding-tooltip';
    tooltip.innerHTML = `
      <div class="onboarding-header">
        <div class="onboarding-icon">🚀</div>
        <div class="onboarding-title">Welcome to AXION PRO MAX!</div>
      </div>
      <div class="onboarding-content">
        Press <strong>N</strong> to create a new task, <strong>F</strong> for Focus Mode, 
        and <strong>/</strong> to search. Try it now!
      </div>
      <div class="onboarding-actions">
        <button class="btn btn-primary btn-sm" onclick="this.closest('.onboarding-tooltip').remove(); Onboarding.complete()">
          Got it!
        </button>
      </div>
    `;
    
    // Position tooltip
    tooltip.style.top = '50%';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translate(-50%, -50%)';
    
    document.body.appendChild(tooltip);
  },

  complete() {
    Utils.storage.set(AppConfig.storage.onboarding, true);
    Toast.show({
      type: 'success',
      title: 'Welcome aboard! 🚀',
      message: 'You\'re ready to boost your productivity!'
    });
  }
};

// =====================================================
// APP INITIALIZATION
// =====================================================

const App = {
  async init() {
    console.log('AXION PRO MAX initializing...');
    
    // Initialize all modules
    Toast.init();
    Dropdown.init();
    Sidebar.init();
    Header.init();
    KeyboardShortcuts.init();
    NetworkStatus.init();
    SmoothScroll.init();
    RippleEffect.init();
    InstallBanner.init();
    SplashScreen.init();
    Onboarding.init();
    
    // Register service worker
    await ServiceWorkerManager.register();
    
    // Initialize page-specific logic
    this.initPageSpecific();
    
    console.log('AXION PRO MAX ready!');
    
    // Dispatch ready event
    document.dispatchEvent(new Event('appReady'));
  },

  initPageSpecific() {
    const page = document.body.dataset.page;
    switch (page) {
      case 'dashboard':
        if (typeof Dashboard !== 'undefined') Dashboard.init();
        break;
      case 'tasks':
        if (typeof Tasks !== 'undefined') Tasks.init();
        break;
      case 'calendar':
        if (typeof CalendarApp !== 'undefined') CalendarApp.init();
        break;
      case 'habits':
        if (typeof Habits !== 'undefined') Habits.init();
        break;
      case 'focus':
        if (typeof FocusMode !== 'undefined') FocusMode.init();
        break;
      case 'notes':
        if (typeof Notes !== 'undefined') Notes.init();
        break;
      case 'analytics':
        if (typeof Analytics !== 'undefined') Analytics.init();
        break;
      case 'settings':
        if (typeof Settings !== 'undefined') Settings.init();
        break;
    }
  }
};

// =====================================================
// FOCUS MODE
// =====================================================

const FocusMode = {
  init() {
    this.container = document.getElementById('focus-mode');
    this.timerDisplay = document.querySelector('.focus-timer');
    this.taskDisplay = document.querySelector('.focus-task');
    this.startBtn = document.querySelector('.focus-start');
    this.pauseBtn = document.querySelector('.focus-pause');
    this.resetBtn = document.querySelector('.focus-reset');
    this.exitBtn = document.querySelector('.focus-exit');

    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => this.start());
    }
    if (this.pauseBtn) {
      this.pauseBtn.addEventListener('click', () => this.pause());
    }
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => this.reset());
    }
    if (this.exitBtn) {
      this.exitBtn.addEventListener('click', () => this.exit());
    }

    // Load saved task
    const savedTask = Utils.storage.get('currentFocusTask');
    if (savedTask) {
      AppState.currentFocusTask = savedTask;
      this.updateTaskDisplay();
    }

    this.updateTimerDisplay();
  },

  start() {
    if (AppState.focusTimer) return;
    
    AppState.focusModeActive = true;
    AppState.focusTimer = setInterval(() => {
      AppState.focusTimeRemaining -= 1000;
      this.updateTimerDisplay();
      
      if (AppState.focusTimeRemaining <= 0) {
        this.complete();
      }
    }, 1000);

    this.startBtn?.classList.add('hidden');
    this.pauseBtn?.classList.remove('hidden');
  },

  pause() {
    clearInterval(AppState.focusTimer);
    AppState.focusTimer = null;
    
    this.pauseBtn?.classList.add('hidden');
    this.startBtn?.classList.remove('hidden');
  },

  reset() {
    this.pause();
    AppState.focusTimeRemaining = AppConfig.defaults.focusDuration;
    this.updateTimerDisplay();
  },

  complete() {
    this.pause();
    AppState.focusTimeRemaining = AppConfig.defaults.focusDuration;
    this.updateTimerDisplay();
    
    // Record completion
    const analytics = Utils.storage.get(AppConfig.storage.analytics) || { focusSessions: 0, totalFocusTime: 0 };
    analytics.focusSessions++;
    analytics.totalFocusTime += AppConfig.defaults.focusDuration;
    Utils.storage.set(AppConfig.storage.analytics, analytics);
    
    Toast.show({
      type: 'success',
      title: 'Focus Session Complete! 🎉',
      message: 'Great work! Take a break.'
    });
    
    Confetti.burst(window.innerWidth / 2, window.innerHeight / 2);
  },

  exit() {
    this.pause();
    window.location.href = 'dashboard.html';
  },

  updateTimerDisplay() {
    if (this.timerDisplay) {
      this.timerDisplay.textContent = Utils.formatTime(AppState.focusTimeRemaining);
    }
  },

  updateTaskDisplay() {
    if (this.taskDisplay && AppState.currentFocusTask) {
      this.taskDisplay.textContent = AppState.currentFocusTask;
    }
  },

  setTask(task) {
    AppState.currentFocusTask = task;
    Utils.storage.set('currentFocusTask', task);
    this.updateTaskDisplay();
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
