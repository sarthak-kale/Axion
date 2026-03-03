/**
 * AXION PRO MAX - Settings Module
 * Anti-Gravity Productivity Suite
 * Version: 1.0.0
 */

const Settings = {
  data: {
    settings: {}
  },

  init() {
    this.loadSettings();
    this.render();
    this.setupEventListeners();
  },

  loadSettings() {
    this.data.settings = Utils.storage.get(AppConfig.storage.settings) || this.getDefaultSettings();
  },

  getDefaultSettings() {
    return {
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      autoStartBreak: false,
      autoStartFocus: false,
      notifications: true,
      soundEffects: true,
      darkMode: true,
      compactView: false,
      showProductivityScore: true,
      weeklyGoal: 100,
      theme: 'dark'
    };
  },

  saveSettings() {
    Utils.storage.set(AppConfig.storage.settings, this.data.settings);
  },

  render() {
    this.renderGeneralSettings();
    this.renderFocusSettings();
    this.renderAppearanceSettings();
    this.renderDataSettings();
  },

  renderGeneralSettings() {
    const container = document.getElementById('settings-general');
    if (!container) return;

    container.innerHTML = `
      <div class="settings-group">
        <h4>Notifications</h4>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Enable Notifications</div>
            <div class="setting-description">Get reminders for tasks and habits</div>
          </div>
          <div class="toggle ${this.data.settings.notifications ? 'active' : ''}" 
               onclick="Settings.toggleSetting('notifications')"></div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Sound Effects</div>
            <div class="setting-description">Play sounds for completed tasks</div>
          </div>
          <div class="toggle ${this.data.settings.soundEffects ? 'active' : ''}" 
               onclick="Settings.toggleSetting('soundEffects')"></div>
        </div>
      </div>

      <div class="settings-group">
        <h4>Goals</h4>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Weekly Productivity Goal</div>
            <div class="setting-description">Target productivity score per week</div>
          </div>
          <input type="number" class="form-input" style="width: 80px" 
                 value="${this.data.settings.weeklyGoal}"
                 onchange="Settings.updateSetting('weeklyGoal', parseInt(this.value))">
        </div>
      </div>
    `;
  },

  renderFocusSettings() {
    const container = document.getElementById('settings-focus');
    if (!container) return;

    container.innerHTML = `
      <div class="settings-group">
        <h4>Focus Timer</h4>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Focus Duration</div>
            <div class="setting-description">Length of focus sessions (minutes)</div>
          </div>
          <input type="number" class="form-input" style="width: 80px" 
                 value="${this.data.settings.focusDuration}"
                 min="1" max="120"
                 onchange="Settings.updateSetting('focusDuration', parseInt(this.value))">
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Short Break</div>
            <div class="setting-description">Short break duration (minutes)</div>
          </div>
          <input type="number" class="form-input" style="width: 80px" 
                 value="${this.data.settings.shortBreakDuration}"
                 min="1" max="30"
                 onchange="Settings.updateSetting('shortBreakDuration', parseInt(this.value))">
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Long Break</div>
            <div class="setting-description">Long break duration (minutes)</div>
          </div>
          <input type="number" class="form-input" style="width: 80px" 
                 value="${this.data.settings.longBreakDuration}"
                 min="1" max="60"
                 onchange="Settings.updateSetting('longBreakDuration', parseInt(this.value))">
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Auto-start Breaks</div>
            <div class="setting-description">Automatically start break after focus</div>
          </div>
          <div class="toggle ${this.data.settings.autoStartBreak ? 'active' : ''}" 
               onclick="Settings.toggleSetting('autoStartBreak')"></div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Auto-start Focus</div>
            <div class="setting-description">Automatically start focus after break</div>
          </div>
          <div class="toggle ${this.data.settings.autoStartFocus ? 'active' : ''}" 
               onclick="Settings.toggleSetting('autoStartFocus')"></div>
        </div>
      </div>
    `;
  },

  renderAppearanceSettings() {
    const container = document.getElementById('settings-appearance');
    if (!container) return;

    container.innerHTML = `
      <div class="settings-group">
        <h4>Display</h4>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Dark Mode</div>
            <div class="setting-description">Use dark theme</div>
          </div>
          <div class="toggle ${this.data.settings.darkMode ? 'active' : ''}" 
               onclick="Settings.toggleSetting('darkMode')"></div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Compact View</div>
            <div class="setting-description">Show more content with less spacing</div>
          </div>
          <div class="toggle ${this.data.settings.compactView ? 'active' : ''}" 
               onclick="Settings.toggleSetting('compactView')"></div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Show Productivity Score</div>
            <div class="setting-description">Display score on dashboard</div>
          </div>
          <div class="toggle ${this.data.settings.showProductivityScore ? 'active' : ''}" 
               onclick="Settings.toggleSetting('showProductivityScore')"></div>
        </div>
      </div>
    `;
  },

  renderDataSettings() {
    const container = document.getElementById('settings-data');
    if (!container) return;

    container.innerHTML = `
      <div class="settings-group">
        <h4>Data Management</h4>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Export Data</div>
            <div class="setting-description">Download all your data</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="Settings.exportData()">Export</button>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Import Data</div>
            <div class="setting-description">Restore from backup</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="Settings.importData()">Import</button>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Clear All Data</div>
            <div class="setting-description">Permanently delete all data</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="Settings.clearAllData()">Clear</button>
        </div>
      </div>

      <div class="settings-group">
        <h4>About</h4>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Version</div>
          </div>
          <span class="badge badge-primary">${AppConfig.version}</span>
        </div>
      </div>
    `;
  },

  setupEventListeners() {
    // Reset settings button
    const resetBtn = document.getElementById('reset-settings');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetSettings());
    }

    // Import file input
    const importInput = document.getElementById('import-file');
    if (importInput) {
      importInput.addEventListener('change', (e) => this.handleImport(e));
    }
  },

  toggleSetting(key) {
    this.data.settings[key] = !this.data.settings[key];
    this.saveSettings();
    this.render();
    Toast.show({ type: 'success', title: 'Setting updated!' });
  },

  updateSetting(key, value) {
    this.data.settings[key] = value;
    this.saveSettings();
    Toast.show({ type: 'success', title: 'Setting saved!' });
  },

  resetSettings() {
    if (confirm('Reset all settings to defaults?')) {
      this.data.settings = this.getDefaultSettings();
      this.saveSettings();
      this.render();
      Toast.show({ type: 'success', title: 'Settings reset!' });
    }
  },

  exportData() {
    const data = {
      settings: this.data.settings,
      tasks: Utils.storage.get(AppConfig.storage.tasks) || [],
      habits: Utils.storage.get(AppConfig.storage.habits) || [],
      notes: Utils.storage.get(AppConfig.storage.notes) || [],
      analytics: Utils.storage.get(AppConfig.storage.analytics) || [],
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `axion-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    Toast.show({ type: 'success', title: 'Data exported!' });
  },

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => this.handleImport(e);
    input.click();
  },

  handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        if (confirm('This will replace all existing data. Continue?')) {
          if (data.settings) Utils.storage.set(AppConfig.storage.settings, data.settings);
          if (data.tasks) Utils.storage.set(AppConfig.storage.tasks, data.tasks);
          if (data.habits) Utils.storage.set(AppConfig.storage.habits, data.habits);
          if (data.notes) Utils.storage.set(AppConfig.storage.notes, data.notes);
          if (data.analytics) Utils.storage.set(AppConfig.storage.analytics, data.analytics);
          
          this.loadSettings();
          this.render();
          Toast.show({ type: 'success', title: 'Data imported!' });
        }
      } catch (err) {
        Toast.show({ type: 'error', title: 'Import failed!', message: 'Invalid file format' });
      }
    };
    reader.readAsText(file);
  },

  clearAllData() {
    if (confirm('This will permanently delete ALL your data. This cannot be undone. Are you sure?')) {
      if (confirm('Are you REALLY sure? All tasks, habits, notes, and analytics will be lost forever!')) {
        localStorage.clear();
        Toast.show({ type: 'success', title: 'All data cleared!' });
        setTimeout(() => window.location.reload(), 1000);
      }
    }
  }
};

window.Settings = Settings;
