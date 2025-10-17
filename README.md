# 🚕 TuRemis - Sistema Premium de Remises

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-18.x-green.svg)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

> Sistema completo de gestión de remises con seguimiento en tiempo real, chat, rating, historial y más. Diseñado con las últimas tecnologías web y UX premium tipo Uber.
- **Frontend**: Leaflet + OpenStreetMap + Bootstrap 5
- **Tiempo Real**: WebSockets (Socket.IO)
- **Notificaciones**: Web Push, Twilio (SMS/WhatsApp), Telegram
- **PWA**: Service Worker + Manifest

## ✨ Nuevas Funciones de Seguridad

### 🚨 Sistema de Alertas en Tiempo Real
- **Tipos de alertas**:
  - `passenger_suspicious`: Pasajero con comportamiento sospechoso
  - `driver_suspicious`: Conductor sospechoso detectado
  - `path_suspicious`: Ruta o desvío sospechoso
- **Notificaciones automáticas** a:
  - Contactos de emergencia (conductor y pasajero)
  - Panel de despacho central
  - Telegram / SMS (Twilio)
- **Persistencia**: Todas las alertas se guardan en `db.json`

### 👤 Contactos de Emergencia
- Conductores y pasajeros pueden registrar un contacto de emergencia
- Notificación automática en caso de alerta
- Almacenamiento seguro en base de datos

### 📍 ETA Dinámico
- Cálculo automático de tiempo estimado de llegada
- Actualización en tiempo real cada 15 segundos
- Usa OSRM (Open Source Routing Machine)
- Muestra ETA en vista de cliente y conductor

### 🗺️ Mapa de Monitoreo Central (Dispatch)
- Visualización de todos los vehículos en tiempo real
- Marcadores rojos parpadeantes para vehículos con alertas activas
- Lista lateral de alertas con opción de resolución
- Zoom automático al hacer clic en una alerta

### 🔐 Autenticación Básica
- Login simple con roles: `client`, `driver`, `dispatcher`
- Tokens de sesión persistentes
- Password demo: `demo123` (o sin password)

## 📋 Requisitos
- Node.js 18+

## Instalación
```bash
npm install
```

## Ejecutar
```bash
npm run start
```
Luego abre: http://localhost:3000/

## Cómo probar (mismo dispositivo)
1. Abrí `http://localhost:3000/`.
2. En "Conductor" elegí un ID (por ej. `demo`) y abrí la vista Driver.
3. Tocá "Iniciar" para compartir ubicación.
4. Volvé a inicio, abrí la vista Cliente con el mismo ID y vas a ver el marcador moverse.

## Probar desde el celular (misma red)
- Asegurate que la PC y el celular estén en la misma red WiFi.
- Descubrí la IP local de tu PC (ej: `192.168.0.10`).
- Desde el celular abrí `http://192.168.0.10:3000/`.

### Importante sobre HTTPS y GPS
- Los navegadores móviles suelen exigir HTTPS para usar geolocalización precisa cuando NO es `localhost`.
- Si accedés por IP local (HTTP), en Android puede funcionar, pero iOS normalmente bloqueará la geolocalización.
- Recomendado: usar un túnel HTTPS (ejemplo: [ngrok](https://ngrok.com/)).

## 🗺️ Detalles del Mapa

### Cliente (Leaflet)
- Marcador del conductor con flecha de dirección
- Círculo de precisión GPS
- Polilínea del recorrido
- Marcadores de pickup y destino
- Ruta sugerida (OSRM)
- ETA dinámico actualizado cada 15s
- Botón de alerta de seguridad

### Conductor (Leaflet)
- Mapa de la ruta asignada
- Simulación OSRM o GPS real
- Marcadores de origen y destino
- Botones de alerta de seguridad

### Despacho (Leaflet)
- Vista de todos los vehículos en tiempo real
- Marcadores azules: conductores normales
- Marcadores rojos parpadeantes: vehículos con alertas
- Círculos de precisión GPS
- Zoom automático a alertas

#### Ejemplo con ngrok
1. Instala ngrok.
2. Ejecutá en otra terminal:
   ```bash
   ngrok http 3000
   ```
3. Usá la URL `https://...ngrok.io` en el celular tanto para Driver como para Cliente.

## Google Maps (opcional)
Si preferís Google Maps, necesitás una API key con facturación habilitada. Cambiá el `public/client.html` para cargar Google en lugar de Leaflet.

1. Creá un proyecto en Google Cloud Console y habilitá "Maps JavaScript API".
2. Creá una credencial de tipo "API key" y restringila por dominio si corresponde.
3. Editá `public/client.html` y reemplazá `YOUR_GOOGLE_MAPS_API_KEY` en la línea del script:
   ```html
   <script async defer src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&v=weekly&callback=initMap"></script>
   ```
4. Guardá y recargá el navegador.

Notas:
- Google Maps requiere facturación activa, pero ofrece créditos mensuales gratuitos.
- Si preferís evitar API de pago, podés volver a Leaflet + OpenStreetMap (se dejó implementado previamente) o usar un proveedor como MapTiler.

## Rooms por driverId
- Cada `driverId` crea una "sala" (`driver:<id>`). El driver publica `location` y los clientes conectados a esa sala la reciben.

## 🆕 Endpoints de API Nuevos

### Autenticación
```
POST /api/login
Body: { "id": "user123", "role": "driver", "password": "demo123" }
Response: { "ok": true, "token": "...", "role": "driver", "id": "user123" }

POST /api/logout
Headers: { "Authorization": "Bearer <token>" }
```

### Conductores
```
POST /api/drivers/register
Body: { "driverId": "taxi-1", "name": "Juan", "emergencyContact": "+549.." }

GET /api/drivers/:driverId
Response: { "driverId": "taxi-1", "emergencyContact": "+549...", ... }
```

### Alertas
```
GET /api/alerts/active
Response: { "ok": true, "alerts": [...] }

GET /api/alerts
Response: { "ok": true, "alerts": [...] }

GET /api/alerts/:alertId

POST /api/alerts/:alertId/resolve
Response: { "ok": true, "alert": {...} }
```

### Rutas (actualizado)
```
GET /api/route?from=LAT,LNG&to=LAT,LNG
Response: { "ok": true, "line": [...], "duration": 300, "etaMin": 5 }
```

## 🔌 Eventos Socket.IO Nuevos

### Cliente → Servidor
```javascript
// Enviar alerta de seguridad
socket.emit('suspicious_activity', {
  rideId: 'r001',
  type: 'passenger_suspicious', // o 'driver_suspicious', 'path_suspicious'
  description: 'Descripción opcional'
});
```

### Servidor → Cliente
```javascript
// Recibir alerta global (todos los conductores)
socket.on('global_alert', (alert) => {
  // { id, rideId, type, driverId, lastCoord, timestamp, status }
});

// Alerta resuelta
socket.on('alert_resolved', ({ alertId }) => {
  // ...
});
```

## 🧪 Guía de Pruebas Paso a Paso

### Escenario 1: Flujo Completo con Seguridad

1. **Registrar Conductor**:
   ```bash
   # Abrir http://localhost:3000/driver.html
   # Ingresar ID: "taxi-ramallo-1"
   # Ingresar contacto de emergencia: "+5491155555555"
   # Click en "Guardar Perfil"
   # Click en "Estoy Disponible para Viajes"
   ```

2. **Crear Viaje con Contacto de Emergencia**:
   ```bash
   # Abrir http://localhost:3000/request.html
   # Llenar: Nombre, Desde, Hasta, Teléfono
   # IMPORTANTE: Ingresar "Contacto de emergencia"
   # Click "Solicitar viaje"
   ```

3. **Conductor Acepta Viaje**:
   ```bash
   # En driver.html aparecerá popup con oferta
   # Click "Aceptar Viaje" (15s para aceptar)
   # El mapa mostrará la ruta al pickup
   # GPS real o simulación OSRM iniciará
   ```

4. **Cliente Monitorea con ETA Dinámico**:
   ```bash
   # Abrir el link de seguimiento (o client.html?rideId=...)
   # Ver ETA actualizándose cada 15s
   # Ver ubicación del conductor en tiempo real
   # Botón "Alerta de Seguridad" disponible
   ```

5. **Enviar Alerta de Seguridad**:
   ```bash
   # Como CONDUCTOR: Click en botones "Pasajero Sospechoso", "Conductor Sospechoso" o "Ruta Sospechosa"
   # O como CLIENTE: Click en "Alerta de Seguridad"
   # Descripción opcional
   # Alerta se envía a:
   #   - Despacho (dispatch.html)
   #   - Contactos de emergencia vía SMS/Telegram
   #   - Todos los conductores conectados
   ```

6. **Monitorear en Despacho**:
   ```bash
   # Abrir http://localhost:3000/dispatch.html
   # Ver mapa con todos los vehículos
   # Vehículo con alerta aparece en ROJO PARPADEANTE
   # Lista de alertas activas en panel inferior
   # Click en alerta para zoom en mapa
   # Click "Resolver" para marcar como atendida
   ```

### Escenario 2: Probar Notificaciones Externas

1. **Configurar Variables de Entorno**:
   ```bash
   cp .env.example .env
   # Editar .env con credenciales reales de Twilio/Telegram
   ```

2. **Reiniciar Servidor**:
   ```bash
   npm run start
   ```

3. **Enviar Alerta de Prueba**:
   ```bash
   # Seguir pasos del Escenario 1
   # Al enviar alerta, verificar:
   #   - SMS recibido en contacto de emergencia
   #   - Mensaje en canal de Telegram
   ```

### Escenario 3: Múltiples Conductores y Alertas

1. **Abrir 3 ventanas de conductor**:
   ```
   http://localhost:3000/driver.html?driverId=taxi-1
   http://localhost:3000/driver.html?driverId=taxi-2
   http://localhost:3000/driver.html?driverId=taxi-3
   ```

2. **Marcar todos como "Disponibles"**

3. **Crear viaje y ver ofertas en todos**

4. **Enviar alerta desde taxi-1**:
   - Verificar que taxi-2 y taxi-3 reciben notificación
   - Verificar que dispatch.html muestra taxi-1 en rojo

## 📊 Estructura de la Base de Datos (db.json)

```json
{
  "rides": {
    "r001": {
      "rideId": "r001",
      "status": "assigned",
      "pickupText": "Plaza Mitre",
      "destText": "Terminal",
      "phone": "+5491155555555",
      "emergencyContact": "+5491166666666",
      "driverId": "taxi-1",
      "etaSec": 300,
      "lastLocation": { "lat": -33.48, "lng": -60.00 }
    }
  },
  "drivers": {
    "taxi-1": {
      "driverId": "taxi-1",
      "name": "Juan Pérez",
      "phone": "+5491155555555",
      "emergencyContact": "+5491177777777"
    }
  },
  "alerts": {
    "alert001": {
      "id": "alert001",
      "rideId": "r001",
      "type": "passenger_suspicious",
      "description": "Comportamiento agresivo",
      "timestamp": "2025-01-16T22:30:00.000Z",
      "driverId": "taxi-1",
      "lastCoord": { "lat": -33.48, "lng": -60.00 },
      "status": "active"
    }
  },
  "sessions": {
    "token123": {
      "id": "taxi-1",
      "role": "driver",
      "loginAt": 1705444200000
    }
  },
  "pushSubs": [...],
  "lastLocationByDriver": {...}
}
```

## ⚠️ Consideraciones de Seguridad

- **Autenticación**: Implementación básica para demo. En producción usar JWT, bcrypt, y DB real.
- **Contactos de Emergencia**: Validar formato de teléfono en backend.
- **Rate Limiting**: Agregar límite de alertas por usuario/tiempo para evitar spam.
- **HTTPS**: Obligatorio en producción para geolocalización móvil.
- **Sanitización**: Validar y sanitizar todos los inputs del usuario.

## 🚧 Limitaciones y Próximos Pasos

### Implementado ✅
- ✅ Sistema de alertas de seguridad
- ✅ Contactos de emergencia
- ✅ ETA dinámico
- ✅ Mapa de monitoreo central
- ✅ Autenticación básica
- ✅ Notificaciones externas (Twilio/Telegram)
- ✅ PWA con Service Worker

### Por Implementar 🔜
- Historial de viajes y métricas
- Autenticación robusta (JWT + bcrypt)
- Base de datos SQL/MongoDB
- Panel de administración avanzado
- Grabación de rutas para evidencia
- Integración con servicios de emergencia (911)
- Geofencing y zonas seguras

## 📦 Archivos Modificados/Creados

### Backend
- ✅ **`server.js`**: 
  - Sistema de alertas con evento `suspicious_activity`
  - Endpoints `/api/login`, `/api/logout`, `/api/drivers/register`, `/api/alerts/*`
  - Función `sendSafetyAlert()` para notificaciones externas
  - Middleware de autenticación `authMiddleware()`
  - Persistencia extendida en `db.json`

### Frontend
- ✅ **`public/driver.html`**:
  - Campo de contacto de emergencia
  - Botones de alerta: "Pasajero Sospechoso", "Conductor Sospechoso", "Ruta Sospechosa"
  - Listener para `global_alert` con notificación visual y vibración
  - Integración con `/api/drivers/register`

- ✅ **`public/client.html`**:
  - Botón "Alerta de Seguridad"
  - ETA dinámico con cálculo cada 15s via `/api/route`
  - Listener para `suspicious_activity` con alertas visuales
  - Tracking de coordenadas pickup/dest para cálculo de ETA

- ✅ **`public/dispatch.html`**:
  - Mapa central con Leaflet mostrando todos los vehículos
  - Marcadores rojos parpadeantes para vehículos con alertas
  - Panel de alertas activas con botón "Resolver"
  - Socket.IO listeners: `global_alert`, `alert_resolved`
  - Polling cada 5s de `/api/drivers` y cada 10s de `/api/alerts/active`

### Configuración
- ✅ **`.env.example`**: Variables de entorno para Twilio, Telegram, Web Push

### Documentación
- ✅ **`README.md`**: Documentación completa con guías de prueba

## 🎯 Resumen de Funcionalidades

| Función | Backend | Frontend | Notificaciones |
|---------|---------|----------|----------------|
| Alertas de Seguridad | ✅ | ✅ | ✅ |
| Contactos de Emergencia | ✅ | ✅ | ✅ |
| ETA Dinámico | ✅ | ✅ | - |
| Mapa Central Despacho | ✅ | ✅ | - |
| Autenticación Básica | ✅ | - | - |
| Web Push | ✅ | ✅ | ✅ |
| Twilio SMS/WhatsApp | ✅ | - | ✅ |
| Telegram Bot | ✅ | - | ✅ |

---

**Desarrollado con ❤️ para mejorar la seguridad en servicios de transporte**
