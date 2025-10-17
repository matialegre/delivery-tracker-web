// 📊 Sistema de Analytics Simple

class AnalyticsManager {
  constructor() {
    this.events = [];
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.pageViews = [];
    this.init();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  init() {
    // Track page view
    this.trackPageView(window.location.pathname);

    // Track session duration al cerrar
    window.addEventListener('beforeunload', () => {
      this.trackSessionEnd();
    });

    // Track clicks globales
    document.addEventListener('click', (e) => {
      const target = e.target.closest('button, a, [data-track]');
      if (target) {
        const trackData = target.getAttribute('data-track');
        if (trackData) {
          this.track('click', { element: trackData });
        } else {
          this.track('click', {
            element: target.tagName,
            text: target.textContent?.substring(0, 50)
          });
        }
      }
    });
  }

  // Trackear evento
  track(eventName, properties = {}) {
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: eventName,
      properties,
      sessionId: this.sessionId,
      userId: window.auth?.getCurrentUser()?.id || 'anonymous',
      userRole: window.auth?.getCurrentUser()?.role || 'guest',
      timestamp: Date.now(),
      page: window.location.pathname,
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screen: {
        width: window.screen.width,
        height: window.screen.height
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    this.events.push(event);
    this.saveToStorage();

    // Log en desarrollo
    if (window.CONFIG?.debug.enabled) {
      console.log('📊 Analytics:', eventName, properties);
    }

    return event;
  }

  // Trackear page view
  trackPageView(path) {
    const pageView = {
      path,
      timestamp: Date.now(),
      referrer: document.referrer
    };

    this.pageViews.push(pageView);
    this.track('page_view', pageView);
  }

  // Trackear sesión finalizada
  trackSessionEnd() {
    const duration = Date.now() - this.startTime;
    this.track('session_end', {
      duration,
      durationMinutes: Math.round(duration / 60000),
      eventsCount: this.events.length,
      pageViewsCount: this.pageViews.length
    });
  }

  // Eventos predefinidos

  // Viajes
  trackRideRequested(data) {
    return this.track('ride_requested', data);
  }

  trackRideAccepted(data) {
    return this.track('ride_accepted', data);
  }

  trackRideCompleted(data) {
    return this.track('ride_completed', data);
  }

  trackRideCanceled(data) {
    return this.track('ride_canceled', data);
  }

  // Ratings
  trackRatingSubmitted(data) {
    return this.track('rating_submitted', data);
  }

  trackTipGiven(data) {
    return this.track('tip_given', data);
  }

  // Chat
  trackMessageSent(data) {
    return this.track('message_sent', data);
  }

  trackMessageReceived(data) {
    return this.track('message_received', data);
  }

  // Búsquedas
  trackSearch(data) {
    return this.track('search', data);
  }

  trackLocationSelected(data) {
    return this.track('location_selected', data);
  }

  // Favoritos
  trackFavoriteAdded(data) {
    return this.track('favorite_added', data);
  }

  trackFavoriteRemoved(data) {
    return this.track('favorite_removed', data);
  }

  // Compartir
  trackRideShared(data) {
    return this.track('ride_shared', data);
  }

  // Errores
  trackError(error, context = {}) {
    return this.track('error', {
      message: error.message,
      stack: error.stack?.substring(0, 500),
      ...context
    });
  }

  // Performance
  trackPerformance(metric, value) {
    return this.track('performance', {
      metric,
      value,
      unit: 'ms'
    });
  }

  // Guardar en localStorage
  saveToStorage() {
    try {
      // Solo guardar últimos 100 eventos
      const recentEvents = this.events.slice(-100);
      localStorage.setItem('analytics_events', JSON.stringify(recentEvents));
    } catch (e) {
      console.error('Error guardando analytics:', e);
    }
  }

  // Cargar desde localStorage
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('analytics_events');
      if (saved) {
        this.events = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error cargando analytics:', e);
    }
  }

  // Obtener estadísticas
  getStats() {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const recentEvents = this.events.filter(e => e.timestamp > last24h);

    // Agrupar por tipo de evento
    const eventsByType = {};
    recentEvents.forEach(event => {
      eventsByType[event.name] = (eventsByType[event.name] || 0) + 1;
    });

    // Calcular métricas
    const stats = {
      totalEvents: this.events.length,
      recentEvents: recentEvents.length,
      eventsByType,
      sessionDuration: Math.round((now - this.startTime) / 1000), // segundos
      pageViews: this.pageViews.length,
      currentPage: window.location.pathname,
      userId: window.auth?.getCurrentUser()?.id || 'anonymous'
    };

    return stats;
  }

  // Exportar eventos
  export() {
    return {
      sessionId: this.sessionId,
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      events: this.events,
      pageViews: this.pageViews,
      stats: this.getStats()
    };
  }

  // Limpiar datos
  clear() {
    this.events = [];
    this.pageViews = [];
    localStorage.removeItem('analytics_events');
    console.log('📊 Analytics limpiado');
  }

  // Mostrar dashboard simple
  showDashboard() {
    const stats = this.getStats();
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #fff;
      border-radius: 20px;
      padding: 32px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      z-index: 100001;
      color: #000;
    `;

    const eventsList = Object.entries(stats.eventsByType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => `<li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>${name}:</strong> ${count}</li>`)
      .join('');

    modal.innerHTML = `
      <h2 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 800;">📊 Analytics Dashboard</h2>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
        <div style="background: #f9fafb; padding: 16px; border-radius: 12px; text-align: center;">
          <div style="font-size: 32px; font-weight: 800; color: #10b981;">${stats.totalEvents}</div>
          <div style="color: #666; font-size: 14px;">Eventos Totales</div>
        </div>
        <div style="background: #f9fafb; padding: 16px; border-radius: 12px; text-align: center;">
          <div style="font-size: 32px; font-weight: 800; color: #3b82f6;">${stats.pageViews}</div>
          <div style="color: #666; font-size: 14px;">Page Views</div>
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 12px;">Sesión Actual</h3>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>ID:</strong> ${this.sessionId}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Duración:</strong> ${Math.floor(stats.sessionDuration / 60)} min</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Usuario:</strong> ${stats.userId}</li>
        </ul>
      </div>

      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 12px;">Eventos (últimas 24h)</h3>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${eventsList || '<li style="padding: 8px 0; color: #999;">Sin eventos recientes</li>'}
        </ul>
      </div>

      <div style="display: flex; gap: 12px;">
        <button onclick="window.analytics.clear(); this.closest('div').parentElement.remove(); window.toast?.success('Analytics limpiado');" style="flex: 1; padding: 12px; background: #ef4444; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
          Limpiar
        </button>
        <button onclick="navigator.clipboard.writeText(JSON.stringify(window.analytics.export(), null, 2)); window.toast?.success('Exportado al portapapeles');" style="flex: 1; padding: 12px; background: #10b981; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
          Exportar
        </button>
        <button onclick="this.closest('div').parentElement.remove();" style="flex: 1; padding: 12px; background: #000; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
          Cerrar
        </button>
      </div>
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
      z-index: 100000;
    `;
    overlay.onclick = () => {
      modal.remove();
      overlay.remove();
    };

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
  }
}

// Instancia global
window.analytics = new AnalyticsManager();

// Track errores globales
window.addEventListener('error', (e) => {
  window.analytics.trackError(e.error || new Error(e.message), {
    filename: e.filename,
    lineno: e.lineno,
    colno: e.colno
  });
});

// Track performance
window.addEventListener('load', () => {
  if (window.performance && window.performance.timing) {
    const timing = window.performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    window.analytics.trackPerformance('page_load', loadTime);
  }
});

// Atajo para ver dashboard: Ctrl+Shift+A
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    e.preventDefault();
    window.analytics.showDashboard();
  }
});

console.log('📊 Analytics inicializado. Presiona Ctrl+Shift+A para ver dashboard');
