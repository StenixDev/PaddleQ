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
    <section className='glass-panel p-4'>
      <div className='mb-4 flex items-center gap-2'>
        <Link2 className='h-5 w-5 text-ball-300' />
        <h2 className='text-lg font-semibold text-slate-100'>Partner Locks</h2>
      </div>
      <div className='grid gap-2 sm:grid-cols-[1fr_1fr_auto]'>
        <SelectPlayer
          value={first}
          onChange={setFirst}
          players={state.players}
        />
        <SelectPlayer
          value={second}
          onChange={setSecond}
          players={state.players.filter((player) => player.id !== first)}
        />
        <button
          onClick={toggleLock}
          className='court-action'
        >
          <Lock className='h-4 w-4' />
        </button>
      </div>
      <div className='mt-3 flex flex-wrap gap-2'>
        {state.lockedPartners.length ? (
          state.lockedPartners.map((lock) => (
            <button
              key={lock.id}
              onClick={() =>
                dispatch({ type: 'togglePartnerLock', ids: [lock.a, lock.b] })
              }
              className='danger-action'
            >
              <Unlock className='h-4 w-4' />
              {playerMap[lock.a]?.name} + {playerMap[lock.b]?.name}
            </button>
          ))
        ) : (
          <p className='text-sm text-slate-400'>No locked partners.</p>
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
      className='field-control'
    >
      <option value=''>Select player</option>
      {players.map((player) => (
        <option key={player.id} value={player.id}>
          {player.name}
        </option>
      ))}
    </select>
  );
}
