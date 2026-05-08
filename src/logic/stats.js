export function getPlayerStats(players, history) {
  const stats = Object.fromEntries(
    players.map((player) => [
      player.id,
      {
        ...player,
        games: 0,
        wins: 0,
        losses: 0,
        partners: {},
        opponents: {},
        lastOutcome: player.lastOutcome || 'new'
      }
    ])
  );

  history.forEach((match) => {
    const teams = [match.teamA, match.teamB];
    teams.forEach((team, teamIndex) => {
      const won = match.winner === (teamIndex === 0 ? 'A' : 'B');
      const opponents = teams[teamIndex === 0 ? 1 : 0];
      team.forEach((playerId) => {
        if (!stats[playerId]) return;
        stats[playerId].games += 1;
        stats[playerId][won ? 'wins' : 'losses'] += 1;
        team
          .filter((id) => id !== playerId)
          .forEach((partnerId) => {
            stats[playerId].partners[partnerId] = (stats[playerId].partners[partnerId] || 0) + 1;
          });
        opponents.forEach((opponentId) => {
          stats[playerId].opponents[opponentId] = (stats[playerId].opponents[opponentId] || 0) + 1;
        });
      });
    });
  });

  return stats;
}

export function getPairKey(ids) {
  return [...ids].sort().join('|');
}
