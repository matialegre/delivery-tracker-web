// 🎬 Sistema de Loading Premium

class LoadingManager {
  constructor() {
    this.createLoader();
  }

  createLoader() {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      background: rgba(0,0,0,0.8);
      backdrop-filter: blur(10px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      flex-direction: column;
      gap: 20px;
    `;

    overlay.innerHTML = `
      <div style="position: relative; width: 80px; height: 80px;">
        <div class="spinner-ring"></div>
        <div class="spinner-ring" style="animation-delay: -0.5s;"></div>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 32px;">
          🚕
        </div>
      </div>
      <div id="loading-text" style="color: #fff; font-size: 18px; font-weight: 600;"></div>
      <div id="loading-subtext" style="color: rgba(255,255,255,0.7); font-size: 14px;"></div>
    `;

    // Agregar estilos de animación
    const style = document.createElement('style');
    style.textContent = `
      .spinner-ring {
        position: absolute;
        width: 100%;
        height: 100%;
        border: 4px solid transparent;
        border-top-color: #10b981;
        border-radius: 50%;
        animation: spin 1.5s cubic-bezier(0.5, 0, 0.5, 1) infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    this.overlay = overlay;
    this.textEl = overlay.querySelector('#loading-text');
    this.subtextEl = overlay.querySelector('#loading-subtext');
    document.body.appendChild(overlay);
  }

  show(text = 'Cargando...', subtext = '') {
    this.textEl.textContent = text;
    this.subtextEl.textContent = subtext;
    this.overlay.style.display = 'flex';
  }

  hide() {
    this.overlay.style.opacity = '0';
    this.overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => {
      this.overlay.style.display = 'none';
      this.overlay.style.opacity = '1';
    }, 300);
  }

  update(text, subtext = '') {
    this.textEl.textContent = text;
    this.subtextEl.textContent = subtext;
  }
}

// Instancia global
window.loading = new LoadingManager();
