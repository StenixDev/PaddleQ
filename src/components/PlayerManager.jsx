import { Coffee, Play, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { usePickleball } from '../state/PickleballContext.jsx';

export default function PlayerManager() {
  const { state, dispatch } = usePickleball();
  const [name, setName] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  function addPlayer(event) {
    event.preventDefault();
    if (!name.trim()) return;
    dispatch({ type: 'addPlayer', name });
    setName('');
  }

  return (
    <section className='glass-panel p-4'>
      <div className='mb-4 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <h2 className='text-lg font-semibold text-slate-100'>Players</h2>

          <span className='rounded-md bg-ball-100 px-2 py-1 text-sm font-semibold text-court-900'>
            {state.players.length}
          </span>
        </div>

        {/* Collapse button only on mobile/tablet */}

        {state.players.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to proceed?')) {
                dispatch({ type: 'deleteAllData' });
              }
            }}
            className='primary-action px-3'
          >
            New Game
          </button>
        )}

        <button
          type='button'
          onClick={() => setIsCollapsed(!isCollapsed)}
          className='ghost-action px-3 py-1 lg:hidden'
        >
          {isCollapsed ? 'Show' : 'Hide'}
        </button>
      </div>

      {/* Always open on lg screens */}
      <div className={`${isCollapsed ? 'hidden' : 'block'} lg:block`}>
        <form onSubmit={addPlayer} className='mb-4 flex gap-2'>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className='field-control min-w-0 flex-1'
            placeholder='Add player'
          />

          <button
            className='inline-flex h-10 w-10 items-center justify-center rounded-lg bg-court-700 text-white shadow-sm hover:bg-court-600'
            title='Add player'
          >
            <Plus className='h-5 w-5' />
          </button>
        </form>

        <div className='space-y-2'>
          {state.players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center gap-2 rounded-md ${
                player.isResting ? 'bg-ball-400/10 p-1' : ''
              }`}
            >
              <input
                value={player.name}
                onChange={(event) =>
                  dispatch({
                    type: 'renamePlayer',
                    id: player.id,
                    name: event.target.value,
                  })
                }
                className='field-control min-w-0 flex-1'
              />

              <button
                onClick={() => dispatch({ type: 'toggleRest', id: player.id })}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-md border ${
                  player.isResting
                    ? 'border-ball-300/40 bg-ball-400/15 text-ball-100 hover:bg-ball-400/20'
                    : 'border-white/10 text-slate-400 hover:border-ball-300/40 hover:text-ball-100'
                }`}
                title={player.isResting ? 'Resume player' : 'Rest player'}
              >
                {player.isResting ? (
                  <Play className='h-4 w-4' />
                ) : (
                  <Coffee className='h-4 w-4' />
                )}
              </button>

              <button
                onClick={() =>
                  dispatch({ type: 'removePlayer', id: player.id })
                }
                className='inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-slate-400 hover:border-paddle-400/40 hover:text-paddle-100'
                title='Remove player'
              >
                <Trash2 className='h-4 w-4' />
              </button>
            </div>
          ))}
        </div>

        {state.players.some((player) => player.isResting) ? (
          <p className='mt-3 text-sm text-ball-100'>
            Resting players remain checked in but are skipped by generated
            matches.
          </p>
        ) : null}
      </div>
    </section>
  );
}
