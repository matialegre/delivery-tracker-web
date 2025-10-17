// 🔔 Sistema de Notificaciones Web Nativas

class NotificationManager {
  constructor() {
    this.permission = 'default';
    this.enabled = false;
    this.checkPermission();
  }

  async checkPermission() {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones');
      return false;
    }

    this.permission = Notification.permission;
    this.enabled = this.permission === 'granted';
    return this.enabled;
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      window.toast?.warning('Tu navegador no soporta notificaciones');
      return false;
    }

    if (this.permission === 'granted') {
      window.toast?.info('Ya tienes las notificaciones activadas');
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      this.enabled = permission === 'granted';

      if (this.enabled) {
        window.toast?.success('¡Notificaciones activadas!');
        window.sounds?.success();
        localStorage.setItem('notifications_enabled', 'true');
        
        // Enviar notificación de prueba
        this.send({
          title: '✅ Notificaciones activadas',
          body: 'Recibirás alertas importantes sobre tus viajes',
          icon: '/favicon.svg'
        });
      } else {
        window.toast?.warning('Notificaciones desactivadas');
      }

      return this.enabled;
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
      return false;
    }
  }

  send({ title, body, icon, tag, data, actions = [] }) {
    if (!this.enabled) {
      console.log('Notificaciones desactivadas');
      return null;
    }

    try {
      const options = {
        body,
        icon: icon || '/favicon.svg',
        badge: '/favicon.svg',
        tag: tag || 'turemis-notification',
        data: data || {},
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200],
        actions: actions.length > 0 ? actions : undefined
      };

      const notification = new Notification(title, options);

      // Auto-cerrar después de 10 segundos
      setTimeout(() => notification.close(), 10000);

      // Eventos
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Si hay URL en data, navegar
        if (data.url) {
          window.location.href = data.url;
        }
      };

      window.sounds?.notification();
      
      return notification;
    } catch (error) {
      console.error('Error al enviar notificación:', error);
      return null;
    }
  }

  // Notificaciones predefinidas

  newRideRequest({ clientName, pickup }) {
    return this.send({
      title: '🚕 Nuevo Viaje Disponible',
      body: `${clientName} necesita un remis desde ${pickup}`,
      tag: 'new-ride',
      data: { type: 'new_ride' },
      actions: [
        { action: 'accept', title: 'Aceptar' },
        { action: 'reject', title: 'Rechazar' }
      ]
    });
  }

  rideAccepted({ driverName, eta }) {
    return this.send({
      title: '✅ ¡Conductor Encontrado!',
      body: `${driverName} aceptó tu viaje. Llega en ${eta} min`,
      tag: 'ride-accepted'
    });
  }

  driverArriving({ driverName, eta }) {
    return this.send({
      title: '🚗 Tu conductor está cerca',
      body: `${driverName} llega en ${eta} minutos`,
      tag: 'driver-arriving',
      requireInteraction: true
    });
  }

  driverArrived({ driverName }) {
    return this.send({
      title: '📍 Tu conductor llegó',
      body: `${driverName} está esperándote en el punto de recogida`,
      tag: 'driver-arrived',
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200, 100, 200]
    });
  }

  tripCompleted({ fare }) {
    return this.send({
      title: '✅ Viaje Completado',
      body: `Total: $${fare}. ¡Gracias por viajar con nosotros!`,
      tag: 'trip-completed',
      data: { url: '/rating.html' }
    });
  }

  messageReceived({ from, message }) {
    return this.send({
      title: `💬 Mensaje de ${from}`,
      body: message.substring(0, 100),
      tag: 'new-message'
    });
  }

  emergencyAlert({ type, location }) {
    return this.send({
      title: '🚨 ALERTA DE EMERGENCIA',
      body: `Alerta de seguridad activada en ${location}`,
      tag: 'emergency',
      requireInteraction: true,
      vibrate: [500, 200, 500, 200, 500]
    });
  }

  // Verificar si están habilitadas
  areEnabled() {
    return this.enabled;
  }

  // Deshabilitar notificaciones
  disable() {
    this.enabled = false;
    localStorage.setItem('notifications_enabled', 'false');
    window.toast?.info('Notificaciones desactivadas');
  }

  // Crear botón de activación
  createToggleButton() {
    const button = document.createElement('button');
    button.id = 'notifications-toggle';
    button.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      border: none;
      background: ${this.enabled ? '#10b981' : '#6b7280'};
      color: #fff;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      z-index: 9998;
      transition: all 0.3s;
    `;
    
    button.textContent = this.enabled ? '🔔' : '🔕';
    button.title = this.enabled ? 'Notificaciones ON' : 'Notificaciones OFF';
    
    button.onclick = async () => {
      if (this.enabled) {
        this.disable();
        button.style.background = '#6b7280';
        button.textContent = '🔕';
      } else {
        const granted = await this.requestPermission();
        if (granted) {
          button.style.background = '#10b981';
          button.textContent = '🔔';
        }
      }
    };
    
    document.body.appendChild(button);
    return button;
  }
}

// Instancia global
window.notifications = new NotificationManager();

// Auto-crear botón toggle cuando carga el DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.notifications.createToggleButton();
  });
} else {
  window.notifications.createToggleButton();
}
