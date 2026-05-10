import { Shuffle, SlidersHorizontal } from 'lucide-react';
import { usePickleball } from '../state/PickleballContext.jsx';
import MatchCard from './MatchCard.jsx';

export default function CourtView() {
  const { state, dispatch } = usePickleball();

  return (
    <section className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm '>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 className='text-lg font-semibold text-slate-950'>Courts</h2>
          <p className='text-sm text-slate-500'>
            Active matches ready for result recording.
          </p>
        </div>
        <label className='inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700'>
          <SlidersHorizontal className='h-4 w-4' />
          <span>Courts</span>
          <input
            type='number'
            min='1'
            value={state.courtCount}
            onChange={(event) =>
              dispatch({ type: 'setCourtCount', count: event.target.value })
            }
            className='w-14 border-0 bg-transparent text-right font-semibold outline-none'
          />
        </label>
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
