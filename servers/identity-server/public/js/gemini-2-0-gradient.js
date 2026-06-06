(function () {
  const CANVAS_ID = 'gemini-2-0-gradient-canvas';
  const root = document.documentElement;
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const darkLayers = [
    { color: [74, 128, 255], x: 0.5, y: -0.05, radius: 0.64, alpha: 0.3, phase: 0.1, speed: 0.32 },
    { color: [186, 112, 255], x: 0.28, y: 0.04, radius: 0.48, alpha: 0.2, phase: 1.3, speed: 0.26 },
    { color: [68, 216, 205], x: 0.72, y: 0.06, radius: 0.46, alpha: 0.16, phase: 2.1, speed: 0.22 },
    { color: [239, 96, 176], x: 0.53, y: 0.12, radius: 0.36, alpha: 0.12, phase: 3.2, speed: 0.18 },
  ];

  const lightLayers = [
    { color: [120, 170, 255], x: 0.5, y: -0.02, radius: 0.62, alpha: 0.26, phase: 0.2, speed: 0.22 },
    { color: [190, 130, 255], x: 0.28, y: 0.08, radius: 0.42, alpha: 0.16, phase: 1.6, speed: 0.18 },
    { color: [90, 220, 210], x: 0.72, y: 0.1, radius: 0.44, alpha: 0.14, phase: 2.7, speed: 0.16 },
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
  let animationFrame = 0;

  function rgba(color, alpha) {
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
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
    const base = ctx.createLinearGradient(0, 0, 0, height);

    if (darkMode) {
      base.addColorStop(0, '#111827');
      base.addColorStop(0.24, '#090b12');
      base.addColorStop(0.58, '#030407');
      base.addColorStop(1, '#000');
    } else {
      base.addColorStop(0, '#f7faff');
      base.addColorStop(0.36, '#f4f8fc');
      base.addColorStop(1, '#fff');
    }

    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);
  }

  function drawGlowLayer(layer, darkMode, time) {
    const motionScale = reducedMotionQuery.matches ? 0 : 1;
    const driftX = Math.cos(time * layer.speed + layer.phase) * 0.035 * motionScale;
    const driftY = Math.sin(time * layer.speed * 0.8 + layer.phase) * 0.025 * motionScale;
    const centerX = width * (layer.x + driftX);
    const centerY = height * (layer.y + driftY);
    const pulse = Math.sin(time * layer.speed + layer.phase) * 0.018 * motionScale;
    const radius = Math.max(width, height) * (layer.radius + pulse);
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    const alpha = layer.alpha * (darkMode ? 1 : 0.9);

    gradient.addColorStop(0, rgba(layer.color, alpha));
    gradient.addColorStop(0.34, rgba(layer.color, alpha * 0.48));
    gradient.addColorStop(0.72, rgba(layer.color, alpha * 0.13));
    gradient.addColorStop(1, rgba(layer.color, 0));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function drawTopGlow(darkMode) {
    const time = reducedMotionQuery.matches ? 0 : frame / 1000;
    const layers = darkMode ? darkLayers : lightLayers;

    ctx.save();
    ctx.globalCompositeOperation = darkMode ? 'screen' : 'multiply';
    layers.forEach((layer) => drawGlowLayer(layer, darkMode, time));
    ctx.restore();
  }

  function drawVerticalFade(darkMode) {
    const fade = ctx.createLinearGradient(0, 0, 0, height);

    if (darkMode) {
      fade.addColorStop(0, 'rgba(0, 0, 0, 0)');
      fade.addColorStop(0.34, 'rgba(0, 0, 0, 0.16)');
      fade.addColorStop(0.72, 'rgba(0, 0, 0, 0.72)');
      fade.addColorStop(1, 'rgba(0, 0, 0, 0.98)');
    } else {
      fade.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
      fade.addColorStop(0.42, 'rgba(255, 255, 255, 0.42)');
      fade.addColorStop(1, 'rgba(255, 255, 255, 0.82)');
    }

    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, width, height);
  }

  function render() {
    frame += 1;
    const darkMode = getThemeMode() === 'dark';

    drawBase(darkMode);
    drawTopGlow(darkMode);
    drawVerticalFade(darkMode);

    animationFrame = requestAnimationFrame(render);
  }

  function destroy() {
    window.removeEventListener('resize', resize);
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    canvas.remove();
  }

  if (window.gemini20Gradient && typeof window.gemini20Gradient.destroy === 'function') {
    window.gemini20Gradient.destroy();
  }

  window.gemini20Gradient = {
    destroy,
    refresh() {
      resize();
      frame = 0;
    },
  };

  window.addEventListener('resize', resize);
  resize();
  render();
})();
