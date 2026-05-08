import { getPairKey, getPlayerStats } from './stats.js';

function combination(list, size) {
  const result = [];
  const walk = (start, picked) => {
    if (picked.length === size) {
      result.push(picked);
      return;
    }
    for (let i = start; i <= list.length - (size - picked.length); i += 1) {
      walk(i + 1, [...picked, list[i]]);
    }
  };
  walk(0, []);
  return result;
}

function pairWasRecent(pairKey, history, depth = 6) {
  return history.slice(0, depth).some((match) => {
    const pairs = [getPairKey(match.teamA), getPairKey(match.teamB)];
    return pairs.includes(pairKey);
  });
}

function matchWasRecent(teamA, teamB, history, depth = 8) {
  const matchPlayers = new Set([...teamA, ...teamB]);
  return history.slice(0, depth).some((match) => {
    const pastPlayers = new Set([...match.teamA, ...match.teamB]);
    return matchPlayers.size === pastPlayers.size && [...matchPlayers].every((id) => pastPlayers.has(id));
  });
}

function outcomeScore(group, stats) {
  const outcomes = group.map((id) => stats[id]?.lastOutcome || 'new');
  const winners = outcomes.filter((status) => status === 'win').length;
  const losers = outcomes.filter((status) => status === 'loss').length;
  return Math.abs(winners - losers);
}

function lockedPairPenalty(team, lockedPartners) {
  const key = getPairKey(team);
  const playerLocks = lockedPartners.filter((lock) => team.includes(lock.a) || team.includes(lock.b));
  if (playerLocks.some((lock) => getPairKey([lock.a, lock.b]) === key)) return -120;
  return playerLocks.length * 90;
}

function scoreTeam(team, stats, history, lockedPartners) {
  const partnerKey = getPairKey(team);
  const [a, b] = team;
  const repeatedPartnerCount = (stats[a]?.partners?.[b] || 0) + (stats[b]?.partners?.[a] || 0);
  return repeatedPartnerCount * 14 + (pairWasRecent(partnerKey, history) ? 45 : 0) + lockedPairPenalty(team, lockedPartners);
}

function scoreMatch(teamA, teamB, stats, history, lockedPartners) {
  const all = [...teamA, ...teamB];
  const games = all.map((id) => stats[id]?.games || 0);
  const gameSpread = Math.max(...games) - Math.min(...games);
  const totalGames = games.reduce((sum, value) => sum + value, 0);
  const opponentRepeats = teamA.reduce(
    (sum, id) => sum + teamB.reduce((inner, opponent) => inner + (stats[id]?.opponents?.[opponent] || 0), 0),
    0
  );

  return (
    gameSpread * 85 +
    totalGames * 9 +
    outcomeScore(all, stats) * 18 +
    scoreTeam(teamA, stats, history, lockedPartners) +
    scoreTeam(teamB, stats, history, lockedPartners) +
    opponentRepeats * 5 +
    (matchWasRecent(teamA, teamB, history) ? 90 : 0)
  );
}

function teamOptions(group, stats, history, lockedPartners) {
  const [p1, p2, p3, p4] = group;
  const options = [
    [
      [p1, p2],
      [p3, p4]
    ],
    [
      [p1, p3],
      [p2, p4]
    ],
    [
      [p1, p4],
      [p2, p3]
    ]
  ];
  return options
    .map(([teamA, teamB]) => ({
      teamA,
      teamB,
      score: scoreMatch(teamA, teamB, stats, history, lockedPartners)
    }))
    .sort((a, b) => a.score - b.score);
}

export function generateNextMatches({ players, queue, history, courtCount, lockedPartners }) {
  const activeIds = queue.filter((id) => players.some((player) => player.id === id && !player.isResting));
  const stats = getPlayerStats(players, history);
  const targetMatches = Math.min(courtCount, Math.floor(activeIds.length / 4));
  const selected = [];
  const used = new Set();

  for (let court = 1; court <= targetMatches; court += 1) {
    const pool = activeIds.filter((id) => !used.has(id));
    const groups = combination(pool, 4);
    if (!groups.length) break;

    const best = groups
      .map((group) => {
        const teams = teamOptions(group, stats, history, lockedPartners)[0];
        const waitingPenalty = group.reduce((sum, id, index) => sum + activeIds.indexOf(id) * (index + 1), 0);
        return { group, ...teams, score: teams.score + waitingPenalty };
      })
      .sort((a, b) => a.score - b.score)[0];

    best.group.forEach((id) => used.add(id));
    selected.push({
      id: `pending-${Date.now()}-${court}`,
      court,
      teamA: best.teamA,
      teamB: best.teamB,
      scoreA: '',
      scoreB: '',
      status: 'pending'
    });
  }

  const nextQueue = [...activeIds.filter((id) => used.has(id)), ...activeIds.filter((id) => !used.has(id))];
  return { matches: selected, queue: nextQueue };
}
