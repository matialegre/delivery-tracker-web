// 🔐 Sistema de Autenticación Simple (Pseudo-JWT)

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.sessionToken = null;
    this.init();
  }

  init() {
    // Cargar sesión guardada
    const saved = localStorage.getItem('turemis_session');
    if (saved) {
      try {
        const session = JSON.parse(saved);
        if (this.isSessionValid(session)) {
          this.currentUser = session.user;
          this.sessionToken = session.token;
        } else {
          this.logout();
        }
      } catch (e) {
        console.error('Error al cargar sesión:', e);
        this.logout();
      }
    }
  }

  // Generar token simple (pseudo-JWT)
  generateToken(userId, role) {
    const timestamp = Date.now();
    const expiresAt = timestamp + (24 * 60 * 60 * 1000); // 24 horas
    
    const payload = {
      userId,
      role, // 'client' o 'driver'
      issuedAt: timestamp,
      expiresAt
    };

    // Codificar en base64 (NO es seguro para producción, solo demo)
    const token = btoa(JSON.stringify(payload));
    return { token, expiresAt };
  }

  // Validar token
  validateToken(token) {
    try {
      const payload = JSON.parse(atob(token));
      
      if (!payload.userId || !payload.role || !payload.expiresAt) {
        return null;
      }

      // Verificar expiración
      if (Date.now() > payload.expiresAt) {
        return null;
      }

      return payload;
    } catch (e) {
      return null;
    }
  }

  // Login como cliente
  loginAsClient(name, phone) {
    if (!name || !phone) {
      window.toast?.error('Nombre y teléfono son requeridos');
      return false;
    }

    const userId = `client_${Date.now()}`;
    const { token, expiresAt } = this.generateToken(userId, 'client');

    this.currentUser = {
      id: userId,
      name,
      phone,
      role: 'client',
      createdAt: Date.now()
    };

    this.sessionToken = token;

    const session = {
      user: this.currentUser,
      token,
      expiresAt
    };

    localStorage.setItem('turemis_session', JSON.stringify(session));
    
    window.toast?.success(`¡Bienvenido, ${name}!`);
    window.sounds?.success();
    
    return true;
  }

  // Login como conductor
  loginAsDriver(driverId, name, phone, carModel, plate) {
    if (!driverId || !name) {
      window.toast?.error('ID de conductor y nombre son requeridos');
      return false;
    }

    const { token, expiresAt } = this.generateToken(driverId, 'driver');

    this.currentUser = {
      id: driverId,
      name,
      phone,
      carModel,
      plate,
      role: 'driver',
      rating: 5.0,
      trips: 0,
      createdAt: Date.now()
    };

    this.sessionToken = token;

    const session = {
      user: this.currentUser,
      token,
      expiresAt
    };

    localStorage.setItem('turemis_session', JSON.stringify(session));
    localStorage.setItem('driverId', driverId);
    
    window.toast?.success(`¡Bienvenido, conductor ${name}!`);
    window.sounds?.success();
    
    return true;
  }

  // Logout
  logout() {
    this.currentUser = null;
    this.sessionToken = null;
    localStorage.removeItem('turemis_session');
    
    window.toast?.info('Sesión cerrada');
  }

  // Verificar si está logueado
  isAuthenticated() {
    return this.currentUser !== null && this.sessionToken !== null;
  }

  // Obtener usuario actual
  getCurrentUser() {
    return this.currentUser;
  }

  // Verificar rol
  isClient() {
    return this.currentUser?.role === 'client';
  }

  isDriver() {
    return this.currentUser?.role === 'driver';
  }

  // Verificar validez de sesión
  isSessionValid(session) {
    if (!session || !session.token || !session.user) return false;
    
    const payload = this.validateToken(session.token);
    if (!payload) return false;

    return Date.now() < session.expiresAt;
  }

  // Actualizar perfil
  updateProfile(updates) {
    if (!this.currentUser) return false;

    this.currentUser = { ...this.currentUser, ...updates };

    const session = {
      user: this.currentUser,
      token: this.sessionToken,
      expiresAt: JSON.parse(localStorage.getItem('turemis_session')).expiresAt
    };

    localStorage.setItem('turemis_session', JSON.stringify(session));
    
    window.toast?.success('Perfil actualizado');
    return true;
  }

  // Obtener header de autorización para API
  getAuthHeader() {
    return {
      'Authorization': `Bearer ${this.sessionToken}`,
      'X-User-Id': this.currentUser?.id || '',
      'X-User-Role': this.currentUser?.role || ''
    };
  }

  // Modal de login rápido
  showLoginModal(defaultRole = 'client') {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100000;
      animation: fadeIn 0.3s;
    `;

    const isDriver = defaultRole === 'driver';

    modal.innerHTML = `
      <div style="background: #fff; border-radius: 20px; padding: 32px; max-width: 400px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
        <h2 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 800; color: #000;">
          ${isDriver ? '🚗 Modo Conductor' : '🚕 Iniciar Sesión'}
        </h2>
        
        ${isDriver ? `
          <input type="text" id="auth-driver-id" placeholder="ID de conductor" style="width: 100%; padding: 12px; margin-bottom: 16px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 16px;">
        ` : ''}
        
        <input type="text" id="auth-name" placeholder="Tu nombre" style="width: 100%; padding: 12px; margin-bottom: 16px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 16px;">
        
        <input type="tel" id="auth-phone" placeholder="Teléfono" style="width: 100%; padding: 12px; margin-bottom: 16px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 16px;">
        
        ${isDriver ? `
          <input type="text" id="auth-car" placeholder="Modelo del auto" style="width: 100%; padding: 12px; margin-bottom: 16px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 16px;">
          <input type="text" id="auth-plate" placeholder="Patente" style="width: 100%; padding: 12px; margin-bottom: 24px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 16px;">
        ` : '<div style="margin-bottom: 24px;"></div>'}
        
        <div style="display: flex; gap: 12px;">
          <button id="auth-cancel" style="flex: 1; padding: 14px; background: #f3f4f6; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 16px;">
            Cancelar
          </button>
          <button id="auth-submit" style="flex: 1; padding: 14px; background: #000; color: #fff; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 16px;">
            Continuar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Eventos
    modal.querySelector('#auth-cancel').onclick = () => modal.remove();

    modal.querySelector('#auth-submit').onclick = () => {
      const name = modal.querySelector('#auth-name').value.trim();
      const phone = modal.querySelector('#auth-phone').value.trim();

      if (isDriver) {
        const driverId = modal.querySelector('#auth-driver-id').value.trim();
        const car = modal.querySelector('#auth-car').value.trim();
        const plate = modal.querySelector('#auth-plate').value.trim();

        if (this.loginAsDriver(driverId, name, phone, car, plate)) {
          modal.remove();
          window.location.reload();
        }
      } else {
        if (this.loginAsClient(name, phone)) {
          modal.remove();
          window.location.reload();
        }
      }
    };

    // Enter para submit
    modal.querySelectorAll('input').forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          modal.querySelector('#auth-submit').click();
        }
      });
    });
  }

  // Verificar autenticación y mostrar modal si es necesario
  requireAuth(role = null) {
    if (!this.isAuthenticated()) {
      this.showLoginModal(role || 'client');
      return false;
    }

    if (role && this.currentUser.role !== role) {
      window.toast?.error('No tienes permisos para acceder a esta página');
      return false;
    }

    return true;
  }

  // Crear badge de perfil
  createProfileBadge() {
    if (!this.isAuthenticated()) return null;

    const badge = document.createElement('div');
    badge.id = 'profile-badge';
    badge.style.cssText = `
      position: fixed;
      top: 20px;
      right: 80px;
      background: #fff;
      padding: 8px 16px;
      border-radius: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      z-index: 9996;
      transition: all 0.3s;
    `;

    const icon = this.isDriver() ? '🚗' : '👤';
    badge.innerHTML = `
      <span style="font-size: 20px;">${icon}</span>
      <span style="font-weight: 600; color: #000;">${this.currentUser.name}</span>
    `;

    badge.onclick = () => {
      const confirm = window.confirm('¿Cerrar sesión?');
      if (confirm) {
        this.logout();
        window.location.reload();
      }
    };

    document.body.appendChild(badge);
    return badge;
  }
}

// Instancia global
window.auth = new AuthManager();

// Auto-crear badge si está autenticado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.auth.isAuthenticated()) {
      window.auth.createProfileBadge();
    }
  });
} else {
  if (window.auth.isAuthenticated()) {
    window.auth.createProfileBadge();
  }
}
