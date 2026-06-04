import { CheckCircle2, Pencil, Repeat2, Replace } from 'lucide-react';
import { useState } from 'react';
import { usePickleball } from '../state/PickleballContext.jsx';
import PlayerBadge from './PlayerBadge.jsx';

export default function MatchCard({ match }) {
  const { state, playerMap, dispatch } = usePickleball();
  const [isEditingPlayers, setIsEditingPlayers] = useState(false);
  const currentMatchIds = [...match.teamA, ...match.teamB];
  const hasBothScores =
    match.scoreA !== '' &&
    match.scoreB !== '' &&
    match.scoreA !== undefined &&
    match.scoreB !== undefined;
  const isTie = hasBothScores && Number(match.scoreA) === Number(match.scoreB);
  const assignedElsewhere = new Set(
    state.activeMatches
      .filter((item) => item.id !== match.id)
      .flatMap((item) => [...item.teamA, ...item.teamB]),
  );
  const substituteOptions = state.players.filter(
    (player) => !player.isResting && !assignedElsewhere.has(player.id),
  );
  const pairings = getPairingOptions(match, state.lockedPartners, playerMap);
  const selectedPairingIndex = Math.max(
    0,
    pairings.findIndex((pairing) => pairing.isCurrent),
  );

  return (
    <article className='glass-panel-strong p-4'>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <h3 className='font-semibold text-slate-100'>Court {match.court}</h3>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => setIsEditingPlayers((value) => !value)}
            className='ghost-action px-2 py-1 text-xs'
          >
            <Pencil className='h-3.5 w-3.5' />
            {isEditingPlayers ? 'Done' : 'Edit'}
          </button>
          <span className='rounded-md bg-ball-100 px-2 py-1 text-xs font-bold text-court-900'>
            Doubles
          </span>
        </div>
      </div>
      <div className='grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center'>
        <Team
          players={match.teamA}
          label='Team A'
          matchId={match.id}
          currentMatchIds={currentMatchIds}
          options={substituteOptions}
          isEditing={isEditingPlayers}
        />
        <div className='text-center text-xs font-bold uppercase tracking-wide text-slate-400'>
          vs
        </div>
        <Team
          players={match.teamB}
          label='Team B'
          matchId={match.id}
          currentMatchIds={currentMatchIds}
          options={substituteOptions}
          isEditing={isEditingPlayers}
        />
      </div>
      {isEditingPlayers ? (
        <label className='mt-3 flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-slate-400'>
          Partner Pairing
          <div className='flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.07] px-3 py-2 text-sm normal-case tracking-normal text-slate-100 backdrop-blur-md'>
            <Repeat2 className='h-4 w-4 text-ball-300' />
            <select
              value={selectedPairingIndex}
              onChange={(event) =>
                dispatch({
                  type: 'setMatchPartnerPairing',
                  matchId: match.id,
                  pairingIndex: Number(event.target.value),
                })
              }
              className='min-w-0 flex-1 bg-transparent font-medium outline-none'
            >
              {pairings.map((pairing, index) => (
                <option
                  key={pairing.key}
                  value={index}
                  className='bg-slate-950 text-slate-100'
                >
                  {pairing.label}
                </option>
              ))}
            </select>
          </div>
        </label>
      ) : null}
      <div className='mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end'>
        <ScoreInput
          label='Team A Score'
          value={match.scoreA}
          onChange={(value) =>
            dispatch({
              type: 'updateMatchScore',
              matchId: match.id,
              field: 'scoreA',
              value,
            })
          }
        />
        <div className='hidden pb-2 text-center text-sm font-bold text-slate-300 sm:block'>
          -
        </div>
        <ScoreInput
          label='Team B Score'
          value={match.scoreB}
          onChange={(value) =>
            dispatch({
              type: 'updateMatchScore',
              matchId: match.id,
              field: 'scoreB',
              value,
            })
          }
        />
      </div>
      <div className='mt-4'>
        <button
          onClick={() => {
            dispatch({ type: 'recordResult', matchId: match.id });

            dispatch({ type: 'generateMatches' });
          }}
          disabled={!hasBothScores || isTie}
          className='primary-action w-full disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.06] disabled:text-slate-500 disabled:shadow-none'
          title={isTie ? 'Scores must not be tied' : 'Record match result'}
        >
          <CheckCircle2 className='h-4 w-4' />
          {hasBothScores ? 'Done' : 'Enter Scores'}
        </button>
      </div>
    </article>
  );
}

function getPairingOptions(match, lockedPartners, playerMap) {
  const [p1, p2] = match.teamA;
  const [p3, p4] = match.teamB;
  const rawPairings = [
    {
      teamA: [p1, p2],
      teamB: [p3, p4],
    },
    {
      teamA: [p1, p3],
      teamB: [p2, p4],
    },
    {
      teamA: [p1, p4],
      teamB: [p2, p3],
    },
  ];

  return rawPairings
    .filter((pairing) => pairingRespectsLocks(pairing, lockedPartners))
    .map((pairing) => ({
      ...pairing,
      key: `${pairing.teamA.join('|')}::${pairing.teamB.join('|')}`,
      label: `${formatTeam(pairing.teamA, playerMap)} vs ${formatTeam(pairing.teamB, playerMap)}`,
      isCurrent:
        pairing.teamA.join('|') === match.teamA.join('|') &&
        pairing.teamB.join('|') === match.teamB.join('|'),
    }));
}

function pairingRespectsLocks(pairing, lockedPartners) {
  const players = [...pairing.teamA, ...pairing.teamB];
  return lockedPartners.every((lock) => {
    const hasA = players.includes(lock.a);
    const hasB = players.includes(lock.b);
    if (!hasA && !hasB) return true;
    if (hasA !== hasB) return false;
    return (
      (pairing.teamA.includes(lock.a) && pairing.teamA.includes(lock.b)) ||
      (pairing.teamB.includes(lock.a) && pairing.teamB.includes(lock.b))
    );
  });
}

function formatTeam(ids, playerMap) {
  return ids.map((id) => playerMap[id]?.name || 'Unknown').join(' & ');
}

function ScoreInput({ label, value, onChange }) {
  return (
    <label className='block'>
      <span className='mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400'>
        {label}
      </span>
      <input
        type='number'
        min='0'
        inputMode='numeric'
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className='field-control w-full text-center text-lg font-bold'
        placeholder='0'
      />
    </label>
  );
}

function Team({
  players,
  label,
  matchId,
  currentMatchIds,
  options,
  isEditing,
}) {
  const { dispatch } = usePickleball();

  return (
    <div className='glass-card p-3'>
      <div className='mb-2 text-xs font-bold uppercase tracking-wide text-slate-400'>
        {label}
      </div>
      <div className='space-y-2'>
        {players.map((id) => (
          <div
            key={id}
            className='grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center'
          >
            <PlayerBadge id={id} />
            {isEditing ? (
              <label className='inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.07] px-2 py-1 text-sm text-slate-300 backdrop-blur-md'>
                <Replace className='h-4 w-4' />
                <select
                  value={id}
                  onChange={(event) =>
                    dispatch({
                      type: 'substitutePlayer',
                      matchId,
                      fromId: id,
                      toId: event.target.value,
                    })
                  }
                  className='min-w-0 bg-transparent outline-none'
                  title='Substitute player'
                >
                  {options
                    .filter(
                      (player) =>
                        player.id === id ||
                        !currentMatchIds.includes(player.id),
                    )
                    .map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                </select>
              </label>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
