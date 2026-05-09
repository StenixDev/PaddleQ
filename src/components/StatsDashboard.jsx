import { BarChart3, Copy, Save, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { usePickleball } from '../state/PickleballContext.jsx';
import { createShareLink } from '../utils/share.js';

function formatPercent(wins, games) {
  if (!games) return '0%';
  return `${Math.round((wins / games) * 100)}%`;
}

function relatedNames(map, playerMap) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, count]) => `${playerMap[id]?.name || 'Removed'} (${count})`)
    .join(', ');
}

export default function StatsDashboard() {
  const { state, stats, playerMap, dispatch } = usePickleball();
  const [sort, setSort] = useState({ key: 'games', direction: 'asc' });
  const [showSave, setShowSave] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareTitle, setShareTitle] = useState(state.shareMeta?.title || '');
  const [shareDate, setShareDate] = useState(
    state.shareMeta?.date || new Date().toISOString().slice(0, 10),
  );
  const rows = useMemo(() => {
    return state.players
      .map((player) => stats[player.id])
      .sort((a, b) => {
        const direction = sort.direction === 'asc' ? 1 : -1;
        if (sort.key === 'name')
          return a.name.localeCompare(b.name) * direction;
        if (sort.key === 'winPercentage') {
          const aValue = a.games ? a.wins / a.games : 0;
          const bValue = b.games ? b.wins / b.games : 0;
          return (aValue - bValue) * direction || a.name.localeCompare(b.name);
        }
        return (
          ((a[sort.key] || 0) - (b[sort.key] || 0)) * direction ||
          a.name.localeCompare(b.name)
        );
      });
  }, [state.players, stats, sort]);

  function changeSort(key) {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  }

  return (
    <section className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm'>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <BarChart3 className='h-5 w-5 text-court-700' />
          <div>
            <h2 className='text-lg font-semibold text-slate-950'>
              Player Stats
            </h2>
            {state.shareMeta ? (
              <p className='text-sm text-slate-500'>
                {state.shareMeta.title}{' '}
                {state.shareMeta.date ? `- ${state.shareMeta.date}` : ''}
              </p>
            ) : null}
          </div>
        </div>
        {!state.shareMeta ? <div className='flex flex-wrap gap-2'></div> : null}
      </div>
      <div className='mb-3 grid gap-2 lg:hidden'>
        <label className='text-xs font-bold uppercase tracking-wide text-slate-500'>
          Sort by
          <select
            value={`${sort.key}:${sort.direction}`}
            onChange={(event) => {
              const [key, direction] = event.target.value.split(':');
              setSort({ key, direction });
            }}
            className='mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20'
          >
            <option value='games:asc'>Games, low to high</option>
            <option value='games:desc'>Games, high to low</option>
            <option value='wins:desc'>Wins, high to low</option>
            <option value='losses:desc'>Losses, high to low</option>
            <option value='winPercentage:desc'>Win %, high to low</option>
            <option value='pointsFor:desc'>PF, high to low</option>
            <option value='pointsAgainst:desc'>PA, high to low</option>
            <option value='pointDifferential:desc'>+/-, high to low</option>
            <option value='name:asc'>Player, A to Z</option>
          </select>
        </label>
      </div>

      <div className='space-y-3 lg:hidden'>
        {rows.map((row) => (
          <article
            key={row.id}
            className='rounded-md border border-slate-200 bg-slate-50 p-3'
          >
            <div className='mb-3 flex items-center justify-between gap-2'>
              <h3 className='min-w-0 truncate font-semibold text-slate-950'>
                {row.name}
              </h3>
              <span className='rounded-md bg-white px-2 py-1 text-sm font-bold text-slate-700'>
                {formatPercent(row.wins, row.games)}
              </span>
            </div>
            <div className='grid grid-cols-4 gap-2 text-center'>
              <MobileMetric label='Games' value={row.games} />
              <MobileMetric
                label='W'
                value={row.wins}
                tone='text-emerald-700'
              />
              <MobileMetric label='L' value={row.losses} tone='text-rose-700' />
              <MobileMetric
                label='+/-'
                value={`${row.pointDifferential > 0 ? '+' : ''}${row.pointDifferential}`}
                tone={
                  row.pointDifferential >= 0
                    ? 'text-emerald-700'
                    : 'text-rose-700'
                }
              />
            </div>
            <div className='mt-2 grid grid-cols-2 gap-2 text-center'>
              <MobileMetric label='PF' value={row.pointsFor} />
              <MobileMetric label='PA' value={row.pointsAgainst} />
            </div>
            <div className='mt-3 space-y-1 text-sm text-slate-500'>
              <p className='truncate'>
                <span className='font-medium text-slate-700'>Partners:</span>{' '}
                {relatedNames(row.partners, playerMap) || 'None'}
              </p>
              <p className='truncate'>
                <span className='font-medium text-slate-700'>Opponents:</span>{' '}
                {relatedNames(row.opponents, playerMap) || 'None'}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className='hidden lg:block'>
        <table className='min-w-full text-left text-sm'>
          <thead className='border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500'>
            <tr>
              <SortableHeader
                label='Player'
                sortKey='name'
                sort={sort}
                onSort={changeSort}
              />
              <SortableHeader
                label='Games'
                sortKey='games'
                sort={sort}
                onSort={changeSort}
                align='right'
              />
              <SortableHeader
                label='W'
                sortKey='wins'
                sort={sort}
                onSort={changeSort}
                align='right'
              />
              <SortableHeader
                label='L'
                sortKey='losses'
                sort={sort}
                onSort={changeSort}
                align='right'
              />
              <SortableHeader
                label='Win %'
                sortKey='winPercentage'
                sort={sort}
                onSort={changeSort}
                align='right'
              />
              <SortableHeader
                label='PF'
                sortKey='pointsFor'
                sort={sort}
                onSort={changeSort}
                align='right'
              />
              <SortableHeader
                label='PA'
                sortKey='pointsAgainst'
                sort={sort}
                onSort={changeSort}
                align='right'
              />
              <SortableHeader
                label='+/-'
                sortKey='pointDifferential'
                sort={sort}
                onSort={changeSort}
                align='right'
              />
              <th className='py-2 pr-3'>Partners</th>
              <th className='py-2'>Opponents</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100'>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className='py-2 pr-3 font-medium text-slate-900'>
                  {row.name}
                </td>
                <td className='py-2 pr-3 text-center'>{row.games}</td>
                <td className='py-2 pr-3 text-center text-emerald-700'>
                  {row.wins}
                </td>
                <td className='py-2 pr-3 text-center text-rose-700'>
                  {row.losses}
                </td>
                <td className='py-2 pr-3 text-center'>
                  {formatPercent(row.wins, row.games)}
                </td>
                <td className='py-2 pr-3 text-center font-medium text-slate-900'>
                  {row.pointsFor}
                </td>
                <td className='py-2 pr-3 text-center text-slate-600'>
                  {row.pointsAgainst}
                </td>
                <td
                  className={`py-2 pr-3 text-center font-medium ${row.pointDifferential >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}
                >
                  {row.pointDifferential > 0 ? '+' : ''}
                  {row.pointDifferential}
                </td>
                <td className='max-w-52 py-2 pr-3 text-slate-500'>
                  {relatedNames(row.partners, playerMap) || 'None'}
                </td>
                <td className='max-w-52 py-2 text-slate-500'>
                  {relatedNames(row.opponents, playerMap) || 'None'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showSave ? (
        <SaveDialog
          title={shareTitle}
          date={shareDate}
          link={shareLink}
          onTitleChange={setShareTitle}
          onDateChange={setShareDate}
          onClose={() => setShowSave(false)}
          onSave={() => {
            const snapshot = {
              version: 1,
              title: shareTitle.trim() || 'Pickleball Results',
              date: shareDate,
              savedAt: new Date().toISOString(),
              players: state.players.map(({ id, name }) => ({ id, name })),
              history: state.history,
            };
            setShareLink(createShareLink(snapshot));
          }}
        />
      ) : null}
    </section>
  );
}

function SaveDialog({
  title,
  date,
  link,
  onTitleChange,
  onDateChange,
  onClose,
  onSave,
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-end bg-slate-950/40 p-3 sm:items-center sm:justify-center'>
      <div className='w-full rounded-lg bg-white p-4 shadow-xl sm:max-w-lg'>
        <div className='mb-4 flex items-center justify-between gap-3'>
          <h3 className='text-lg font-semibold text-slate-950'>Save Results</h3>
          <button
            onClick={onClose}
            className='inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50'
            title='Close'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
        <div className='grid gap-3'>
          <label className='text-sm font-medium text-slate-700'>
            Game title
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20'
              placeholder='Saturday Open Play'
            />
          </label>
          <label className='text-sm font-medium text-slate-700'>
            Game date
            <input
              type='date'
              value={date}
              onChange={(event) => onDateChange(event.target.value)}
              className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20'
            />
          </label>
          <button
            onClick={onSave}
            className='inline-flex items-center justify-center gap-2 rounded-md bg-court-700 px-3 py-2 text-sm font-medium text-white hover:bg-court-500'
          >
            <Save className='h-4 w-4' />
            Generate Share Link
          </button>
          {link ? (
            <div className='rounded-md border border-slate-200 bg-slate-50 p-3'>
              <div className='mb-2 text-xs font-bold uppercase tracking-wide text-slate-500'>
                Shareable link
              </div>
              <div className='flex gap-2'>
                <input
                  value={link}
                  readOnly
                  className='min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700'
                />
                <button
                  onClick={copyLink}
                  className='inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  title='Copy link'
                >
                  <Copy className='h-4 w-4' />
                </button>
              </div>
              <p className='mt-2 text-sm text-slate-500'>
                {copied
                  ? 'Copied.'
                  : 'Anyone with this link can view the saved results.'}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MobileMetric({ label, value, tone = 'text-slate-900' }) {
  return (
    <div className='min-w-0 rounded-md bg-white px-2 py-2'>
      <div className='truncate text-[11px] font-bold uppercase tracking-wide text-slate-400'>
        {label}
      </div>
      <div className={`truncate text-base font-black ${tone}`}>{value}</div>
    </div>
  );
}

function SortableHeader({ label, sortKey, sort, onSort, align = 'left' }) {
  const active = sort.key === sortKey;
  return (
    <th className={`py-2 pr-3 ${align === 'right' ? 'text-right' : ''}`}>
      <button
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-slate-100 ${
          align === 'right' ? 'justify-end' : ''
        } ${active ? 'text-slate-950' : 'text-slate-500'}`}
      >
        {label}
        <span className='inline-block w-3 text-[10px]'>
          {active ? (sort.direction === 'asc' ? '^' : 'v') : ''}
        </span>
      </button>
    </th>
  );
}
