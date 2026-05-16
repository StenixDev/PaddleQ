import { Minus, Plus, Shuffle, SlidersHorizontal } from 'lucide-react';
import { usePickleball } from '../state/PickleballContext.jsx';
import MatchCard from './MatchCard.jsx';

export default function CourtView() {
  const { state, dispatch } = usePickleball();

  return (
    <section className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm '>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 className='text-lg font-semibold text-slate-950'>Courts</h2>
        </div>
        <div className='inline-flex items-center gap-2 rounded-md border border-slate-200 px-2 py-2 text-sm text-slate-700'>
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
            className='inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'
            title='Decrease courts'
          >
            <Minus className='h-4 w-4' />
          </button>
          <span className='w-6 text-center font-semibold text-slate-950'>
            {state.courtCount}
          </span>
          <button
            onClick={() =>
              dispatch({
                type: 'setCourtCount',
                count: state.courtCount + 1,
              })
            }
            className='inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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

          <div className=' p-2 text-center pt-6'>
            <button
              onClick={() => dispatch({ type: 'generateMatches' })}
              className='inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800'
            >
              <Shuffle className='h-4 w-4' />
              Generate Next Matches
            </button>
          </div>
        </>
      ) : (
        <div className='rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center'>
          <button
            onClick={() => dispatch({ type: 'generateMatches' })}
            className='inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800'
          >
            <Shuffle className='h-4 w-4' />
            Generate Next Matches
          </button>
        </div>
      )}
    </section>
  );
}
