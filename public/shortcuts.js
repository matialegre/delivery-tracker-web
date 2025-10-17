// ⌨️ Sistema de Atajos de Teclado

class ShortcutManager {
  constructor() {
    this.shortcuts = new Map();
    this.init();
  }

  init() {
    document.addEventListener('keydown', (e) => {
      const key = this.getKeyString(e);
      const handler = this.shortcuts.get(key);
      
      if (handler && !this.isTyping(e)) {
        e.preventDefault();
        handler(e);
      }
    });

    // Atajos globales
    this.register('?', () => this.showHelp());
    this.register('Escape', () => this.closeModals());
    this.register('ctrl+k', () => this.focusSearch());
  }

  getKeyString(e) {
    const parts = [];
    if (e.ctrlKey) parts.push('ctrl');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey && e.key.length > 1) parts.push('shift');
    parts.push(e.key.toLowerCase());
    return parts.join('+');
  }

  isTyping(e) {
    const target = e.target;
    return target.tagName === 'INPUT' || 
           target.tagName === 'TEXTAREA' || 
           target.isContentEditable;
  }

  register(shortcut, handler) {
    this.shortcuts.set(shortcut, handler);
  }

  closeModals() {
    // Cerrar todos los modales abiertos
    document.querySelectorAll('[id*="Modal"], [id*="Window"], [id*="Overlay"]').forEach(el => {
      if (el.style.display !== 'none') {
        el.style.display = 'none';
      }
    });
  }

  focusSearch() {
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="busca"]');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  showHelp() {
    const helpModal = document.createElement('div');
    helpModal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #fff;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      z-index: 100000;
      max-width: 500px;
      animation: fadeIn 0.3s;
    `;

    helpModal.innerHTML = `
      <h2 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 800;">⌨️ Atajos de Teclado</h2>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; justify-content: space-between; padding: 12px; background: #f9fafb; border-radius: 8px;">
          <span><kbd style="background: #fff; padding: 4px 8px; border-radius: 4px; font-family: monospace;">?</kbd></span>
          <span>Mostrar esta ayuda</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 12px; background: #f9fafb; border-radius: 8px;">
          <span><kbd style="background: #fff; padding: 4px 8px; border-radius: 4px; font-family: monospace;">Esc</kbd></span>
          <span>Cerrar modales</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 12px; background: #f9fafb; border-radius: 8px;">
          <span><kbd style="background: #fff; padding: 4px 8px; border-radius: 4px; font-family: monospace;">Ctrl+K</kbd></span>
          <span>Buscar</span>
        </div>
      </div>
      <button onclick="this.parentElement.remove()" style="margin-top: 24px; width: 100%; padding: 12px; background: #000; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
        Cerrar
      </button>
    `;

    // Overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 99999;
      animation: fadeIn 0.3s;
    `;
    overlay.onclick = () => {
      helpModal.remove();
      overlay.remove();
    };

    document.body.appendChild(overlay);
    document.body.appendChild(helpModal);
  }
}

// Instancia global
window.shortcuts = new ShortcutManager();

// Agregar animación fadeIn
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;
document.head.appendChild(style);
