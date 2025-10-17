// Simple service worker for TuRemis
// version: v2 (2025-10-06)
const CACHE = 'turemis-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/request.html',
  '/driver.html',
  '/client.html',
  '/dispatch.html',
  '/dashboard.html',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => (k===CACHE)?null:caches.delete(k))))
      .then(()=> self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  e.respondWith(
    caches.match(request).then(res => res || fetch(request).then(net => {
      const copy = net.clone();
      caches.open(CACHE).then(c => c.put(request, copy)).catch(()=>{});
      return net;
    }).catch(()=> res || new Response('Offline', { status: 503 })))
  );
});

// Web Push: show offer notifications
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data?.json?.() || JSON.parse(event.data?.text?.()||'{}'); } catch {}
  let title = 'Notificación';
  let body = data?.message || '';
  let url = '/';
  if (data?.type === 'ride_offer') {
    title = 'Nuevo pedido de remís';
    body = `${data.name||'Cliente'}\nDesde: ${data.pickupText||'-'}\nHasta: ${data.destText||'-'}`;
    url = data?.rideId ? `/driver.html?rideId=${data.rideId}` : '/driver.html';
  } else if (data?.type === 'ride_assigned') {
    title = 'Tu viaje fue asignado';
    body = `${data.name||'Chofer asignado'}\nDesde: ${data.pickupText||'-'}\nHasta: ${data.destText||'-'}`;
    url = data?.rideId ? `/client.html?rideId=${data.rideId}` : '/client.html';
  } else if (data?.type === 'ride_arrived') {
    title = 'Tu remís llegó';
    body = `${data.name||'Chofer'} ya está en el punto de partida.`;
    url = data?.rideId ? `/client.html?rideId=${data.rideId}` : '/client.html';
  }
  const tag = data?.rideId || 'turemis';
  const vibrate = (data?.type === 'ride_offer' || data?.type === 'ride_assigned' || data?.type === 'ride_arrived')
    ? [200, 100, 200] : undefined;
  event.waitUntil(self.registration.showNotification(title, {
    body,
    tag,
    icon: '/favicon.ico',
    vibrate,
    data: { url }
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/driver.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) { c.navigate(targetUrl); return c.focus(); }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
