// 📚 Sistema de Tutorial/Onboarding Interactivo

class TutorialManager {
  constructor() {
    this.currentStep = 0;
    this.steps = [];
    this.overlay = null;
    this.spotlight = null;
  }

  // Tutorial para REQUEST (cliente pidiendo viaje)
  static requestTutorial = [
    {
      target: '#pickupText',
      title: '📍 Origen',
      text: 'Ingresá tu ubicación o usá el botón GPS para detectarla automáticamente.',
      position: 'bottom'
    },
    {
      target: '#destText',
      title: '🎯 Destino',
      text: 'Elegí tu destino de las sugerencias para calcular el precio estimado.',
      position: 'bottom'
    },
    {
      target: '#priceEstimate',
      title: '💰 Precio',
      text: 'El precio se calcula automáticamente según la distancia del viaje.',
      position: 'top'
    },
    {
      target: '#favoritesList',
      title: '⭐ Favoritos',
      text: 'Guardá tus lugares frecuentes para acceso rápido.',
      position: 'bottom'
    }
  ];

  // Tutorial para DRIVER (conductor)
  static driverTutorial = [
    {
      target: '#statusDisplay',
      title: '🟢 Estado',
      text: 'Activá "Estoy Disponible" para empezar a recibir pedidos.',
      position: 'bottom'
    },
    {
      target: '#dailyEarnings',
      title: '💰 Ganancias',
      text: 'Seguí tus ganancias del día en tiempo real.',
      position: 'bottom'
    },
    {
      target: '#chatWithClient',
      title: '💬 Chat',
      text: 'Comunicá con el cliente durante el viaje.',
      position: 'top'
    }
  ];

  start(steps) {
    // Verificar si ya vio el tutorial
    const tutorialKey = `tutorial_${steps[0]?.target || 'default'}_seen`;
    if (localStorage.getItem(tutorialKey)) {
      return; // Ya lo vio
    }

    this.steps = steps;
    this.currentStep = 0;
    this.createOverlay();
    this.showStep(0);
  }

  createOverlay() {
    // Overlay oscuro
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      z-index: 99998;
      backdrop-filter: blur(2px);
    `;

    // Spotlight (área destacada)
    this.spotlight = document.createElement('div');
    this.spotlight.style.cssText = `
      position: fixed;
      border: 3px solid #10b981;
      border-radius: 12px;
      box-shadow: 0 0 0 9999px rgba(0,0,0,0.7), 0 0 20px rgba(16, 185, 129, 0.5);
      z-index: 99999;
      pointer-events: none;
      transition: all 0.3s;
    `;

    document.body.appendChild(this.overlay);
    document.body.appendChild(this.spotlight);
  }

  showStep(index) {
    if (index >= this.steps.length) {
      this.finish();
      return;
    }

    const step = this.steps[index];
    const target = document.querySelector(step.target);

    if (!target) {
      this.next();
      return;
    }

    // Posicionar spotlight
    const rect = target.getBoundingClientRect();
    this.spotlight.style.top = (rect.top - 8) + 'px';
    this.spotlight.style.left = (rect.left - 8) + 'px';
    this.spotlight.style.width = (rect.width + 16) + 'px';
    this.spotlight.style.height = (rect.height + 16) + 'px';

    // Crear tooltip
    this.showTooltip(step, rect);
  }

  showTooltip(step, targetRect) {
    // Remover tooltip anterior
    document.querySelectorAll('.tutorial-tooltip').forEach(el => el.remove());

    const tooltip = document.createElement('div');
    tooltip.className = 'tutorial-tooltip';
    tooltip.style.cssText = `
      position: fixed;
      background: #fff;
      border-radius: 16px;
      padding: 24px;
      max-width: 320px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 100000;
      animation: tooltipFadeIn 0.3s;
    `;

    // Posicionar según position
    if (step.position === 'bottom') {
      tooltip.style.top = (targetRect.bottom + 20) + 'px';
      tooltip.style.left = targetRect.left + 'px';
    } else {
      tooltip.style.bottom = (window.innerHeight - targetRect.top + 20) + 'px';
      tooltip.style.left = targetRect.left + 'px';
    }

    tooltip.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 8px;">${step.title}</div>
      <div style="color: #666; margin-bottom: 20px; line-height: 1.5;">${step.text}</div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="color: #999; font-size: 12px;">
          ${this.currentStep + 1} de ${this.steps.length}
        </div>
        <div style="display: flex; gap: 8px;">
          <button onclick="window.tutorialManager.skip()" style="padding: 8px 16px; background: #f3f4f6; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
            Saltar
          </button>
          <button onclick="window.tutorialManager.next()" style="padding: 8px 16px; background: #10b981; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
            ${this.currentStep === this.steps.length - 1 ? 'Terminar' : 'Siguiente'}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(tooltip);

    // Agregar animación
    if (!document.getElementById('tutorial-animations')) {
      const style = document.createElement('style');
      style.id = 'tutorial-animations';
      style.textContent = `
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  next() {
    this.currentStep++;
    this.showStep(this.currentStep);
    window.sounds?.click();
  }

  skip() {
    this.finish();
    window.sounds?.click();
  }

  finish() {
    // Guardar que ya vio el tutorial
    const tutorialKey = `tutorial_${this.steps[0]?.target || 'default'}_seen`;
    localStorage.setItem(tutorialKey, 'true');

    // Remover elementos
    this.overlay?.remove();
    this.spotlight?.remove();
    document.querySelectorAll('.tutorial-tooltip').forEach(el => el.remove());

    window.toast?.success('¡Tutorial completado! 🎉');
    window.sounds?.success();
    window.haptics?.success();
  }
}

// Instancia global
window.tutorialManager = new TutorialManager();

// Iniciar tutorial automáticamente según la página
window.addEventListener('load', () => {
  setTimeout(() => {
    if (window.location.pathname.includes('request.html')) {
      window.tutorialManager.start(TutorialManager.requestTutorial);
    } else if (window.location.pathname.includes('driver.html')) {
      window.tutorialManager.start(TutorialManager.driverTutorial);
    }
  }, 1000);
});
