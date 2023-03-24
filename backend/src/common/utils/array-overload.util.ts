export function getArrayFromOverloadedRest<T>(overloadedArray: Array<T | T[]>): T[] {
  let items: T[];
  if (Array.isArray(overloadedArray[0])) {
    items = overloadedArray[0] as T[];
  } else {
    items = overloadedArray as T[];
  }
  return items;
}
