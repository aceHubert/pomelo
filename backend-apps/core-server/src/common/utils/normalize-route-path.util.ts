export function addStartingSlash(text: string) {
  if (!text) {
    return text;
  }
  return text[0] !== '/' ? '/' + text : text;
}

export function stripEndingSlash(text: string) {
  if (!text) {
    return text;
  }
  return text[text.length - 1] === '/' && text.length > 1 ? text.slice(0, text.length - 1) : text;
}

export function normalizeRoutePath(path: string) {
  path = addStartingSlash(path);
  return stripEndingSlash(path);
}
