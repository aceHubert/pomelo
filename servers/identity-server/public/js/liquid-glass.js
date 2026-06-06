// Liquid glass enhancer for existing `.liquid-glass*` elements.
// Core displacement map algorithm is adapted from https://github.com/shuding/liquid-glass.

(function () {
  'use strict';

  var TARGET_SELECTOR = '.liquid-glass, .liquid-glass-card, .liquid-glass-button, .liquid-glass-form-control-wrapper';
  var FILTERED_CLASS = 'liquid-glass--ready';
  var PROFILES = {
    base: {
      blur: 0.25,
      contrast: 1.2,
      brightness: 1.05,
      saturation: 1.1,
      displacementScale: 80,
      chromaticAberration: 2,
      edgeWidth: 0.15,
      mousePull: 0.14,
      radius: 0.6,
    },
    card: {
      blur: 20,
      contrast: 1,
      brightness: 1,
      saturation: 1.4,
      displacementScale: 100,
      chromaticAberration: 10,
      edgeWidth: 0.18,
      mousePull: 0.08,
      radius: 0.64,
    },
    button: {
      blur: 12,
      contrast: 1.08,
      brightness: 1.06,
      saturation: 1.8,
      displacementScale: 64,
      chromaticAberration: 5,
      edgeWidth: 0.12,
      mousePull: 0.16,
      radius: 0.72,
    },
    input: {
      blur: 20,
      contrast: 1,
      brightness: 1,
      saturation: 1.4,
      displacementScale: 100,
      chromaticAberration: 10,
      edgeWidth: 0.18,
      mousePull: 0.08,
      radius: 0.64,
    },
  };
  var instances = [];

  if (window.liquidGlass && typeof window.liquidGlass.destroy === 'function') {
    window.liquidGlass.destroy();
  }

  function smoothStep(a, b, t) {
    t = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  function length(x, y) {
    return Math.sqrt(x * x + y * y);
  }

  function roundedRectSDF(x, y, width, height, radius) {
    var qx = Math.abs(x) - width + radius;
    var qy = Math.abs(y) - height + radius;
    return Math.min(Math.max(qx, qy), 0) + length(Math.max(qx, 0), Math.max(qy, 0)) - radius;
  }

  function texture(x, y) {
    return { x: x, y: y };
  }

  function generateId() {
    return 'liquid-glass-' + Math.random().toString(36).slice(2, 11);
  }

  function clampCanvasSize(value) {
    return Math.max(24, Math.min(420, Math.round(value)));
  }

  function setAttributeNS(element, name, value) {
    element.setAttributeNS('http://www.w3.org/1999/xlink', name, value);
  }

  function createSvgElement(tagName) {
    return document.createElementNS('http://www.w3.org/2000/svg', tagName);
  }

  function getProfile(element) {
    if (element.classList.contains('liquid-glass-card')) return PROFILES.card;
    if (element.classList.contains('liquid-glass-form-control-wrapper')) {
      return PROFILES.input;
    }
    if (element.classList.contains('liquid-glass-button')) {
      return PROFILES.button;
    }
    return PROFILES.base;
  }

  function LiquidGlassElement(element) {
    this.element = element;
    this.profile = getProfile(element);
    this.id = generateId();
    this.canvasDPI = Math.min(window.devicePixelRatio || 1, 2);
    this.width = 0;
    this.height = 0;
    this.mouse = { x: 0.5, y: 0.5 };
    this.mouseUsed = false;
    this.animationFrame = 0;
    this.resizeObserver = null;

    this.createFilter();
    this.bindEvents();
    this.update();
  }

  LiquidGlassElement.prototype.createFilter = function () {
    this.svg = createSvgElement('svg');
    this.svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    this.svg.setAttribute('width', '0');
    this.svg.setAttribute('height', '0');
    this.svg.setAttribute('aria-hidden', 'true');
    this.svg.style.cssText =
      'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;overflow:hidden;z-index:-1;';

    var defs = createSvgElement('defs');
    var filter = createSvgElement('filter');
    filter.setAttribute('id', this.id + '_filter');
    filter.setAttribute('filterUnits', 'userSpaceOnUse');
    filter.setAttribute('colorInterpolationFilters', 'sRGB');
    filter.setAttribute('x', '0');
    filter.setAttribute('y', '0');

    this.feImage = createSvgElement('feImage');
    this.feImage.setAttribute('id', this.id + '_map');
    this.feImage.setAttribute('preserveAspectRatio', 'none');

    filter.appendChild(this.feImage);
    this.redDisplacement = this.createChannel(filter, 'RED', 1, '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0');
    this.greenDisplacement = this.createChannel(filter, 'GREEN', 1.08, '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0');
    this.blueDisplacement = this.createChannel(filter, 'BLUE', 1.16, '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0');
    this.greenBlueBlend = createSvgElement('feBlend');
    this.greenBlueBlend.setAttribute('in', this.id + '_GREEN_CHANNEL');
    this.greenBlueBlend.setAttribute('in2', this.id + '_BLUE_CHANNEL');
    this.greenBlueBlend.setAttribute('mode', 'screen');
    this.greenBlueBlend.setAttribute('result', this.id + '_GB_COMBINED');
    filter.appendChild(this.greenBlueBlend);

    this.rgbBlend = createSvgElement('feBlend');
    this.rgbBlend.setAttribute('in', this.id + '_RED_CHANNEL');
    this.rgbBlend.setAttribute('in2', this.id + '_GB_COMBINED');
    this.rgbBlend.setAttribute('mode', 'screen');
    this.rgbBlend.setAttribute('result', this.id + '_RGB_COMBINED');
    filter.appendChild(this.rgbBlend);
    defs.appendChild(filter);
    this.svg.appendChild(defs);
    document.body.appendChild(this.svg);

    this.filter = filter;
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'none';
    this.context = this.canvas.getContext('2d');
  };

  LiquidGlassElement.prototype.createChannel = function (filter, channelName, scaleRatio, matrix) {
    var displacement = createSvgElement('feDisplacementMap');
    displacement.setAttribute('in', 'SourceGraphic');
    displacement.setAttribute('in2', this.id + '_map');
    displacement.setAttribute('xChannelSelector', 'R');
    displacement.setAttribute('yChannelSelector', 'G');
    displacement.setAttribute('result', this.id + '_' + channelName + '_DISPLACED');
    displacement.setAttribute('data-scale-ratio', String(scaleRatio));
    filter.appendChild(displacement);

    var colorMatrix = createSvgElement('feColorMatrix');
    colorMatrix.setAttribute('in', this.id + '_' + channelName + '_DISPLACED');
    colorMatrix.setAttribute('type', 'matrix');
    colorMatrix.setAttribute('values', matrix);
    colorMatrix.setAttribute('result', this.id + '_' + channelName + '_CHANNEL');
    filter.appendChild(colorMatrix);

    return displacement;
  };

  LiquidGlassElement.prototype.bindEvents = function () {
    var self = this;

    this.onPointerMove = function (event) {
      var rect = self.element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      self.mouse.x = (event.clientX - rect.left) / rect.width;
      self.mouse.y = (event.clientY - rect.top) / rect.height;

      if (self.mouseUsed) {
        self.requestUpdate();
      }
    };

    this.onResize = function () {
      self.requestUpdate(true);
    };

    this.element.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('resize', this.onResize);

    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(this.onResize);
      this.resizeObserver.observe(this.element);
    }
  };

  LiquidGlassElement.prototype.requestUpdate = function (force) {
    var self = this;
    if (this.animationFrame) return;

    this.animationFrame = window.requestAnimationFrame(function () {
      self.animationFrame = 0;
      self.update(force);
    });
  };

  LiquidGlassElement.prototype.update = function (force) {
    var rect = this.element.getBoundingClientRect();
    var width = clampCanvasSize(rect.width);
    var height = clampCanvasSize(rect.height);

    if (!width || !height) return;

    if (force || width !== this.width || height !== this.height) {
      this.width = width;
      this.height = height;
      this.canvas.width = Math.round(width * this.canvasDPI);
      this.canvas.height = Math.round(height * this.canvasDPI);
      this.filter.setAttribute('width', String(width));
      this.filter.setAttribute('height', String(height));
      this.feImage.setAttribute('width', String(width));
      this.feImage.setAttribute('height', String(height));
    }

    this.updateShader();
    this.applyFilter();
  };

  LiquidGlassElement.prototype.fragment = function (uv, mouse) {
    var ix = uv.x - 0.5;
    var iy = uv.y - 0.5;
    var mouseX = mouse.x - 0.5;
    var mouseY = mouse.y - 0.5;
    var distanceToEdge = roundedRectSDF(ix, iy, 0.3, 0.2, this.profile.radius);
    var edgeDisplacement = smoothStep(0.8, 0, distanceToEdge - this.profile.edgeWidth);
    var mouseDistance = length(ix - mouseX, iy - mouseY);
    var mouseDisplacement = smoothStep(0.34, 0, mouseDistance) * this.profile.mousePull;
    var scaled = smoothStep(0, 1, edgeDisplacement + mouseDisplacement);

    return texture(ix * scaled + 0.5, iy * scaled + 0.5);
  };

  LiquidGlassElement.prototype.updateShader = function () {
    this.mouseUsed = true;

    var w = this.canvas.width;
    var h = this.canvas.height;
    var data = new Uint8ClampedArray(w * h * 4);
    var rawValues = [];
    var maxScale = 0;

    // 生成与参考实现一致的红/绿通道位移图。
    for (var i = 0; i < data.length; i += 4) {
      var x = (i / 4) % w;
      var y = Math.floor(i / 4 / w);
      var pos = this.fragment({ x: x / w, y: y / h }, this.mouse);
      var dx = pos.x * w - x;
      var dy = pos.y * h - y;

      maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy));
      rawValues.push(dx, dy);
    }

    maxScale = Math.max(maxScale * 0.5, 1);

    var index = 0;
    for (var j = 0; j < data.length; j += 4) {
      data[j] = (rawValues[index++] / maxScale + 0.5) * 255;
      data[j + 1] = (rawValues[index++] / maxScale + 0.5) * 255;
      data[j + 2] = 0;
      data[j + 3] = 255;
    }

    var imageData = this.context.createImageData(w, h);
    imageData.data.set(data);
    this.context.putImageData(imageData, 0, 0);
    setAttributeNS(this.feImage, 'href', this.canvas.toDataURL());
    this.applyDisplacementScale(maxScale / this.canvasDPI);
  };

  LiquidGlassElement.prototype.applyDisplacementScale = function (baseScale) {
    var scale = Math.max(1, (baseScale * this.profile.displacementScale) / 80);
    var chromatic = this.profile.chromaticAberration;

    this.redDisplacement.setAttribute('scale', String(-(scale + chromatic)));
    this.greenDisplacement.setAttribute('scale', String(-(scale + chromatic * 1.5)));
    this.blueDisplacement.setAttribute('scale', String(-(scale + chromatic * 2)));
  };

  LiquidGlassElement.prototype.applyFilter = function () {
    var value =
      'url(#' +
      this.id +
      '_filter) blur(' +
      this.profile.blur +
      'px) contrast(' +
      this.profile.contrast +
      ') brightness(' +
      this.profile.brightness +
      ') saturate(' +
      this.profile.saturation +
      ')';

    this.element.style.backdropFilter = value;
    this.element.style.webkitBackdropFilter = value;
    this.element.classList.add(FILTERED_CLASS);
  };

  LiquidGlassElement.prototype.destroy = function () {
    if (this.animationFrame) {
      window.cancelAnimationFrame(this.animationFrame);
    }

    this.element.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('resize', this.onResize);

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    this.element.style.backdropFilter = '';
    this.element.style.webkitBackdropFilter = '';
    this.element.classList.remove(FILTERED_CLASS);
    this.svg.remove();
  };

  function initialize() {
    destroy();

    var elements = document.querySelectorAll(TARGET_SELECTOR);
    for (var i = 0; i < elements.length; i += 1) {
      instances.push(new LiquidGlassElement(elements[i]));
    }

    window.liquidGlass = {
      refresh: initialize,
      destroy: destroy,
      count: function () {
        return instances.length;
      },
    };
  }

  function destroy() {
    while (instances.length) {
      instances.pop().destroy();
    }
  }

  initialize();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  }
})();
