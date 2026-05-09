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
  const json = JSON.stringify(toCompactSnapshot(snapshot));
  return bytesToBase64Url(new TextEncoder().encode(json));
}

export function decodeShareState(value) {
  if (!value) return null;
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(value));
    return fromCompactSnapshot(JSON.parse(json));
  } catch {
    return null;
  }
}

export function createShareLink(snapshot) {
  const url = new URL(window.location.href);
  url.searchParams.delete('share');
  url.searchParams.set('s', encodeShareState(snapshot));
  return url.toString();
}

function toCompactSnapshot(snapshot) {
  const playerIds = snapshot.players.map((player) => player.id);
  const indexById = Object.fromEntries(playerIds.map((id, index) => [id, index]));

  return {
    v: 2,
    t: snapshot.title,
    d: snapshot.date,
    s: snapshot.savedAt,
    p: snapshot.players.map((player) => player.name),
    h: snapshot.history.map((match) => [
      indexById[match.teamA[0]],
      indexById[match.teamA[1]],
      indexById[match.teamB[0]],
      indexById[match.teamB[1]],
      match.scoreA ?? '',
      match.scoreB ?? '',
      match.winner,
      match.court,
      match.completedAt,
    ]),
  };
}

function fromCompactSnapshot(snapshot) {
  if (snapshot?.v !== 2) return snapshot;

  const players = snapshot.p.map((name, index) => ({
    id: `shared-player-${index}`,
    name,
  }));

  return {
    version: 2,
    title: snapshot.t,
    date: snapshot.d,
    savedAt: snapshot.s,
    players,
    history: snapshot.h.map((match, index) => ({
      id: `shared-match-${index}`,
      teamA: [players[match[0]]?.id, players[match[1]]?.id].filter(Boolean),
      teamB: [players[match[2]]?.id, players[match[3]]?.id].filter(Boolean),
      scoreA: match[4] ?? '',
      scoreB: match[5] ?? '',
      winner: match[6],
      court: match[7],
      completedAt: match[8],
    })),
  };
}
