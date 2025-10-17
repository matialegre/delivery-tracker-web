// 🎵 Sistema de Sonidos Contextual Profesional

class SoundManager {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
  }

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  createTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!this.enabled) return;
    this.init();

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Click suave
  click() {
    this.createTone(800, 0.05, 'sine', 0.1);
  }

  // Éxito - tono ascendente
  success() {
    this.createTone(523, 0.1); // C5
    setTimeout(() => this.createTone(659, 0.15), 100); // E5
    setTimeout(() => this.createTone(784, 0.2), 200); // G5
  }

  // Error - tono descendente
  error() {
    this.createTone(400, 0.1);
    setTimeout(() => this.createTone(300, 0.15), 100);
    setTimeout(() => this.createTone(200, 0.2), 200);
  }

  // Notificación - dos tonos
  notification() {
    this.createTone(880, 0.15);
    setTimeout(() => this.createTone(1047, 0.15), 150);
  }

  // Nuevo viaje - urgente
  newRide() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.createTone(1000, 0.15);
        setTimeout(() => this.createTone(1200, 0.15), 150);
      }, i * 400);
    }
  }

  // Conductor llegó - celebración
  arrival() {
    const notes = [523, 587, 659, 698, 784, 880];
    notes.forEach((freq, i) => {
      setTimeout(() => this.createTone(freq, 0.1), i * 80);
    });
  }

  // Viaje completado - fanfarria
  completed() {
    const melody = [
      { freq: 523, dur: 0.15 },
      { freq: 659, dur: 0.15 },
      { freq: 784, dur: 0.15 },
      { freq: 1047, dur: 0.3 }
    ];
    
    melody.forEach((note, i) => {
      setTimeout(() => this.createTone(note.freq, note.dur), i * 150);
    });
  }

  // Mensaje de chat
  message() {
    this.createTone(800, 0.08);
    setTimeout(() => this.createTone(1000, 0.08), 80);
  }

  // Advertencia
  warning() {
    for (let i = 0; i < 2; i++) {
      setTimeout(() => this.createTone(600, 0.2), i * 300);
    }
  }

  // Toggle on/off
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('sounds_enabled', this.enabled);
    return this.enabled;
  }

  // Cargar preferencia
  loadPreference() {
    const saved = localStorage.getItem('sounds_enabled');
    if (saved !== null) {
      this.enabled = saved === 'true';
    }
  }
}

// Instancia global
window.sounds = new SoundManager();
window.sounds.loadPreference();
