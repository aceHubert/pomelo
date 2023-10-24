import tinycolor from 'tinycolor2';
import { hasOwn } from '@ace-util/core';
import { colorPalette } from './colorPalette';
import './tinycolor.extend';

const isServer = typeof window === 'undefined';
const SPECIAL_CHARS_REGEXP = /([\\:\-\\_]+(.))/g;
const MOZ_HACK_REGEXP = /^moz([A-Z])/;
// @ts-expect-error type error
const ieVersion = isServer ? 0 : Number(document.documentMode);

/* istanbul ignore next */
const trim = function (string: string) {
  return (string || '').replace(/^[\s\uFEFF]+|[\s\uFEFF]+$/g, '');
};

/* istanbul ignore next */
const camelCase = function (name: string) {
  return name
    .replace(SPECIAL_CHARS_REGEXP, function (_, separator, letter, offset) {
      return offset ? letter.toUpperCase() : letter;
    })
    .replace(MOZ_HACK_REGEXP, 'Moz$1');
};

/* istanbul ignore next */
export function hasClass(el: HTMLElement, cls: string) {
  if (!el || !cls) return false;
  if (cls.indexOf(' ') !== -1) throw new Error('className should not contain space.');
  if (el.classList) {
    return el.classList.contains(cls);
  } else {
    return (' ' + el.className + ' ').indexOf(' ' + cls + ' ') > -1;
  }
}

/* istanbul ignore next */
export function addClass(el: HTMLElement, cls: string) {
  if (!el) return;
  let curClass = el.className;
  const classes = (cls || '').split(' ');

  for (let i = 0, j = classes.length; i < j; i++) {
    const clsName = classes[i];
    if (!clsName) continue;

    if (el.classList) {
      el.classList.add(clsName);
    } else {
      if (!hasClass(el, clsName)) {
        curClass += ' ' + clsName;
      }
    }
  }
  if (!el.classList) {
    el.className = curClass;
  }
}

/* istanbul ignore next */
export function removeClass(el: HTMLElement, cls: string) {
  if (!el || !cls) return;
  const classes = cls.split(' ');
  let curClass = ' ' + el.className + ' ';

  for (let i = 0, j = classes.length; i < j; i++) {
    const clsName = classes[i];
    if (!clsName) continue;

    if (el.classList) {
      el.classList.remove(clsName);
    } else {
      if (hasClass(el, clsName)) {
        curClass = curClass.replace(' ' + clsName + ' ', ' ');
      }
    }
  }
  if (!el.classList) {
    el.className = trim(curClass);
  }
}

/* istanbul ignore next */
export function toggleClass(el: HTMLElement, cls: string) {
  if (hasClass(el, cls)) {
    removeClass(el, cls);
  } else {
    addClass(el, cls);
  }
}

// 获取样式兼容性函数
/* istanbul ignore next */
export const getStyle =
  ieVersion < 9
    ? function (el: any, name: string) {
        if (isServer) return;
        if (!el || !name) return null;
        name = camelCase(name);
        if (name === 'float') {
          name = 'styleFloat';
        }
        try {
          switch (name) {
            case 'opacity':
              try {
                return el.filters.item('alpha').opacity / 100;
              } catch (e) {
                return 1.0;
              }
            default:
              return el.style[name] || el.currentStyle ? el.currentStyle[name] : null;
          }
        } catch (e) {
          return el.style[name];
        }
      }
    : function (el: HTMLElement, name: string) {
        if (isServer) return;
        if (!el || !name) return null;
        name = camelCase(name);
        if (name === 'float') {
          name = 'cssFloat';
        }
        try {
          const computed = document.defaultView?.getComputedStyle(el, '');
          return el.style[name] || computed ? computed?.[name] : null;
        } catch (e) {
          return el.style[name];
        }
      };

// 设置样式
/* istanbul ignore next */
export function setStyle(el: HTMLElement, styles: Record<string, any>);
export function setStyle(el: HTMLElement, name: string, value: any);
export function setStyle(el: HTMLElement, stylesOrName: string | Record<string, string>, value?: any) {
  if (!el || !stylesOrName) return;

  if (typeof stylesOrName === 'object') {
    for (const prop in stylesOrName) {
      if (hasOwn(stylesOrName, prop)) {
        setStyle(el, prop, stylesOrName[prop]);
      }
    }
  } else {
    const name = camelCase(stylesOrName);
    if (name === 'opacity' && ieVersion < 9) {
      el.style.filter = isNaN(value) ? '' : 'alpha(opacity=' + value * 100 + ')';
    } else {
      el.style[name] = value;
    }
  }
}

/**
 * generate primary color
 * @param colorInput color input
 * @param isDark is dark theme
 * @param mixColor mix component background color
 */
export const genColor = (colorInput: tinycolor.ColorInput, isDark = false) => {
  const base = tinycolor(colorInput);

  const shadowColor = base.clone().setAlpha(0.3).toString();
  if (!isDark) {
    return {
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

    return {
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
};

/* istanbul ignore next */
export const addStyleSheet = (href: string, id: string) => {
  let link = document.getElementById(id) as HTMLLinkElement;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.id = id;
    document.getElementsByTagName('head')[0].appendChild(link);
  }
  link.setAttribute('href', href);
};

/* istanbul ignore next */
export const removeStyleSheet = (id = '') => {
  const link = document.getElementById(id) as HTMLLinkElement;
  if (link) {
    link.remove();
  }
};

/* istanbul ignore next */
export const addCssText = (cssText: string, id: string) => {
  let style = document.getElementById(id) as HTMLStyleElement;
  if (!style) {
    style = document.createElement('style');
    style.type = 'text/css';
    style.id = id;
    document.getElementsByTagName('head')[0].appendChild(style);
  }
  try {
    style.innerHTML = '';
    style.appendChild(document.createTextNode(cssText));
  } catch (ex) {
    style.sheet!.insertRule(cssText, 0);
  }
};

/* istanbul ignore next */
export const removeCssText = (id: string) => {
  const style = document.getElementById(id) as HTMLStyleElement;
  if (style) {
    style.remove();
  }
};
