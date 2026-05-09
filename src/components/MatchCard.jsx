import { CheckCircle2, Replace } from 'lucide-react';
import { usePickleball } from '../state/PickleballContext.jsx';
import PlayerBadge from './PlayerBadge.jsx';

export default function MatchCard({ match }) {
  const { state, dispatch } = usePickleball();
  const currentMatchIds = [...match.teamA, ...match.teamB];
  const hasBothScores = match.scoreA !== '' && match.scoreB !== '' && match.scoreA !== undefined && match.scoreB !== undefined;
  const isTie = hasBothScores && Number(match.scoreA) === Number(match.scoreB);
  const assignedElsewhere = new Set(
    state.activeMatches
      .filter((item) => item.id !== match.id)
      .flatMap((item) => [...item.teamA, ...item.teamB])
  );
  const substituteOptions = state.players.filter((player) => !player.isResting && !assignedElsewhere.has(player.id));

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-950">Court {match.court}</h3>
        <span className="rounded-md bg-court-50 px-2 py-1 text-xs font-semibold text-court-700">Doubles</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <Team players={match.teamA} label="Team A" matchId={match.id} currentMatchIds={currentMatchIds} options={substituteOptions} />
        <div className="text-center text-xs font-bold uppercase tracking-wide text-slate-400">vs</div>
        <Team players={match.teamB} label="Team B" matchId={match.id} currentMatchIds={currentMatchIds} options={substituteOptions} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <ScoreInput
          label="Team A Score"
          value={match.scoreA}
          onChange={(value) => dispatch({ type: 'updateMatchScore', matchId: match.id, field: 'scoreA', value })}
        />
        <div className="hidden pb-2 text-center text-sm font-bold text-slate-300 sm:block">-</div>
        <ScoreInput
          label="Team B Score"
          value={match.scoreB}
          onChange={(value) => dispatch({ type: 'updateMatchScore', matchId: match.id, field: 'scoreB', value })}
        />
      </div>
      <div className="mt-4">
        <button
          onClick={() => dispatch({ type: 'recordResult', matchId: match.id })}
          disabled={!hasBothScores || isTie}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          title={isTie ? 'Scores must not be tied' : 'Record match result'}
        >
          <CheckCircle2 className="h-4 w-4" />
          {hasBothScores ? 'Done' : 'Enter Scores'}
        </button>
      </div>
    </article>
  );
}

function ScoreInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type="number"
        min="0"
        inputMode="numeric"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-center text-lg font-bold text-slate-950 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20"
        placeholder="0"
      />
    </label>
  );
}

function Team({ players, label, matchId, currentMatchIds, options }) {
  const { dispatch } = usePickleball();

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="space-y-2">
        {players.map((id) => (
          <div key={id} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
            <PlayerBadge id={id} />
            <label className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-600">
              <Replace className="h-4 w-4" />
              <select
                value={id}
                onChange={(event) =>
                  dispatch({ type: 'substitutePlayer', matchId, fromId: id, toId: event.target.value })
                }
                className="min-w-0 bg-transparent outline-none"
                title="Substitute player"
              >
                {options
                  .filter((player) => player.id === id || !currentMatchIds.includes(player.id))
                  .map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
