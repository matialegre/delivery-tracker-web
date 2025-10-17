// 🌓 Sistema de Tema Oscuro/Claro Automático

class ThemeManager {
  constructor() {
    this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
    this.applyTheme(this.currentTheme);
    this.createToggle();
    this.watchSystemTheme();
  }

  getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  getStoredTheme() {
    return localStorage.getItem('theme');
  }

  setStoredTheme(theme) {
    localStorage.setItem('theme', theme);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    this.setStoredTheme(theme);
    this.updateToggleIcon();
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
  }

  createToggle() {
    const toggle = document.createElement('button');
    toggle.id = 'theme-toggle';
    toggle.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      z-index: 9999;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    toggle.onmouseover = () => {
      toggle.style.transform = 'scale(1.1)';
      toggle.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
    };
    
    toggle.onmouseout = () => {
      toggle.style.transform = 'scale(1)';
      toggle.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
    };
    
    toggle.onclick = () => {
      this.toggleTheme();
      toggle.style.transform = 'scale(0.9)';
      setTimeout(() => toggle.style.transform = 'scale(1)', 100);
    };
    
    this.toggleButton = toggle;
    document.body.appendChild(toggle);
    this.updateToggleIcon();
  }

  updateToggleIcon() {
    if (this.toggleButton) {
      this.toggleButton.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
    }
  }

  watchSystemTheme() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!this.getStoredTheme()) {
        this.applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}

// CSS Variables para tema
const themeStyles = document.createElement('style');
themeStyles.textContent = `
  :root[data-theme="light"] {
    --bg-primary: #ffffff;
    --bg-secondary: #f9fafb;
    --text-primary: #000000;
    --text-secondary: #666666;
    --border-color: #e5e7eb;
    --shadow-color: rgba(0,0,0,0.1);
  }

  :root[data-theme="dark"] {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --text-primary: #ffffff;
    --text-secondary: #a0a0a0;
    --border-color: #404040;
    --shadow-color: rgba(255,255,255,0.1);
  }

  body {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    transition: background-color 0.3s, color 0.3s;
  }

  .card, .panel {
    background-color: var(--bg-primary);
    border-color: var(--border-color);
    box-shadow: 0 4px 12px var(--shadow-color);
  }

  input, textarea, select {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    border-color: var(--border-color);
  }
`;
document.head.appendChild(themeStyles);

// Instancia global
window.themeManager = new ThemeManager();
