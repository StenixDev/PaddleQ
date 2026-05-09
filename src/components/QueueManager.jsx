import { GripVertical } from 'lucide-react';
import { useState } from 'react';
import { usePickleball } from '../state/PickleballContext.jsx';
import PlayerBadge from './PlayerBadge.jsx';

export default function QueueManager() {
  const { state, dispatch } = usePickleball();
  const [dragIndex, setDragIndex] = useState(null);

  return (
    <section className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm'>
      <div className='mb-4'>
        <div>
          <h2 className='text-lg font-semibold text-slate-950'>
            Waiting Queue
          </h2>
          <p className='text-sm text-slate-500'>
            Lowest game counts are prioritized automatically.
          </p>
        </div>
      </div>
      <div className='space-y-2'>
        {state.queue.map((id, index) => (
          <div
            key={id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragIndex !== null && dragIndex !== index) {
                dispatch({ type: 'reorderQueue', from: dragIndex, to: index });
              }
              setDragIndex(null);
            }}
            onDragEnd={() => setDragIndex(null)}
            className={`flex cursor-grab items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 ${
              dragIndex === index ? 'dragging' : ''
            }`}
          >
            <GripVertical className='h-4 w-4 flex-none text-slate-400' />
            <span className='w-6 text-sm font-semibold text-slate-400'>
              {index + 1}
            </span>
            <PlayerBadge id={id} subtle />
          </div>
        ))}
      </div>
    </section>
  );
}
