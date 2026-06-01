function LogicTest() {
  const players = [
    {
      name: 'Stenix',
      score: 10,
    },

    {
      name: 'htenaj',
      score: 8,
    },

    {
      name: 'Sarge',
      score: 16,
    },

    {
      name: 'rossalen',
      score: 5,
    },

    {
      name: 'Dem',
      score: 7,
    },

    {
      name: 'Petit',
      score: 7,
    },
  ];

  const topScores = [];

  return (
    <div>
      LogicTestx
      <h1>
        The Top Scores
        {topScores[0]}
        {topScores[1]}
        {topScores[2]}
      </h1>
      {players.map((player, index) => (
        <div key={index}>
          {console.log(topScores[0])}
          {player.score > topScores[0]
            ? topScores[0].push(player.score)
            : topScores[0]}
          <p>
            {index} Player: {player.name} Score: {player.score}
          </p>
        </div>
      ))}
    </div>
  );
}
export default LogicTest;
