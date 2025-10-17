// 🍞 Sistema de Toast Notifications Profesional

class ToastManager {
  constructor() {
    this.container = this.createContainer();
    document.body.appendChild(this.container);
  }

  createContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    `;
    return container;
  }

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const colors = {
      success: { bg: '#10b981', shadow: 'rgba(16, 185, 129, 0.3)' },
      error: { bg: '#ef4444', shadow: 'rgba(239, 68, 68, 0.3)' },
      warning: { bg: '#f59e0b', shadow: 'rgba(245, 158, 11, 0.3)' },
      info: { bg: '#3b82f6', shadow: 'rgba(59, 130, 246, 0.3)' }
    };

    const color = colors[type] || colors.info;

    toast.style.cssText = `
      background: ${color.bg};
      color: #fff;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 24px ${color.shadow};
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
      font-size: 14px;
      min-width: 300px;
      max-width: 400px;
      pointer-events: auto;
      animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      transform-origin: right center;
    `;

    toast.innerHTML = `
      <span style="font-size: 20px;">${icons[type] || icons.info}</span>
      <span style="flex: 1;">${message}</span>
      <button onclick="this.parentElement.remove()" style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; opacity: 0.8; transition: opacity 0.2s;">×</button>
    `;

    // Agregar estilo de animación si no existe
    if (!document.getElementById('toast-animations')) {
      const style = document.createElement('style');
      style.id = 'toast-animations';
      style.textContent = `
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOutRight {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(100px); }
        }
      `;
      document.head.appendChild(style);
    }

    this.container.appendChild(toast);

    // Auto-remover
    if (duration > 0) {
      setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => toast.remove(), 400);
      }, duration);
    }

    return toast;
  }

  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

// Instancia global
window.toast = new ToastManager();
