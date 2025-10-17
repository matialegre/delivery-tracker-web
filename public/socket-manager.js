// 🔌 Gestor Avanzado de Socket.IO con Reconexión Inteligente

class SocketManager {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.isConnected = false;
    this.listeners = new Map();
    this.queuedMessages = [];
    this.heartbeatInterval = null;
  }

  connect(options = {}) {
    if (typeof io === 'undefined') {
      console.error('Socket.IO no está cargado');
      return null;
    }

    const defaultOptions = {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      transports: ['websocket', 'polling']
    };

    this.socket = io({ ...defaultOptions, ...options });

    this.attachEventHandlers();
    return this.socket;
  }

  attachEventHandlers() {
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      console.log('✅ Socket conectado:', this.socket.id);
      logSuccess('Socket.IO', 'Conectado');
      
      window.connectionIndicator?.updateUI();
      window.toast?.success('Conectado al servidor');
      window.sounds?.success();
      
      // Enviar mensajes encolados
      this.flushQueue();
      
      // Iniciar heartbeat
      this.startHeartbeat();
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      
      console.warn('⚠️ Socket desconectado:', reason);
      logWarning('Socket.IO', `Desconectado: ${reason}`);
      
      window.connectionIndicator?.updateUI();
      
      // Detener heartbeat
      this.stopHeartbeat();
      
      if (reason === 'io server disconnect') {
        // El servidor cerró la conexión, reconectar manualmente
        window.toast?.warning('Servidor desconectó. Reconectando...');
        this.socket.connect();
      } else if (reason === 'transport close' || reason === 'transport error') {
        window.toast?.warning('Conexión perdida. Reconectando...');
      }
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      
      console.error('❌ Error de conexión:', error);
      logError('Socket.IO', `Error: ${error.message}`);
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        window.toast?.error('No se pudo conectar al servidor');
        window.sounds?.error();
      } else {
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        console.log(`🔄 Reintento ${this.reconnectAttempts} en ${delay/1000}s...`);
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconectado después de ${attemptNumber} intentos`);
      logSuccess('Socket.IO', `Reconectado (${attemptNumber} intentos)`);
      
      window.toast?.success('Conexión restaurada');
      window.sounds?.success();
      window.haptics?.success();
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Intento de reconexión #${attemptNumber}`);
      
      if (attemptNumber % 3 === 0) {
        window.toast?.info(`Reconectando... (intento ${attemptNumber})`);
      }
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconexión fallida después de todos los intentos');
      logError('Socket.IO', 'Reconexión fallida');
      
      window.toast?.error('No se pudo reconectar. Recargá la página.');
      window.sounds?.error();
    });

    // Pong para heartbeat
    this.socket.on('pong', () => {
      console.log('💓 Heartbeat OK');
    });
  }

  // Sistema de heartbeat para verificar conexión
  startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.socket) {
        this.socket.emit('ping');
      }
    }, 30000); // Cada 30 segundos
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Emit con cola de respaldo
  emit(event, data) {
    if (this.isConnected && this.socket) {
      this.socket.emit(event, data);
      console.log(`📤 Emitido: ${event}`, data);
    } else {
      console.warn(`⚠️ Socket desconectado. Encolando: ${event}`);
      this.queuedMessages.push({ event, data, timestamp: Date.now() });
      
      // Limpiar mensajes viejos (más de 5 minutos)
      this.queuedMessages = this.queuedMessages.filter(
        msg => Date.now() - msg.timestamp < 300000
      );
    }
  }

  // Enviar mensajes encolados
  flushQueue() {
    console.log(`📬 Enviando ${this.queuedMessages.length} mensajes encolados`);
    
    while (this.queuedMessages.length > 0) {
      const msg = this.queuedMessages.shift();
      this.socket.emit(msg.event, msg.data);
    }
  }

  // On con auto-registro
  on(event, handler) {
    if (!this.socket) {
      console.error('Socket no inicializado');
      return;
    }

    // Guardar referencia para poder remover después
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);

    this.socket.on(event, handler);
  }

  // Remover listener
  off(event, handler) {
    if (!this.socket) return;

    this.socket.off(event, handler);

    if (this.listeners.has(event)) {
      const handlers = this.listeners.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Desconectar limpiamente
  disconnect() {
    this.stopHeartbeat();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.listeners.clear();
    this.queuedMessages = [];
  }

  // Reconectar manualmente
  reconnect() {
    if (this.socket) {
      this.socket.connect();
    } else {
      this.connect();
    }
  }

  // Estado de conexión
  getStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id || null,
      queuedMessages: this.queuedMessages.length,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Instancia global
window.socketManager = new SocketManager();

// Auto-conectar si existe Socket.IO
if (typeof io !== 'undefined') {
  window.addEventListener('load', () => {
    // Dar tiempo a que otros scripts se carguen
    setTimeout(() => {
      if (!window.socket) {
        window.socket = window.socketManager.connect();
      }
    }, 1000);
  });
}
