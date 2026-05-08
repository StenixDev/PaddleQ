import { Coffee, Play, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { usePickleball } from '../state/PickleballContext.jsx';

export default function PlayerManager() {
  const { state, dispatch } = usePickleball();
  const [name, setName] = useState('');

  function addPlayer(event) {
    event.preventDefault();
    if (!name.trim()) return;
    dispatch({ type: 'addPlayer', name });
    setName('');
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-950">Players</h2>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-sm text-slate-700">{state.players.length}</span>
      </div>
      <form onSubmit={addPlayer} className="mb-4 flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20"
          placeholder="Add player"
        />
        <button className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-court-700 text-white hover:bg-court-500" title="Add player">
          <Plus className="h-5 w-5" />
        </button>
      </form>
      <div className="space-y-2">
        {state.players.map((player) => (
          <div key={player.id} className={`flex items-center gap-2 rounded-md ${player.isResting ? 'bg-amber-50 p-1' : ''}`}>
            <input
              value={player.name}
              onChange={(event) => dispatch({ type: 'renamePlayer', id: player.id, name: event.target.value })}
              className="min-w-0 flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-court-500"
            />
            <button
              onClick={() => dispatch({ type: 'toggleRest', id: player.id })}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-md border ${
                player.isResting
                  ? 'border-court-500 bg-court-50 text-court-700 hover:bg-court-100'
                  : 'border-slate-200 text-slate-500 hover:border-amber-200 hover:text-amber-700'
              }`}
              title={player.isResting ? 'Resume player' : 'Rest player'}
            >
              {player.isResting ? <Play className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
            </button>
            <button
              onClick={() => dispatch({ type: 'removePlayer', id: player.id })}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-rose-200 hover:text-rose-600"
              title="Remove player"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      {state.players.some((player) => player.isResting) ? (
        <p className="mt-3 text-sm text-amber-700">Resting players remain checked in but are skipped by generated matches.</p>
      ) : null}
    </section>
  );
}
