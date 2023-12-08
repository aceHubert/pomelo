import tinycolor, { type ColorFormats } from 'tinycolor2';

/**
 * tinycolor2 extend
 * toRgb use Math.round that would cause accuracy problem
 * so we use getRed, getBlue, getGreen to get the accurate value
 * getAlpha is not affected
 * tinycolor.mix has a different algorithm from less.js
 */
Object.defineProperties(tinycolor.prototype, {
  getRed: {
    value() {
      return this._r;
    },
  },
  getBlue: {
    value() {
      return this._b;
    },
  },
  getGreen: {
    value() {
      return this._g;
    },
  },
});

tinycolor.lessMix = (color1: tinycolor.ColorInput, color2: tinycolor.ColorInput, weight = 50) => {
  const p = weight / 100.0;
  const w = p * 2 - 1;
  const c1 = tinycolor(color1) as tinycolor.Instance & { _r: number; _g: number; _b: number; _a: number };
  const c2 = tinycolor(color2) as tinycolor.Instance & { _r: number; _g: number; _b: number; _a: number };
  const a = c1._a - c2._a;
  const w1 = ((w * a == -1 ? w : (w + a) / (1 + w * a)) + 1) / 2.0;
  const w2 = 1 - w1;

  return tinycolor({
    r: c1._r * w1 + c2._r * w2,
    g: c1._g * w1 + c2._g * w2,
    b: c1._b * w1 + c2._b * w2,
    a: c1._a * p + c2._a * (1 - p),
  });
};

const hueStep = 2;
const saturationStep = 16;
const saturationStep2 = 5;
const brightnessStep1 = 5;
const brightnessStep2 = 15;
const lightColorCount = 5;
const darkColorCount = 4;

function getHue(hsv: ColorFormats.HSV, i: number, isLight: boolean) {
  let hue;
  if (hsv.h >= 60 && hsv.h <= 240) {
    hue = isLight ? hsv.h - hueStep * i : hsv.h + hueStep * i;
  } else {
    hue = isLight ? hsv.h + hueStep * i : hsv.h - hueStep * i;
  }
  if (hue < 0) {
    hue += 360;
  } else if (hue >= 360) {
    hue -= 360;
  }
  return Math.round(hue);
}

function getSaturation(hsv: ColorFormats.HSV, i: number, isLight: boolean) {
  let saturation;
  if (isLight) {
    saturation = Math.round(hsv.s * 100) - saturationStep * i;
  } else if (i === darkColorCount) {
    saturation = Math.round(hsv.s * 100) + saturationStep;
  } else {
    saturation = Math.round(hsv.s * 100) + saturationStep2 * i;
  }
  if (saturation > 100) {
    saturation = 100;
  }
  if (isLight && i === lightColorCount && saturation > 10) {
    saturation = 10;
  }
  if (saturation < 6) {
    saturation = 6;
  }
  return Math.round(saturation);
}

function getValue(hsv: ColorFormats.HSV, i: number, isLight: boolean) {
  if (isLight) {
    return Math.round(hsv.v * 100) + brightnessStep1 * i;
  }
  return Math.round(hsv.v * 100) - brightnessStep2 * i;
}

function colorPalette(color: tinycolor.ColorInput, index: number) {
  const isLight = index <= 6;
  const hsv = tinycolor(color).toHsv();
  const i = isLight ? lightColorCount + 1 - index : index - lightColorCount - 1;
  return tinycolor({
    h: getHue(hsv, i, isLight),
    s: getSaturation(hsv, i, isLight),
    v: getValue(hsv, i, isLight),
  }).toHexString();
}

/**
 * generate primary color
 * @param colorInput color input
 * @param isDark is dark theme
 * @param mixColor mix component background color
 */
export function renderPrimaryStyle(colorInput: tinycolor.ColorInput, isDark = false) {
  const base = tinycolor(colorInput);
  if (!base.isValid()) return '';

  let colors: Record<string, string> = {};
  const shadowColor = base.clone().setAlpha(0.3).toString();
  if (!isDark) {
    colors = {
      base: base.toHexString(),
      'primary-1': colorPalette(base, 1),
      'primary-2': colorPalette(base, 2),
      'primary-3': colorPalette(base, 3),
      'primary-4': colorPalette(base, 4),
      'primary-5': colorPalette(base, 5),
      'primary-6': base.toHexString(),
      'primary-7': colorPalette(base, 7),
      'primary-8': colorPalette(base, 8),
      'primary-9': colorPalette(base, 9),
      'primary-10': colorPalette(base, 10),
      'shadow-color': shadowColor,
    };
  } else {
    const mixColor = '#141414';
    const mix = (color: tinycolor.ColorInput, weight: number) =>
      tinycolor.lessMix(color, mixColor, weight).toHexString();

    colors = {
      base: base.toHexString(),
      'primary-1': mix(colorPalette(base, 8), 15),
      'primary-2': mix(colorPalette(base, 7), 25),
      'primary-3': mix(base, 30),
      'primary-4': mix(base, 45),
      'primary-5': mix(base, 65),
      'primary-6': base.toHexString(),
      'primary-7': mix(colorPalette(base, 5), 90),
      'primary-8': mix(colorPalette(base, 4), 95),
      'primary-9': mix(colorPalette(base, 3), 97),
      'primary-10': mix(colorPalette(base, 2), 98),
      'shadow-color': shadowColor,
    };
  }

  return `<style>\n:root {\n${Object.keys(colors)
    .map((key) => (key === 'base' ? `  --theme-primary: ${colors[key]};` : `  --theme-${key}: ${colors[key]};`))
    .concat([`  --theme-random: ${Math.random()};`])
    .join('\n')}\n}\n</style>`;
}

declare module 'tinycolor2' {
  interface Constructor {
    /**
     * less mix function from less.js
     * @color1 color1
     * @color2 color2
     * @weight weight default 50
     */
    lessMix: (color1: tinycolor.ColorInput, color2: tinycolor.ColorInput, weight?: number) => tinycolor.Instance;
  }

  interface Instance {
    getRed: () => number;
    getBlue: () => number;
    getGreen: () => number;
  }
}
