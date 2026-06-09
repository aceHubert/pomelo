export async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  const digestBytes = Array.from(new Uint8Array(digest));
  return digestBytes.map((item) => item.toString(16).padStart(2, '0')).join('');
}
