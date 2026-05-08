import { Link2, Lock, Unlock } from 'lucide-react';
import { useState } from 'react';
import { usePickleball } from '../state/PickleballContext.jsx';

export default function PartnerLockManager() {
  const { state, playerMap, dispatch } = usePickleball();
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');

  function toggleLock() {
    if (!first || !second || first === second) return;
    dispatch({ type: 'togglePartnerLock', ids: [first, second] });
    setFirst('');
    setSecond('');
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Link2 className="h-5 w-5 text-court-700" />
        <h2 className="text-lg font-semibold text-slate-950">Partner Locks</h2>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <SelectPlayer value={first} onChange={setFirst} players={state.players} />
        <SelectPlayer value={second} onChange={setSecond} players={state.players.filter((player) => player.id !== first)} />
        <button
          onClick={toggleLock}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          <Lock className="h-4 w-4" />
          Lock
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {state.lockedPartners.length ? (
          state.lockedPartners.map((lock) => (
            <button
              key={lock.id}
              onClick={() => dispatch({ type: 'togglePartnerLock', ids: [lock.a, lock.b] })}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:border-rose-200 hover:text-rose-700"
            >
              <Unlock className="h-4 w-4" />
              {playerMap[lock.a]?.name} + {playerMap[lock.b]?.name}
            </button>
          ))
        ) : (
          <p className="text-sm text-slate-500">No locked partners.</p>
        )}
      </div>
    </section>
  );
}

function SelectPlayer({ value, onChange, players }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20"
    >
      <option value="">Select player</option>
      {players.map((player) => (
        <option key={player.id} value={player.id}>
          {player.name}
        </option>
      ))}
    </select>
  );
}
