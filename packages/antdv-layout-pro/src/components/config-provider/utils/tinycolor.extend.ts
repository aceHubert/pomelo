import tinycolor from 'tinycolor2';

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

declare module 'tinycolor2' {
  interface Constructor {
    /**
     * less mix function from less.js
     * @color1 color1
     * @color2 color2
     * @weight weight default 50
     */
    lessMix: (color1: ColorInput, color2: ColorInput, weight?: number) => Instance;
  }

  interface Instance {
    getRed: () => number;
    getBlue: () => number;
    getGreen: () => number;
  }
}
