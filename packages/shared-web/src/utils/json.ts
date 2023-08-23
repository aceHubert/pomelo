/**
 * Safe json parse
 */
export function jsonSafeParse<V = any>(...args: Parameters<typeof JSON.parse>): V | undefined {
  let value: V;
  let isValid = false;
  try {
    value = JSON.parse(...args);
    isValid = true;
  } catch {}

  return isValid ? value! : undefined;
}

/**
 * Serialize to string json option
 */
export function jsonSerializeReviver(key: string, value: any) {
  if (typeof value === 'function') {
    return value + '';
  }
  return value;
}

// const UCT_DATE_REG = /^\d{4}-[0-1]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-6]\d(.\d{3})?((\+|\-)\d\d(:)?\d\d|Z)$/;

/**
 * Deserialize from string option
 */
export function jsonDeserializeReviver(scope: any = {}) {
  return (key: string, value: any) => {
    if (value?.indexOf && value.indexOf('function') > -1) {
      // Function
      return new Function('$root', `with($root){ return (${value}); }`)(scope);
    }
    // else if (include.includes('DATE') && !exclude.includes('DATE') && UCT_DATE_REG.test(value)) {
    //   // UCT Date
    //   return new Date(value);
    // }

    return value;
  };
}
