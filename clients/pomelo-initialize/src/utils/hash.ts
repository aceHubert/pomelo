function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

export async function sha256Hex(value: string) {
  if (!window.crypto?.subtle) {
    throw new Error('当前环境不支持 SHA-256 计算');
  }

  const input = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest('SHA-256', input);
  return bytesToHex(new Uint8Array(digest));
}
