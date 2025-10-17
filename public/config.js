// ⚙️ Configuración Global del Sistema

const CONFIG = {
  // Información de la app
  app: {
    name: 'TuRemis',
    version: '2.0.0',
    description: 'Sistema Premium de Remises',
    author: 'TuRemis Team'
  },

  // Mapa
  map: {
    defaultCenter: [-33.4847, -60.0062], // Ramallo, Argentina
    defaultZoom: 13,
    minZoom: 10,
    maxZoom: 18,
    tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors'
  },

  // Precios
  pricing: {
    basePrice: 300, // Tarifa base en $
    pricePerKm: 150, // Precio por kilómetro en $
    minimumFare: 500, // Tarifa mínima en $
    currency: 'ARS',
    currencySymbol: '$'
  },

  // Tiempos
  timing: {
    gpsUpdateInterval: 2000, // Actualizar GPS cada 2 segundos
    searchDebounce: 500, // Debounce para búsquedas (ms)
    notificationDuration: 5000, // Duración de notificaciones (ms)
    sessionTimeout: 86400000, // 24 horas en ms
    heartbeatInterval: 30000 // Heartbeat cada 30 segundos
  },

  // Límites
  limits: {
    maxSearchResults: 5,
    maxFavorites: 10,
    maxChatMessages: 100,
    maxHistoryItems: 50,
    rateLimit: 100, // requests por minuto
    maxInputLength: 500
  },

  // Dispatch AI
  dispatch: {
    algorithm: 'balanced', // 'nearest', 'rating', 'balanced'
    driverTimeout: 30000, // 30 segundos para aceptar
    autoAssign: true, // Asignación automática
    maxDistance: 10 // km máximos para asignación
  },

  // Sonidos
  sounds: {
    enabled: true,
    volume: 0.3
  },

  // Vibraciones
  haptics: {
    enabled: true
  },

  // Notificaciones
  notifications: {
    enabled: true,
    autoRequest: false // Pedir permisos automáticamente
  },

  // Tema
  theme: {
    default: 'auto', // 'light', 'dark', 'auto'
    colors: {
      primary: '#000000',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    }
  },

  // Idioma
  i18n: {
    default: 'es',
    available: ['es', 'en'],
    autoDetect: true
  },

  // Socket.IO
  socket: {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    timeout: 20000
  },

  // APIs externas
  apis: {
    nominatim: 'https://nominatim.openstreetmap.org',
    timeout: 10000
  },

  // Features flags
  features: {
    chat: true,
    rating: true,
    tips: true,
    favorites: true,
    shareRide: true,
    history: true,
    notifications: true,
    darkMode: true,
    i18n: true,
    pwa: true,
    auth: true
  },

  // Debug
  debug: {
    enabled: false, // true en desarrollo
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
    showFPS: false,
    mockData: false
  },

  // URLs
  urls: {
    home: '/',
    request: '/request.html',
    driver: '/driver.html',
    client: '/client.html',
    rating: '/rating.html',
    history: '/history.html'
  },

  // Storage keys
  storage: {
    session: 'turemis_session',
    driverId: 'driverId',
    favorites: 'favoriteLocations',
    theme: 'theme',
    language: 'language',
    sounds: 'sounds_enabled',
    notifications: 'notifications_enabled',
    dailyStats: 'dailyStats'
  }
};

// Funciones helper
CONFIG.get = function(path) {
  return path.split('.').reduce((obj, key) => obj?.[key], this);
};

CONFIG.set = function(path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((obj, key) => obj[key] = obj[key] || {}, this);
  target[lastKey] = value;
  
  // Guardar en localStorage si es una configuración de usuario
  if (keys[0] === 'theme' || keys[0] === 'i18n' || keys[0] === 'sounds' || keys[0] === 'haptics') {
    localStorage.setItem(`config_${path}`, JSON.stringify(value));
  }
};

CONFIG.load = function() {
  // Cargar configuraciones guardadas del usuario
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('config_')) {
      const path = key.replace('config_', '');
      try {
        const value = JSON.parse(localStorage.getItem(key));
        this.set(path, value);
      } catch (e) {
        console.error(`Error cargando config ${path}:`, e);
      }
    }
  });
};

// Cargar configuraciones al inicio
CONFIG.load();

// Hacer global
window.CONFIG = CONFIG;

// Log de inicio
console.log(`
╔═══════════════════════════════════════════╗
║  🚕 ${CONFIG.app.name} v${CONFIG.app.version}                    ║
║  ${CONFIG.app.description}  ║
╚═══════════════════════════════════════════╝
`);

console.log('⚙️ Configuración cargada:', {
  Idioma: CONFIG.i18n.default,
  Tema: CONFIG.theme.default,
  Dispatch: CONFIG.dispatch.algorithm,
  Features: Object.keys(CONFIG.features).filter(f => CONFIG.features[f]).length + '/10'
});
