import { Download, History, RotateCcw } from 'lucide-react';
import { usePickleball } from '../state/PickleballContext.jsx';

import PlayerBadge from './PlayerBadge.jsx';

export default function MatchHistory() {
  const { state, playerMap, dispatch } = usePickleball();

  return (
    <section className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm'>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <History className='h-5 w-5 text-court-700' />
          <h2 className='text-lg font-semibold text-slate-950'>
            Match History
          </h2>
        </div>
        <div className='flex flex-wrap gap-2'>
          <button
            onClick={() => dispatch({ type: 'clearHistory' })}
            className='inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50'
          >
            <RotateCcw className='h-4 w-4' />
            Clear
          </button>
        </div>
      </div>
      <div className='space-y-3'>
        {state.history.length ? (
          state.history.map((match, index) => (
            <article
              key={match.id}
              className='rounded-md border border-slate-200 bg-slate-50 p-3'
            >
              <div className='mb-2 flex items-center justify-between text-xs text-slate-500'>
                <span>
                  Game {state.history.length - index} · Court {match.court}
                </span>
                <span>{new Date(match.completedAt).toLocaleString()}</span>
              </div>
              <label className='mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-600'>
                <span className='text-xs font-bold uppercase tracking-wide text-slate-500'>
                  Winner
                </span>
                <select
                  value={match.winner}
                  onChange={(event) =>
                    dispatch({
                      type: 'updateHistoryWinner',
                      matchId: match.id,
                      winner: event.target.value,
                    })
                  }
                  className='rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20'
                >
                  <option value='A'>Team 1</option>
                  <option value='B'>Team 2</option>
                </select>
              </label>
              <div className='grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center'>
                <HistoryTeam
                  players={match.teamA}
                  won={match.winner === 'A'}
                  score={match.scoreA}
                  onScoreChange={(value) =>
                    dispatch({
                      type: 'updateHistoryScore',
                      matchId: match.id,
                      field: 'scoreA',
                      value,
                    })
                  }
                />
                <div className='text-center'>
                  <div className='text-xs font-bold text-slate-400'>vs</div>
                  {match.scoreA !== '' || match.scoreB !== '' ? (
                    <div className='mt-1 text-lg font-black text-slate-800'>
                      {match.scoreA || 0}-{match.scoreB || 0}
                    </div>
                  ) : null}
                </div>
                <HistoryTeam
                  players={match.teamB}
                  won={match.winner === 'B'}
                  score={match.scoreB}
                  onScoreChange={(value) =>
                    dispatch({
                      type: 'updateHistoryScore',
                      matchId: match.id,
                      field: 'scoreB',
                      value,
                    })
                  }
                />
              </div>
            </article>
          ))
        ) : (
          <div className='rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500'>
            Completed matches will appear here.
          </div>
        )}
      </div>
    </section>
  );
}

function HistoryTeam({ players, won, score, onScoreChange }) {
  return (
    <div
      className={`rounded-md border p-2 ${won ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}
    >
      <div className='mb-2 flex items-center justify-between gap-2'>
        <span
          className={`text-xs font-bold uppercase tracking-wide ${won ? 'text-emerald-700' : 'text-slate-400'}`}
        >
          {won ? 'Winner' : 'Loser'}
        </span>
        <label className='inline-flex items-center gap-1 text-xs font-semibold text-slate-500'>
          Score
          <input
            type='number'
            min='0'
            inputMode='numeric'
            value={score ?? ''}
            onChange={(event) => onScoreChange(event.target.value)}
            className='h-8 w-14 rounded-md border border-slate-200 bg-white px-2 text-center text-sm font-black text-slate-900 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20'
            placeholder='0'
          />
        </label>
      </div>
      <div className='flex flex-wrap gap-2'>
        {players.map((id) => (
          <PlayerBadge key={id} id={id} subtle />
        ))}
      </div>
    </div>
  );
}
