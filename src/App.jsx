import { CodeSquareIcon, UsersRound } from 'lucide-react';
import CourtView from './components/CourtView.jsx';
import MatchHistory from './components/MatchHistory.jsx';
import PartnerLockManager from './components/PartnerLockManager.jsx';
import PlayerManager from './components/PlayerManager.jsx';
import QueueManager from './components/QueueManager.jsx';
import StatsDashboard from './components/StatsDashboard.jsx';
import { usePickleball } from './state/PickleballContext.jsx';

export default function App() {
  const { state } = usePickleball();
  const isSharedView = Boolean(state.shareMeta);
  const activePlayers = state.players.filter((player) => !player.isResting);
  const availableCourts = Math.min(
    state.courtCount,
    Math.floor(activePlayers.length / 4),
  );

  return (
    <main className='min-h-screen'>
      <header className='border-b border-slate-200 bg-white'>
        <div className='mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8'>
          <div>
            <div className='mb-2 inline-flex items-center gap-2 rounded-md bg-court-50 px-2 py-1 text-xs font-semibold text-court-700'>
              <CodeSquareIcon className='h-3.5 w-3.5' />
              <a href='https://stenix.dev' target='_blank'>
                Stenix.dev
              </a>
            </div>
            <h1 className='text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl'>
              PaddleQ
            </h1>
          </div>
          {!isSharedView ? (
            <div className='grid grid-cols-3 gap-2 text-center'>
              <Metric label='Players' value={activePlayers.length} />
              <Metric label='Courts' value={state.courtCount} />
              <Metric label='Playable' value={availableCourts} />
            </div>
          ) : null}
        </div>
      </header>

      <div
        className={`mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:px-8 ${
          isSharedView ? '' : 'lg:grid-cols-[360px_1fr]'
        }`}
      >
        <div className='block lg:hidden'>
          <CourtView />
        </div>

        {!isSharedView ? (
          <aside className='space-y-5'>
            <PlayerManager />
            <QueueManager />
            <PartnerLockManager />
          </aside>
        ) : null}
        <div className='space-y-5'>
          {!isSharedView ? (
            <div className='hidden lg:block'>
              <CourtView />
            </div>
          ) : null}
          <StatsDashboard />
          <MatchHistory />
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div className='min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 sm:px-3'>
      <div className='flex items-center justify-center gap-1 text-xs uppercase tracking-wide text-slate-500'>
        {label === 'Players' ? <UsersRound className='h-3.5 w-3.5' /> : null}
        {label}
      </div>
      <div className='text-xl font-bold text-slate-950'>{value}</div>
    </div>
  );
}
