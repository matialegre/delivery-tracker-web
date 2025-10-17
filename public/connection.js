// 🌐 Indicador de Estado de Conexión

class ConnectionIndicator {
  constructor() {
    this.online = navigator.onLine;
    this.socketConnected = false;
    this.createIndicator();
    this.attachListeners();
  }

  createIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'connection-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 10001;
      transition: all 0.3s;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      cursor: pointer;
    `;
    
    indicator.onclick = () => this.showDetails();
    
    this.indicator = indicator;
    document.body.appendChild(indicator);
    this.updateUI();
  }

  attachListeners() {
    // Estado de internet
    window.addEventListener('online', () => {
      this.online = true;
      this.updateUI();
      window.toast?.success('Conexión restaurada');
      window.sounds?.success();
    });

    window.addEventListener('offline', () => {
      this.online = false;
      this.updateUI();
      window.toast?.error('Sin conexión a internet');
      window.sounds?.error();
    });

    // Estado de Socket.IO (si existe)
    if (window.socket) {
      window.socket.on('connect', () => {
        this.socketConnected = true;
        this.updateUI();
      });

      window.socket.on('disconnect', () => {
        this.socketConnected = false;
        this.updateUI();
      });
    }
  }

  updateUI() {
    let status, color, icon, bg;
    
    if (!this.online) {
      status = 'Sin Internet';
      color = '#fff';
      bg = '#ef4444';
      icon = '❌';
    } else if (!this.socketConnected) {
      status = 'Conectando...';
      color = '#fff';
      bg = '#f59e0b';
      icon = '⚠️';
    } else {
      status = 'Conectado';
      color = '#fff';
      bg = '#10b981';
      icon = '✓';
    }

    this.indicator.style.background = bg;
    this.indicator.style.color = color;
    this.indicator.innerHTML = `
      <span style="animation: ${!this.online || !this.socketConnected ? 'pulse 2s infinite' : 'none'};">${icon}</span>
      <span>${status}</span>
    `;
  }

  showDetails() {
    const details = `
      🌐 Internet: ${this.online ? '✓ Conectado' : '❌ Desconectado'}
      🔌 Socket: ${this.socketConnected ? '✓ Conectado' : '❌ Desconectado'}
      📶 Calidad: ${this.getConnectionQuality()}
    `;
    
    window.toast?.info(details.trim(), 3000);
  }

  getConnectionQuality() {
    if (!this.online) return 'Sin conexión';
    
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!connection) return 'Desconocida';
    
    const effectiveType = connection.effectiveType;
    const quality = {
      '4g': 'Excelente 📶',
      '3g': 'Buena 📶',
      '2g': 'Lenta 📶',
      'slow-2g': 'Muy lenta 📶'
    };
    
    return quality[effectiveType] || 'Desconocida';
  }
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.connectionIndicator = new ConnectionIndicator();
  });
} else {
  window.connectionIndicator = new ConnectionIndicator();
}

// Agregar animación pulse si no existe
if (!document.getElementById('pulse-animation')) {
  const style = document.createElement('style');
  style.id = 'pulse-animation';
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
  document.head.appendChild(style);
}
