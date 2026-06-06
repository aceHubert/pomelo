(function () {
  const CANVAS_ID = 'particle-canvas';
  const GRADIENT_CANVAS_ID = 'gemini-2-0-gradient-canvas';

  let canvas = document.getElementById(CANVAS_ID);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = CANVAS_ID;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:1',
      'width:100vw',
      'height:100vh',
      'pointer-events:none',
    ].join(';');

    const host = document.getElementById('app') || document.body;
    const gradientCanvas = document.getElementById(GRADIENT_CANVAS_ID);
    if (gradientCanvas && gradientCanvas.parentNode === host) {
      host.insertBefore(canvas, gradientCanvas.nextSibling);
    } else {
      host.insertBefore(canvas, host.firstChild);
    }
  }

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const particleCountBreakpoints = [
    { maxWidth: 480, count: 45 },
    { maxWidth: 768, count: 70 },
    { maxWidth: 1024, count: 100 },
  ];
  const defaultParticleCount = 150;
  const connectionDistance = 120;
  const mouseDistance = 180;
  let mouseX = 0;
  let mouseY = 0;
  let primaryColor = '#8252ab'; // Default

  function getParticleCount() {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1440;
    const breakpoint = particleCountBreakpoints.find((item) => viewportWidth <= item.maxWidth);
    return breakpoint ? breakpoint.count : defaultParticleCount;
  }

  function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function syncParticleCount() {
    const particleCount = getParticleCount();
    particles = particles.slice(0, particleCount);
    while (particles.length < particleCount) {
      particles.push(new Particle());
    }
  }

  function resize() {
    resizeCanvas();
    syncParticleCount();
    particles.forEach((particle) => {
      particle.x = Math.min(Math.max(particle.x, 0), width);
      particle.y = Math.min(Math.max(particle.y, 0), height);
    });
  }

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 130, g: 82, b: 171 };
  }

  function getPrimaryColor() {
    const style = getComputedStyle(document.documentElement);
    const color = style.getPropertyValue('--theme-primary').trim();
    return color || '#FA541C';
  }

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 1.5;
      this.vy = (Math.random() - 0.5) * 1.5;
      this.size = Math.random() * 2 + 0.5;
      this.alpha = Math.random() * 0.5 + 0.2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      const dx = mouseX - this.x;
      const dy = mouseY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < mouseDistance) {
        const forceDirectionX = dx / distance;
        const forceDirectionY = dy / distance;
        const force = (mouseDistance - distance) / mouseDistance;
        const directionX = forceDirectionX * force * 0.6;
        const directionY = forceDirectionY * force * 0.6;
        this.vx += directionX;
        this.vy += directionY;
      }

      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      const maxSpeed = 2;
      if (speed > maxSpeed) {
        this.vx = (this.vx / speed) * maxSpeed;
        this.vy = (this.vy / speed) * maxSpeed;
      }
    }

    draw(rgb) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${this.alpha})`;
      ctx.fill();
    }
  }

  function init() {
    resizeCanvas();
    particles = [];
    syncParticleCount();
    primaryColor = getPrimaryColor();
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    const rgb = hexToRgb(primaryColor);

    particles.forEach((p) => {
      p.update();
      p.draw(rgb);
    });

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < connectionDistance) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.4 * (1 - distance / connectionDistance)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    for (let i = 0; i < particles.length; i++) {
      const dx = particles[i].x - mouseX;
      const dy = particles[i].y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < mouseDistance) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.5 * (1 - distance / mouseDistance)})`;
        ctx.lineWidth = 0.8;
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(mouseX, mouseY);
        ctx.stroke();
      }
    }

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Watch for theme changes or primary color changes (if dynamic)
  // For now, we'll just poll or rely on re-init if needed.
  // But CSS variable changes are instant, so we should read it in the loop or on some event.
  // Reading getComputedStyle every frame might be expensive.
  // Let's read it every frame for now as it's what the Vue app does (effectively).
  // Optimization: Read it every 60 frames or so?
  // The Vue app reads it every frame because it's a reactive ref.
  // Here, let's just read it in the animate loop but maybe cache it?
  // Actually, `getPrimaryColor` is fast enough usually.

  // Better:
  setInterval(() => {
    primaryColor = getPrimaryColor();
  }, 1000);

  init();
  animate();
})();
