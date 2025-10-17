// 📳 Sistema de Feedback Háptico Contextual

class HapticsManager {
  constructor() {
    this.supported = 'vibrate' in navigator;
  }

  // Vibración ligera para clicks
  light() {
    if (this.supported) {
      navigator.vibrate(10);
    }
  }

  // Vibración media para acciones
  medium() {
    if (this.supported) {
      navigator.vibrate(30);
    }
  }

  // Vibración fuerte para éxitos
  heavy() {
    if (this.supported) {
      navigator.vibrate(50);
    }
  }

  // Patrón de éxito
  success() {
    if (this.supported) {
      navigator.vibrate([50, 50, 100]);
    }
  }

  // Patrón de error
  error() {
    if (this.supported) {
      navigator.vibrate([100, 50, 100, 50, 100]);
    }
  }

  // Patrón de alerta/warning
  warning() {
    if (this.supported) {
      navigator.vibrate([30, 30, 30, 30, 100]);
    }
  }

  // Patrón de notificación
  notification() {
    if (this.supported) {
      navigator.vibrate([30, 50, 30]);
    }
  }

  // Patrón de llegada (conductor llegó)
  arrival() {
    if (this.supported) {
      navigator.vibrate([100, 100, 100, 100, 200]);
    }
  }

  // Patrón de nuevo viaje
  newRide() {
    if (this.supported) {
      navigator.vibrate([50, 100, 50, 100, 50, 100, 200]);
    }
  }
}

// Instancia global
window.haptics = new HapticsManager();

// Auto-agregar feedback a todos los botones
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('button, a, .clickable').forEach(el => {
    el.addEventListener('click', () => {
      if (!el.hasAttribute('data-no-haptic')) {
        window.haptics.light();
      }
    });
  });
});
