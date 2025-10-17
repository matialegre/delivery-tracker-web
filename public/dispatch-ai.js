// 🧠 Sistema de Dispatch Automático con IA Simple

class DispatchAI {
  constructor() {
    this.algorithm = 'nearest'; // 'nearest', 'rating', 'balanced'
  }

  // Calcular distancia Haversine
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Encontrar conductor más cercano
  findNearestDriver(pickup, availableDrivers) {
    if (!availableDrivers || availableDrivers.length === 0) return null;

    let nearest = null;
    let minDistance = Infinity;

    availableDrivers.forEach(driver => {
      if (driver.lat && driver.lng) {
        const distance = this.calculateDistance(
          pickup.lat, pickup.lng,
          driver.lat, driver.lng
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearest = { ...driver, distance };
        }
      }
    });

    return nearest;
  }

  // Encontrar conductor por mejor rating
  findTopRatedDriver(availableDrivers) {
    if (!availableDrivers || availableDrivers.length === 0) return null;

    return availableDrivers.reduce((best, current) => {
      const currentRating = current.rating || 4.0;
      const bestRating = best.rating || 4.0;
      return currentRating > bestRating ? current : best;
    });
  }

  // Sistema balanceado: considera distancia + rating
  findBalancedDriver(pickup, availableDrivers) {
    if (!availableDrivers || availableDrivers.length === 0) return null;

    const driversWithScore = availableDrivers.map(driver => {
      const distance = driver.lat && driver.lng ?
        this.calculateDistance(pickup.lat, pickup.lng, driver.lat, driver.lng) : 999;
      
      const rating = driver.rating || 4.0;
      
      // Score: 70% distancia, 30% rating
      // Normalizar distancia (menor es mejor) y rating (mayor es mejor)
      const distanceScore = Math.max(0, 10 - distance) / 10; // 0-1
      const ratingScore = rating / 5; // 0-1
      
      const finalScore = (distanceScore * 0.7) + (ratingScore * 0.3);
      
      return { ...driver, distance, score: finalScore };
    });

    return driversWithScore.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  }

  // Método principal: seleccionar conductor según algoritmo
  selectDriver(pickup, availableDrivers, algorithm = this.algorithm) {
    console.log(`🧠 Dispatch AI: Seleccionando conductor (${algorithm})...`);
    console.log(`   📍 Pickup: ${pickup.lat}, ${pickup.lng}`);
    console.log(`   🚕 Conductores disponibles: ${availableDrivers.length}`);

    let selected = null;

    switch (algorithm) {
      case 'nearest':
        selected = this.findNearestDriver(pickup, availableDrivers);
        break;
      case 'rating':
        selected = this.findTopRatedDriver(availableDrivers);
        break;
      case 'balanced':
        selected = this.findBalancedDriver(pickup, availableDrivers);
        break;
      default:
        selected = this.findNearestDriver(pickup, availableDrivers);
    }

    if (selected) {
      console.log(`   ✅ Seleccionado: ${selected.driverId}`);
      console.log(`   📏 Distancia: ${selected.distance?.toFixed(2)} km`);
      console.log(`   ⭐ Rating: ${selected.rating || 'N/A'}`);
    } else {
      console.log(`   ❌ No se encontró conductor disponible`);
    }

    return selected;
  }

  // Estimar ETA basado en distancia
  estimateETA(distance) {
    // Velocidad promedio urbana: 30 km/h
    const avgSpeed = 30;
    const hours = distance / avgSpeed;
    const minutes = Math.round(hours * 60);
    return Math.max(1, minutes); // Mínimo 1 minuto
  }

  // Analizar eficiencia del sistema
  analyzePerformance(assignments) {
    const stats = {
      totalAssignments: assignments.length,
      avgDistance: 0,
      avgWaitTime: 0,
      successRate: 0
    };

    if (assignments.length === 0) return stats;

    const distances = assignments.map(a => a.distance || 0);
    const waitTimes = assignments.map(a => a.waitTime || 0);
    const successful = assignments.filter(a => a.completed).length;

    stats.avgDistance = (distances.reduce((sum, d) => sum + d, 0) / distances.length).toFixed(2);
    stats.avgWaitTime = (waitTimes.reduce((sum, w) => sum + w, 0) / waitTimes.length).toFixed(1);
    stats.successRate = ((successful / assignments.length) * 100).toFixed(1);

    return stats;
  }
}

// Instancia global
window.dispatchAI = new DispatchAI();

// Export para Node.js si es necesario
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DispatchAI;
}
