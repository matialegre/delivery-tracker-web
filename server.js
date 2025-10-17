import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import webpush from 'web-push';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// 🛡️ Middleware de Rate Limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const MAX_REQUESTS = 100; // 100 requests por minuto

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const userData = rateLimitMap.get(ip);
  
  if (now > userData.resetTime) {
    userData.count = 1;
    userData.resetTime = now + RATE_LIMIT_WINDOW;
    return next();
  }
  
  if (userData.count >= MAX_REQUESTS) {
    return res.status(429).json({ ok: false, error: 'rate_limit_exceeded', message: 'Demasiadas solicitudes. Intenta en 1 minuto.' });
  }
  
  userData.count++;
  next();
}

// 🧹 Sanitización de inputs
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, '') // Remover event handlers
    .trim()
    .slice(0, 500); // Limitar longitud
}

function validateAndSanitizeBody(req, res, next) {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }
  next();
}

// Aplicar middlewares
app.use(rateLimit);
app.use(validateAndSanitizeBody);

// 🎨 Logger mejorado con colores y timestamps
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(level, emoji, message, data = null) {
  const timestamp = new Date().toLocaleTimeString('es-AR');
  const colorMap = {
    info: colors.blue,
    success: colors.green,
    warning: colors.yellow,
    error: colors.red,
    data: colors.cyan
  };
  const color = colorMap[level] || colors.reset;
  console.log(`${colors.bright}[${timestamp}]${colors.reset} ${color}${emoji} ${message}${colors.reset}`);
  if (data) console.log(`${colors.cyan}  →`, data, colors.reset);
}

// Shortcuts
const logInfo = (msg, data) => log('info', 'ℹ️', msg, data);
const logSuccess = (msg, data) => log('success', '✅', msg, data);
const logWarning = (msg, data) => log('warning', '⚠️', msg, data);
const logError = (msg, data) => log('error', '❌', msg, data);
const logData = (msg, data) => log('data', '📊', msg, data);

// API: list latest driver locations
app.get('/api/drivers', (_req, res) => {
  const now = Date.now();
  const TTL_MS = 30_000; // only include locations from the last 30s
  const list = Array.from(lastLocationByDriver.entries())
    .map(([driverId, loc]) => ({ driverId, ...loc }))
    .filter(d => isFinite(d?.lat) && isFinite(d?.lng) && isFinite(d?.timestamp) && (now - d.timestamp) < TTL_MS);
  logData(`API /drivers`, `${list.length} conductores activos`);
  res.json({ ok: true, drivers: list });
});

// Web Push public key
app.get('/api/push/publicKey', (_req, res) => {
  res.json({ publicKey: VAPID_PUBLIC });
});

// Subscribe to push
app.post('/api/push/subscribe', async (req, res) => {
  const sub = req.body?.subscription;
  if (!sub) return res.status(400).json({ ok:false, error:'missing_subscription' });
  db.data.pushSubs = db.data.pushSubs || [];
  // prevent duplicates by endpoint
  if (!db.data.pushSubs.find(s => s.endpoint === sub.endpoint)) {
    db.data.pushSubs.push(sub);
    await savePushSubs();
  }
  res.json({ ok:true });
});

// 🎯 RATING Y PROPINAS
app.post('/api/rides/:rideId/rate', async (req, res) => {
  const { rideId } = req.params;
  const { rating, tip, comment } = req.body;
  const ride = rides.get(rideId);
  if (!ride) return res.status(404).json({ ok: false, error: 'ride_not_found' });
  
  ride.rating = rating;
  ride.tip = tip || 0;
  ride.comment = comment || '';
  ride.ratedAt = Date.now();
  
  await saveRides();
  res.json({ ok: true });
});

// (moved) /api/rides/:rideId/accept defined later after json middleware

// Serve favicon explicitly (redirect to SVG) BEFORE static to avoid empty .ico issues
app.get('/favicon.ico', (_req, res) => res.redirect(302, '/favicon.svg'));

// Serve static files
app.use(express.static('public'));
// JSON parsing for API
app.use(express.json());

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Track online drivers (driverId -> connection count)
const onlineDrivers = new Map();

io.on('connection', (socket) => {
  // Client or driver joins a room for a specific driverId
  socket.on('join', ({ role, driverId }) => {
    if (!driverId) return;
    const room = `driver:${driverId}`;
    socket.join(room);
    socket.data.role = role;
    socket.data.room = room;
    // Notify clients a driver connected (useful for UI)
    if (role === 'driver') {
      io.to(room).emit('driver_status', { online: true });
      // increment online count
      const c = onlineDrivers.get(driverId) || 0;
      onlineDrivers.set(driverId, c + 1);
      // Add to global drivers room for offers
      socket.join('drivers');
    }
  });

  // Driver safety alert (e.g., pasajero peligroso)
  socket.on('driver_alert', (payload) => {
    try {
      const { type = 'danger', rideId } = payload || {};
      const driverIdFromRoom = socket.data?.room?.split(':')[1] || null;
      const msg = { type, rideId: rideId || null, driverId: driverIdFromRoom, ts: Date.now() };
      // Broadcast to all drivers
      io.to('drivers').emit('driver_alert', msg);
      // Also to ride room if present
      if (rideId) io.to(`ride:${rideId}`).emit('driver_alert', msg);
    } catch {}
  });

  // --- NUEVA FUNCIÓN DE SEGURIDAD: Actividad sospechosa ---
  socket.on('suspicious_activity', async (payload) => {
    try {
      const { rideId, type, description } = payload || {};
      if (!rideId || !type) return;
      const driverIdFromRoom = socket.data?.room?.split(':')[1] || null;
      const ride = rides.get(rideId);
      const alertId = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
      const alert = {
        id: alertId,
        rideId,
        type, // 'driver_suspicious' | 'path_suspicious' | 'passenger_suspicious'
        description: description || '',
        timestamp: new Date().toISOString(),
        driverId: ride?.driverId || driverIdFromRoom,
        lastCoord: ride?.lastLocation || lastLocationByDriver.get(ride?.driverId) || null,
        status: 'active'
      };
      alerts.set(alertId, alert);
      await saveAlerts();
      
      // Broadcast a sala del ride
      io.to(`ride:${rideId}`).emit('suspicious_activity', alert);
      // Broadcast global a todos los drivers
      io.emit('global_alert', alert);
      // Enviar notificaciones externas
      sendSafetyAlert(alert);
    } catch (err) {
      console.error('Error handling suspicious_activity:', err);
    }
  });

  // Join a ride room by rideId (for client tracking and dispatch)
  socket.on('join_ride', ({ rideId }) => {
    if (!rideId) return;
    socket.join(`ride:${rideId}`);
  });
  
  // 💬 Chat messages
  socket.on('chat_message', ({ rideId, message, from }) => {
    if (!rideId || !message) return;
    // Broadcast message to everyone in the ride room
    io.to(`ride:${rideId}`).emit('chat_message', { message, from, timestamp: Date.now() });
  });

  // Driver sends location updates
  socket.on('location', (payload) => {
    const { lat, lng, accuracy, heading, speed, timestamp } = payload || {};
    if (!socket.data?.room) return;
    // Broadcast to everyone in the room except sender
    socket.to(socket.data.room).emit('location', {
      lat,
      lng,
      accuracy,
      heading,
      speed,
      timestamp: timestamp || Date.now(),
    });

    // Link driver locations to any active rides assigned to this driver
    const driverIdFromRoom = socket.data.room?.split(':')[1];
    if (driverIdFromRoom) {
      lastLocationByDriver.set(driverIdFromRoom, {
        lat, lng, accuracy, heading, speed, timestamp: timestamp || Date.now(),
      });
      logSuccess(`Ubicación ${driverIdFromRoom}`, `${lat.toFixed(5)}, ${lng.toFixed(5)} (±${accuracy}m)`);
      // Update rides with this driver
      for (const [rid, ride] of rides.entries()) {
        if (ride.driverId === driverIdFromRoom && !['completed','canceled'].includes(ride.status)) {
          ride.lastLocation = { lat, lng, accuracy, heading, speed, timestamp: timestamp || Date.now() };
          io.to(`ride:${rid}`).emit('ride_update', { type: 'location', rideId: rid, lastLocation: ride.lastLocation });
        }
      }
    }
  });

  socket.on('disconnect', () => {
    if (socket.data?.role === 'driver' && socket.data?.room) {
      const driverId = socket.data.room.split(':')[1];
      // decrement online count
      if (driverId) {
        const c = onlineDrivers.get(driverId) || 0;
        if (c <= 1) onlineDrivers.delete(driverId); else onlineDrivers.set(driverId, c - 1);
      }
      io.to(socket.data.room).emit('driver_status', { online: false });
    }
  });
});

// In-memory stores with persistence (LowDB)
const rides = new Map(); // rideId -> ride
const lastLocationByDriver = new Map(); // driverId -> last location

// --- NUEVA FUNCIÓN DE SEGURIDAD: Alertas ---
const alerts = new Map(); // alertId -> alert

// LowDB database (persist rides + alerts + drivers)
const adapter = new JSONFile('db.json');
const db = new Low(adapter, { rides: {}, lastLocationByDriver: {}, pushSubs: [], alerts: {}, drivers: {}, sessions: {} });
await db.read();
db.data ||= { rides: {}, lastLocationByDriver: {}, pushSubs: [], alerts: {}, drivers: {}, sessions: {} };
// Load persisted rides
for (const [rid, ride] of Object.entries(db.data.rides || {})) rides.set(rid, ride);
for (const [did, loc] of Object.entries(db.data.lastLocationByDriver || {})) lastLocationByDriver.set(did, loc);
for (const [aid, alert] of Object.entries(db.data.alerts || {})) alerts.set(aid, alert);

async function saveRides() {
  // persist rides map to db
  db.data.rides = Object.fromEntries(rides.entries());
  await db.write();
}

// --- NUEVA FUNCIÓN DE SEGURIDAD: Guardar alertas ---
async function saveAlerts() {
  db.data.alerts = Object.fromEntries(alerts.entries());
  await db.write();
}

// --- NUEVA FUNCIÓN DE SEGURIDAD: Guardar drivers ---
async function saveDrivers() {
  await db.write();
}

// Web Push setup (optional via env)
const VAPID_PUBLIC = process.env.WEB_PUSH_PUBLIC_KEY || '';
const VAPID_PRIVATE = process.env.WEB_PUSH_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.WEB_PUSH_SUBJECT || 'mailto:admin@example.com';
if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

function savePushSubs() { return db.write(); }
async function sendPushAll(payload) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;
  const subs = db.data.pushSubs || [];
  const body = JSON.stringify(payload);
  await Promise.allSettled(subs.map(sub => webpush.sendNotification(sub, body)));
}

// --- NUEVA FUNCIÓN DE SEGURIDAD: Enviar alerta de seguridad ---
async function sendSafetyAlert(alert) {
  const { rideId, type, driverId, lastCoord } = alert;
  const ride = rides.get(rideId);
  const msg = `🚨 ALERTA DE SEGURIDAD\n📍 Viaje: ${rideId}\n⚠️ Tipo: ${type}\n🚗 Driver: ${driverId || 'N/A'}\n🗺️ Coord: ${lastCoord?.lat},${lastCoord?.lng}`;
  
  // Twilio SMS
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const tok = process.env.TWILIO_AUTH_TOKEN;
  const fromSMS = process.env.TWILIO_FROM_SMS;
  if (sid && tok && fromSMS) {
    try {
      const twilio = (await import('twilio')).default(sid, tok);
      const tasks = [];
      // Enviar a contacto de emergencia del pasajero
      if (ride?.emergencyContact) tasks.push(twilio.messages.create({ from: fromSMS, to: ride.emergencyContact, body: msg }));
      // Enviar a contacto de emergencia del driver
      const driver = db.data.drivers?.[driverId];
      if (driver?.emergencyContact) tasks.push(twilio.messages.create({ from: fromSMS, to: driver.emergencyContact, body: msg }));
      await Promise.allSettled(tasks);
    } catch {}
  }
  
  // Telegram
  const bot = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (bot && chat) {
    try {
      await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text: msg })
      });
    } catch {}
  }
}

// Optional notifications
async function notifyDispatcher(text) {
  // Telegram
  const bot = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (bot && chat) {
    try {
      await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text })
      });
    } catch {}
  }
  // Twilio (SMS/WhatsApp)
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const tok = process.env.TWILIO_AUTH_TOKEN;
  const fromSMS = process.env.TWILIO_FROM_SMS; // +54...
  const fromWA = process.env.TWILIO_FROM_WA;   // whatsapp:+1415...
  const toSMS = process.env.DISPATCHER_PHONE;  // +54...
  const toWA = process.env.DISPATCHER_WA;      // whatsapp:+54...
  if (sid && tok) {
    try {
      const twilio = (await import('twilio')).default(sid, tok);
      const tasks = [];
      if (fromSMS && toSMS) tasks.push(twilio.messages.create({ from: fromSMS, to: toSMS, body: text }));
      if (fromWA && toWA) tasks.push(twilio.messages.create({ from: fromWA, to: toWA, body: text }));
      if (tasks.length) await Promise.allSettled(tasks);
    } catch {}
  }
}

async function notifyClient(phone, text) {
  // Twilio only (SMS/WhatsApp). If client phone starts with +, send SMS; if you want WA, set TWILIO_FROM_WA and pass formatted whatsapp:+54...
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const tok = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !tok || !phone) return;
  try {
    const twilio = (await import('twilio')).default(sid, tok);
    const tasks = [];
    const fromSMS = process.env.TWILIO_FROM_SMS;
    const fromWA = process.env.TWILIO_FROM_WA;
    // Try SMS if looks like +...
    if (fromSMS && phone.startsWith('+')) tasks.push(twilio.messages.create({ from: fromSMS, to: phone, body: text }));
    // Try WhatsApp if env provided and phone formatted as whatsapp:+...
    if (fromWA && phone.startsWith('whatsapp:')) tasks.push(twilio.messages.create({ from: fromWA, to: phone, body: text }));
    if (tasks.length) await Promise.allSettled(tasks);
  } catch {}
}

// Helpers
function newRideId() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

function sanitizeRide(ride) {
  // Return a shallow copy safe for client
  const { phone, driverPhone, ...rest } = ride; // keep phones internally, still return sanitized
  return { ...rest, phone, driverPhone };
}

// --- NUEVA FUNCIÓN DE SEGURIDAD: Autenticación ---
function generateToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function authMiddleware(requiredRole) {
  return (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ ok: false, error: 'missing_token' });
    const session = db.data.sessions?.[token];
    if (!session || (requiredRole && session.role !== requiredRole && session.role !== 'dispatcher')) {
      return res.status(403).json({ ok: false, error: 'forbidden' });
    }
    req.user = session;
    next();
  };
}

// API: Login (autenticación mínima)
app.post('/api/login', async (req, res) => {
  const { id, role, password } = req.body || {};
  if (!id || !role) return res.status(400).json({ ok: false, error: 'missing_fields' });
  // Validación simple (en prod usar bcrypt y DB real)
  const validRoles = ['client', 'driver', 'dispatcher'];
  if (!validRoles.includes(role)) return res.status(400).json({ ok: false, error: 'invalid_role' });
  
  // Para demo: password opcional "demo123" o sin password
  if (password && password !== 'demo123') {
    return res.status(401).json({ ok: false, error: 'invalid_credentials' });
  }
  
  const token = generateToken();
  db.data.sessions ||= {};
  db.data.sessions[token] = { id, role, loginAt: Date.now() };
  await db.write();
  
  res.json({ ok: true, token, role, id });
});

// API: Logout
app.post('/api/logout', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token && db.data.sessions?.[token]) {
    delete db.data.sessions[token];
    await db.write();
  }
  res.json({ ok: true });
});

// API: Registrar/actualizar driver con emergencyContact
app.post('/api/drivers/register', async (req, res) => {
  const { driverId, name, phone, emergencyContact } = req.body || {};
  if (!driverId) return res.status(400).json({ ok: false, error: 'missing_driverId' });
  db.data.drivers ||= {};
  db.data.drivers[driverId] = { driverId, name, phone, emergencyContact, updatedAt: Date.now() };
  await saveDrivers();
  res.json({ ok: true, driver: db.data.drivers[driverId] });
});

// API: Obtener info de driver
app.get('/api/drivers/:driverId', (req, res) => {
  const driver = db.data.drivers?.[req.params.driverId];
  if (!driver) return res.status(404).json({ ok: false, error: 'not_found' });
  res.json(driver);
});

// API: Create ride
app.post('/api/rides', async (req, res) => {
  const { pickupText = '', destText = '', phone = '', name = '', emergencyContact = '' } = req.body || {};
  const rideId = newRideId();
  const ride = {
    rideId,
    status: 'requested',
    createdAt: Date.now(),
    pickupText, destText, phone, name,
    emergencyContact, // --- NUEVA FUNCIÓN DE SEGURIDAD ---
    driverId: null,
    lastLocation: null,
    etaSec: null,
    pickupCoord: null, // {lat,lng}
    destCoord: null,
  };
  rides.set(rideId, ride);
  // Try geocoding  // 🎯 Async geocode via Nominatim - MEJORADO para cualquier ciudad
  (async () => {
    try {
      if (pickupText) {
        // 🎯 Buscar sin restricción de ciudad primero
        let u = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(pickupText)}&countrycodes=ar`;
        let r = await fetch(u, { headers: { 'User-Agent': 'TuRemis/1.0' } });
        let j = await r.json();
        
        // Si no encuentra, intenta con Bahía Blanca
        if (!j || !j[0]) {
          u = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(pickupText + ', Bahía Blanca, Buenos Aires, Argentina')}`;
          r = await fetch(u, { headers: { 'User-Agent': 'TuRemis/1.0' } });
          j = await r.json();
        }
        
        if (j && j[0]) {
          ride.pickupCoord = { lat: Number(j[0].lat), lng: Number(j[0].lon) };
          console.log(`✅ Geocoded pickup: ${pickupText} -> ${ride.pickupCoord.lat}, ${ride.pickupCoord.lng}`);
        }
      }
      if (destText) {
        // 🎯 Buscar sin restricción de ciudad primero
        let u = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(destText)}&countrycodes=ar`;
        let r = await fetch(u, { headers: { 'User-Agent': 'TuRemis/1.0' } });
        let j = await r.json();
        
        // Si no encuentra, intenta con Bahía Blanca
        if (!j || !j[0]) {
          u = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(destText + ', Bahía Blanca, Buenos Aires, Argentina')}`;
          r = await fetch(u, { headers: { 'User-Agent': 'TuRemis/1.0' } });
          j = await r.json();
        }
        
        if (j && j[0]) {
          ride.destCoord = { lat: Number(j[0].lat), lng: Number(j[0].lon) };
          console.log(`✅ Geocoded destino: ${destText} -> ${ride.destCoord.lat}, ${ride.destCoord.lng}`);
        }
      }
      await saveRides();
      // notify client room about coords update
      io.to(`ride:${rideId}`).emit('ride_update', { type: 'route', rideId, pickupCoord: ride.pickupCoord, destCoord: ride.destCoord });
    } catch (e) {
      console.error('Error geocoding:', e);
    }
  })();
  await saveRides();
  res.json({ ok: true, rideId, trackUrl: `${req.protocol}://${req.get('host')}/client.html?rideId=${rideId}` });

  // Optional Telegram notification
  const msg = `🛺 Nuevo pedido${name?` de ${name}`:''}\n📍 Desde: ${pickupText||'-'}\n➡️ Hasta: ${destText||'-'}\n📞 Tel: ${phone||'-'}\n🔗 Seguimiento: ${req.protocol}://${req.get('host')}/client.html?rideId=${rideId}`;
  notifyDispatcher(msg);

  // Broadcast offer to all online drivers
  const offer = sanitizeRide(ride);
  io.to('drivers').emit('ride_offer', offer);
  // Push notify all subscribed drivers
  sendPushAll({ type: 'ride_offer', name, pickupText, destText, rideId });
});

// API: List rides (simple)
app.get('/api/rides', (_req, res) => {
  const list = Array.from(rides.values()).sort((a,b) => b.createdAt - a.createdAt);
  res.json(list.map(sanitizeRide));
});

// API: Get ride by id
app.get('/api/rides/:rideId', (req, res) => {
  const ride = rides.get(req.params.rideId);
  if (!ride) return res.status(404).json({ ok: false, error: 'not_found' });
  res.json(sanitizeRide(ride));
});

// Accept ride (first driver wins) - ensure body parsed
app.post('/api/rides/:rideId/accept', async (req, res) => {
  const ride = rides.get(req.params.rideId);
  if (!ride) return res.status(404).json({ ok: false, error: 'not_found' });
  const { driverId, driverPhone, driverLocation } = req.body || {};
  if (!driverId) return res.status(400).json({ ok: false, error: 'missing_driverId' });
  if (ride.status !== 'requested') {
    return res.status(409).json({ ok: false, error: 'already_taken', driverId: ride.driverId });
  }
  ride.driverId = driverId;
  ride.status = 'assigned';
  if (driverPhone) ride.driverPhone = driverPhone;
  
  // 🎯 MEJORA: Guardar ubicación inicial del conductor
  if (driverLocation && isFinite(driverLocation.lat) && isFinite(driverLocation.lng)) {
    ride.lastLocation = {
      lat: driverLocation.lat,
      lng: driverLocation.lng,
      accuracy: driverLocation.accuracy || null,
      timestamp: Date.now()
    };
    lastLocationByDriver.set(driverId, ride.lastLocation);
  }
  
  await saveRides();
  io.to(`ride:${ride.rideId}`).emit('ride_update', { type: 'assigned', rideId: ride.rideId, driverId });
  io.to('drivers').emit('ride_taken', { rideId: ride.rideId, driverId });
  // Push notify: ride assigned
  const { name, pickupText, destText } = ride;
  sendPushAll({ type: 'ride_assigned', rideId: ride.rideId, driverId, name, pickupText, destText });
  res.json({ ok: true, rideId: ride.rideId, driverId });
});

// API: Assign driver
app.post('/api/rides/:rideId/assign', async (req, res) => {
  const ride = rides.get(req.params.rideId);
  if (!ride) return res.status(404).json({ ok: false, error: 'not_found' });
  const { driverId, driverPhone } = req.body || {};
  if (!driverId) return res.status(400).json({ ok: false, error: 'missing_driverId' });
  ride.driverId = driverId;
  if (ride.status === 'requested') ride.status = 'assigned';
  if (driverPhone) ride.driverPhone = driverPhone;
  io.to(`ride:${ride.rideId}`).emit('ride_update', { type: 'assigned', rideId: ride.rideId, driverId });
  await saveRides();
  res.json({ ok: true, rideId: ride.rideId, driverId, driverPhone: ride.driverPhone || null });
});

// API: Update status and ETA
app.post('/api/rides/:rideId/status', async (req, res) => {
  const ride = rides.get(req.params.rideId);
  if (!ride) return res.status(404).json({ ok: false, error: 'not_found' });
  const { status, etaSec } = req.body || {};
  if (etaSec != null) ride.etaSec = Number(etaSec);
  if (status) ride.status = status;
  await saveRides();
  io.to(`ride:${ride.rideId}`).emit('ride_update', { type: 'status', rideId: ride.rideId, status: ride.status, etaSec: ride.etaSec });
  // Push notify client when driver arrived
  if (status === 'arrived') {
    const { name, pickupText, destText } = ride;
    sendPushAll({ type: 'ride_arrived', rideId: ride.rideId, name, pickupText, destText });
  }
  res.json({ ok: true });
});

// API: last known location by driver
app.get('/api/lastLocation', (req, res) => {
  const { driverId } = req.query;
  if (!driverId) return res.status(400).json({ ok: false, error: 'missing_driverId' });
  const loc = lastLocationByDriver.get(driverId) || null;
  res.json(loc);
});

// API: drivers online (simple list)
app.get('/api/drivers/online', (_req, res) => {
  const items = Array.from(onlineDrivers.keys()).sort();
  res.json({ drivers: items });
});

// API: route via OSRM (public demo server) - ahora con duration
// Query: /api/route?from=LAT,LNG&to=LAT,LNG
app.get('/api/route', async (req, res) => {
  try {
    const from = String(req.query.from||'');
    const to = String(req.query.to||'');
    const [flat, flng] = from.split(',').map(Number);
    const [tlat, tlng] = to.split(',').map(Number);
    if (!isFinite(flat)||!isFinite(flng)||!isFinite(tlat)||!isFinite(tlng)) {
      return res.status(400).json({ ok:false, error:'bad_coords' });
    }
    const url = `https://router.project-osrm.org/route/v1/driving/${flng},${flat};${tlng},${tlat}?overview=full&geometries=geojson`;
    const r = await fetch(url);
    const j = await r.json();
    const coords = j?.routes?.[0]?.geometry?.coordinates || [];
    const duration = j?.routes?.[0]?.duration || 0; // segundos
    // OSRM gives [lng,lat] pairs; convert to {lat,lng}
    const line = coords.map(([lng,lat]) => ({ lat, lng }));
    res.json({ ok:true, line, duration, etaMin: Math.ceil(duration / 60) });
  } catch (e) {
    res.status(500).json({ ok:false });
  }
});

// --- NUEVA FUNCIÓN DE SEGURIDAD: Alertas API ---
// Listar alertas activas
app.get('/api/alerts/active', (_req, res) => {
  const list = Array.from(alerts.values())
    .filter(a => a.status === 'active')
    .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json({ ok: true, alerts: list });
});

// Listar todas las alertas
app.get('/api/alerts', (_req, res) => {
  const list = Array.from(alerts.values()).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json({ ok: true, alerts: list });
});

// Obtener alerta por ID
app.get('/api/alerts/:alertId', (req, res) => {
  const alert = alerts.get(req.params.alertId);
  if (!alert) return res.status(404).json({ ok: false, error: 'not_found' });
  res.json(alert);
});

// Resolver alerta (marcar como resuelta)
app.post('/api/alerts/:alertId/resolve', async (req, res) => {
  const alert = alerts.get(req.params.alertId);
  if (!alert) return res.status(404).json({ ok: false, error: 'not_found' });
  alert.status = 'resolved';
  alert.resolvedAt = new Date().toISOString();
  await saveAlerts();
  io.emit('alert_resolved', { alertId: alert.id });
  res.json({ ok: true, alert });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
