(function () {
  const CANVAS_ID = 'gemini-gradient-canvas';
  const root = document.documentElement;
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const palette = [
    { r: 66, g: 133, b: 244 },
    { r: 161, g: 66, b: 244 },
    { r: 234, g: 67, b: 53 },
    { r: 251, g: 188, b: 4 },
    { r: 52, g: 168, b: 83 },
  ];
  const orbs = [
    { colorIndex: 0, x: 0.16, y: 0.2, radius: 0.52, phase: 0.2, speed: 0.52, alpha: 0.32 },
    { colorIndex: 1, x: 0.78, y: 0.16, radius: 0.48, phase: 1.7, speed: 0.44, alpha: 0.24 },
    { colorIndex: 2, x: 0.76, y: 0.78, radius: 0.42, phase: 2.5, speed: 0.4, alpha: 0.18 },
    { colorIndex: 3, x: 0.2, y: 0.82, radius: 0.4, phase: 3.2, speed: 0.36, alpha: 0.16 },
    { colorIndex: 4, x: 0.5, y: 0.54, radius: 0.56, phase: 4.1, speed: 0.32, alpha: 0.18 },
  ];

  let canvas = document.getElementById(CANVAS_ID);
  if (canvas) canvas.remove();

  canvas = document.createElement('canvas');
  canvas.id = CANVAS_ID;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:0',
    'width:100vw',
    'height:100vh',
    'pointer-events:none',
  ].join(';');
  const host = document.getElementById('app') || document.body;
  host.insertBefore(canvas, host.firstChild);

  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let dpr = 1;
  let frame = 0;

  function rgba(color, alpha) {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
  }

  function getThemeMode() {
    const mode = root.getAttribute('data-theme');
    if (mode === 'dark' || mode === 'light') return mode;
    return darkModeQuery.matches ? 'dark' : 'light';
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth || document.documentElement.clientWidth || 1440;
    height = window.innerHeight || document.documentElement.clientHeight || 900;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawBase(darkMode) {
    const base = ctx.createLinearGradient(0, 0, width, height);
    if (darkMode) {
      base.addColorStop(0, '#07080d');
      base.addColorStop(0.46, '#101827');
      base.addColorStop(1, '#07080d');
    } else {
      base.addColorStop(0, '#f8fbff');
      base.addColorStop(0.5, '#eef6ff');
      base.addColorStop(1, '#fff8fb');
    }
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);
  }

  function drawOrbs(darkMode) {
    const reducedMotion = reducedMotionQuery.matches;
    const time = reducedMotion ? 0 : frame / 1000;

    ctx.save();
    ctx.globalCompositeOperation = darkMode ? 'screen' : 'multiply';

    orbs.forEach((orb) => {
      const color = palette[orb.colorIndex];
      const pulse = reducedMotion ? 0 : Math.sin(time * orb.speed + orb.phase);
      const driftX = reducedMotion ? 0 : Math.cos(time * orb.speed * 0.74 + orb.phase) * 0.08;
      const driftY = reducedMotion ? 0 : Math.sin(time * orb.speed * 0.68 + orb.phase) * 0.07;
      const centerX = width * (orb.x + driftX);
      const centerY = height * (orb.y + driftY);
      const radius = Math.max(width, height) * (orb.radius + pulse * 0.025);
      const alpha = orb.alpha * (darkMode ? 1.18 : 0.74);
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);

      gradient.addColorStop(0, rgba(color, alpha));
      gradient.addColorStop(0.45, rgba(color, alpha * 0.42));
      gradient.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    });

    ctx.restore();
  }

  function drawVeil(darkMode) {
    const veil = ctx.createLinearGradient(0, 0, width, height);
    if (darkMode) {
      veil.addColorStop(0, 'rgba(7, 8, 13, 0.34)');
      veil.addColorStop(0.5, 'rgba(7, 8, 13, 0.08)');
      veil.addColorStop(1, 'rgba(7, 8, 13, 0.42)');
    } else {
      veil.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
      veil.addColorStop(0.5, 'rgba(255, 255, 255, 0.34)');
      veil.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
    }
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, width, height);
  }

  function render() {
    frame += 1;
    const darkMode = getThemeMode() === 'dark';

    drawBase(darkMode);
    drawOrbs(darkMode);
    drawVeil(darkMode);

    requestAnimationFrame(render);
  }

  window.addEventListener('resize', resize);
  resize();
  render();
})();
