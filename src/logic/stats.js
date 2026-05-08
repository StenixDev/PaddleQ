export function getPlayerStats(players, history) {
  const stats = Object.fromEntries(
    players.map((player) => [
      player.id,
      {
        ...player,
        games: 0,
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointDifferential: 0,
        partners: {},
        opponents: {},
        lastOutcome: player.lastOutcome || 'new'
      }
    ])
  );

  history.forEach((match) => {
    const teams = [match.teamA, match.teamB];
    const scores = [Number(match.scoreA) || 0, Number(match.scoreB) || 0];
    teams.forEach((team, teamIndex) => {
      const won = match.winner === (teamIndex === 0 ? 'A' : 'B');
      const opponents = teams[teamIndex === 0 ? 1 : 0];
      const pointsFor = scores[teamIndex];
      const pointsAgainst = scores[teamIndex === 0 ? 1 : 0];
      team.forEach((playerId) => {
        if (!stats[playerId]) return;
        stats[playerId].games += 1;
        stats[playerId][won ? 'wins' : 'losses'] += 1;
        stats[playerId].pointsFor += pointsFor;
        stats[playerId].pointsAgainst += pointsAgainst;
        stats[playerId].pointDifferential = stats[playerId].pointsFor - stats[playerId].pointsAgainst;
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
