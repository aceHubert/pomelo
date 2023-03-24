/**
 * 比较两个对象是否相等
 */
export function equals(x: any, y: any): boolean {
  const f1 = x instanceof Object;
  const f2 = y instanceof Object;
  if (!f1 || !f2) {
    return x === y;
  }
  if (Object.keys(x).length !== Object.keys(y).length) {
    return false;
  }
  const newX = Object.keys(x);
  for (let p in newX) {
    p = newX[p];
    const a = x[p] instanceof Object;
    const b = y[p] instanceof Object;
    if (a && b) {
      return equals(x[p], y[p]);
    } else if (x[p] !== y[p]) {
      return false;
    }
  }
  return true;
}
