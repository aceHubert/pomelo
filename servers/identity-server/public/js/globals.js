/* eslint-disable no-unused-vars */
function absoluteGo(url, replace) {
  try {
    window.location[replace ? 'replace' : 'assign'](url);
  } catch (e) {
    window.location.href = url;
  }
}
