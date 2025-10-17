// 🌐 Sistema de Internacionalización (i18n)

class I18nManager {
  constructor() {
    this.currentLang = this.getStoredLanguage() || this.detectLanguage();
    this.translations = {
      es: {
        // General
        'app.name': 'TuRemis',
        'app.loading': 'Cargando...',
        
        // Index
        'index.title': '¿A dónde vas?',
        'index.subtitle': 'Tu viaje comienza acá',
        'index.request_ride': 'Pedir Remis',
        'index.driver_mode': 'Modo Conductor',
        'index.taxis_available': '{count} taxis disponibles',
        
        // Request
        'request.title': 'Pedir Viaje',
        'request.from': 'Desde',
        'request.to': 'Hasta',
        'request.name': 'Tu nombre',
        'request.phone': 'Teléfono',
        'request.my_location': 'Mi ubicación',
        'request.price_estimate': 'Precio estimado',
        'request.distance': 'Distancia',
        'request.submit': 'Confirmar y pedir taxi',
        'request.favorites': 'Lugares frecuentes',
        
        // Driver
        'driver.title': 'Conductor',
        'driver.available': 'DISPONIBLE',
        'driver.not_available': 'NO DISPONIBLE',
        'driver.earnings_today': 'Ganancias hoy',
        'driver.trips_today': 'Viajes hoy',
        'driver.new_ride': 'Nuevo Viaje',
        'driver.accept': 'Aceptar Viaje',
        'driver.reject': 'Rechazar',
        'driver.arrived': 'Llegué',
        'driver.complete': 'Finalizar',
        'driver.chat': 'Chat con cliente',
        
        // Client
        'client.driver_assigned': 'Conductor asignado',
        'client.driver_arrived': 'Tu conductor llegó',
        'client.on_trip': 'En viaje',
        'client.eta': 'Llega en',
        'client.share': 'Compartir viaje',
        'client.minutes': 'min',
        
        // Rating
        'rating.title': '¿Cómo fue tu viaje?',
        'rating.tip': 'Dejar propina',
        'rating.comment': 'Dejá un comentario',
        'rating.submit': 'Enviar calificación',
        
        // Notifications
        'notif.ride_accepted': '¡Un conductor aceptó tu viaje!',
        'notif.driver_arriving': 'Tu conductor está cerca',
        'notif.driver_arrived': 'Tu conductor llegó',
        'notif.trip_completed': 'Viaje completado',
        
        // Errors
        'error.no_location': 'No se pudo obtener tu ubicación',
        'error.no_drivers': 'No hay conductores disponibles',
        'error.connection': 'Error de conexión',
        
        // Success
        'success.ride_created': '¡Pedido creado exitosamente!',
        'success.ride_accepted': 'Viaje aceptado',
        'success.favorite_saved': 'Lugar guardado en favoritos'
      },
      en: {
        // General
        'app.name': 'TuRemis',
        'app.loading': 'Loading...',
        
        // Index
        'index.title': 'Where to?',
        'index.subtitle': 'Your journey starts here',
        'index.request_ride': 'Request Ride',
        'index.driver_mode': 'Driver Mode',
        'index.taxis_available': '{count} taxis available',
        
        // Request
        'request.title': 'Request Ride',
        'request.from': 'From',
        'request.to': 'To',
        'request.name': 'Your name',
        'request.phone': 'Phone',
        'request.my_location': 'My location',
        'request.price_estimate': 'Estimated price',
        'request.distance': 'Distance',
        'request.submit': 'Confirm and request',
        'request.favorites': 'Saved places',
        
        // Driver
        'driver.title': 'Driver',
        'driver.available': 'AVAILABLE',
        'driver.not_available': 'NOT AVAILABLE',
        'driver.earnings_today': 'Today earnings',
        'driver.trips_today': 'Trips today',
        'driver.new_ride': 'New Ride',
        'driver.accept': 'Accept Ride',
        'driver.reject': 'Reject',
        'driver.arrived': 'I arrived',
        'driver.complete': 'Complete',
        'driver.chat': 'Chat with client',
        
        // Client
        'client.driver_assigned': 'Driver assigned',
        'client.driver_arrived': 'Your driver arrived',
        'client.on_trip': 'On trip',
        'client.eta': 'Arrives in',
        'client.share': 'Share trip',
        'client.minutes': 'min',
        
        // Rating
        'rating.title': 'How was your trip?',
        'rating.tip': 'Leave a tip',
        'rating.comment': 'Leave a comment',
        'rating.submit': 'Submit rating',
        
        // Notifications
        'notif.ride_accepted': 'A driver accepted your ride!',
        'notif.driver_arriving': 'Your driver is nearby',
        'notif.driver_arrived': 'Your driver arrived',
        'notif.trip_completed': 'Trip completed',
        
        // Errors
        'error.no_location': 'Could not get your location',
        'error.no_drivers': 'No drivers available',
        'error.connection': 'Connection error',
        
        // Success
        'success.ride_created': 'Ride created successfully!',
        'success.ride_accepted': 'Ride accepted',
        'success.favorite_saved': 'Place saved to favorites'
      }
    };
  }

  detectLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    return browserLang.startsWith('es') ? 'es' : 'en';
  }

  getStoredLanguage() {
    return localStorage.getItem('language');
  }

  setLanguage(lang) {
    if (!this.translations[lang]) {
      console.warn(`Idioma ${lang} no soportado`);
      return false;
    }

    this.currentLang = lang;
    localStorage.setItem('language', lang);
    this.updateDOM();
    window.toast?.success(this.t('success.language_changed'));
    return true;
  }

  t(key, params = {}) {
    let text = this.translations[this.currentLang]?.[key] || key;
    
    // Reemplazar parámetros {param}
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
  }

  updateDOM() {
    // Actualizar todos los elementos con data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });

    // Actualizar placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });
  }

  createLanguageToggle() {
    const button = document.createElement('button');
    button.id = 'language-toggle';
    button.style.cssText = `
      position: fixed;
      bottom: 140px;
      left: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      border: none;
      background: #3b82f6;
      color: #fff;
      font-size: 20px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      z-index: 9997;
      transition: all 0.3s;
    `;
    
    button.textContent = this.currentLang.toUpperCase();
    button.title = 'Cambiar idioma / Change language';
    
    button.onclick = () => {
      const newLang = this.currentLang === 'es' ? 'en' : 'es';
      this.setLanguage(newLang);
      button.textContent = newLang.toUpperCase();
      window.sounds?.click();
      window.haptics?.light();
    };
    
    document.body.appendChild(button);
    return button;
  }

  // Helper para traducir objetos completos
  translateObject(obj, prefix = '') {
    const translated = {};
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      translated[key] = this.t(fullKey);
    });
    return translated;
  }
}

// Instancia global
window.i18n = new I18nManager();

// Auto-crear botón toggle
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.i18n.createLanguageToggle();
    window.i18n.updateDOM();
  });
} else {
  window.i18n.createLanguageToggle();
  window.i18n.updateDOM();
}

// Helper global para traducción
window.t = (key, params) => window.i18n.t(key, params);
