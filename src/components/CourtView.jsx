import { Minus, Plus, Shuffle, SlidersHorizontal } from 'lucide-react';
import { usePickleball } from '../state/PickleballContext.jsx';
import MatchCard from './MatchCard.jsx';

export default function CourtView() {
  const { state, dispatch } = usePickleball();

  return (
    <section className='glass-panel-strong p-4'>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 className='text-lg font-semibold text-slate-100'>Courts</h2>
        </div>
        <div className='inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-2 py-2 text-sm text-slate-200 shadow-sm backdrop-blur-md'>
          <SlidersHorizontal className='h-4 w-4' />
          <span>Courts</span>
          <button
            onClick={() =>
              dispatch({
                type: 'setCourtCount',
                count: Math.max(1, state.courtCount - 1),
              })
            }
            disabled={state.courtCount <= 1}
            className='inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.08] text-slate-200 hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-40'
            title='Decrease courts'
          >
            <Minus className='h-4 w-4' />
          </button>
          <span className='w-6 text-center font-semibold text-slate-100'>
            {state.courtCount}
          </span>
          <button
            onClick={() =>
              dispatch({
                type: 'setCourtCount',
                count: state.courtCount + 1,
              })
            }
            className='inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.08] text-slate-200 hover:bg-white/[0.14]'
            title='Increase courts'
          >
            <Plus className='h-4 w-4' />
          </button>
        </div>
      </div>
      {state.activeMatches.length ? (
        <>
          <div className='grid gap-4'>
            {state.activeMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>

          {state.activeMatches.length !== state.courtCount && (
            <div className=' p-2 text-center pt-6'>
              <button
                onClick={() => dispatch({ type: 'generateMatches' })}
                className='primary-action'
              >
                <Shuffle className='h-4 w-4' />
                Generate Matches
              </button>
            </div>
          )}
        </>
      ) : (
        <div className='rounded-lg border border-dashed border-white/10 bg-white/[0.04] p-6 text-center shadow-inner backdrop-blur-md'>
          <button
            onClick={() => dispatch({ type: 'generateMatches' })}
            className='primary-action'
          >
            <Shuffle className='h-4 w-4' />
            Generate Matches
          </button>
        </div>
      )}
    </section>
  );
}
