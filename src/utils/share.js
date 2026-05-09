function bytesToBase64Url(bytes) {
  let binary = '';
  const chunkSize = 8192;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function base64UrlToBytes(value) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function encodeShareState(snapshot) {
  const json = JSON.stringify(snapshot);
  return bytesToBase64Url(new TextEncoder().encode(json));
}

export function decodeShareState(value) {
  if (!value) return null;
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(value));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function createShareLink(snapshot) {
  const url = new URL(window.location.href);
  url.searchParams.set('share', encodeShareState(snapshot));
  return url.toString();
}
