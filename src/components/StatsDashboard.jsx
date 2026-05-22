import { BarChart3, Copy, Save, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { usePickleball } from '../state/PickleballContext.jsx';
import { createShareLink } from '../utils/share.js';
import emailjs from '@emailjs/browser';

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

export default function StatsDashboard({ colapse }) {
  const { state, stats, playerMap, dispatch } = usePickleball();
  const [sort, setSort] = useState({ key: 'wins', direction: 'desc' });
  const [showSave, setShowSave] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareTitle, setShareTitle] = useState(state.shareMeta?.title || '');
  const [shareDate, setShareDate] = useState(
    state.shareMeta?.date || new Date().toISOString().slice(0, 10),
  );
  const [isCollapsed, setIsCollapsed] = useState(colapse);

  const hasStats = state.history.length > 0;
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
    <section className='glass-panel-strong p-4'>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <BarChart3 className='h-5 w-5 text-ball-300' />
          <div>
            <h2 className='text-lg font-semibold text-slate-100'>
              Leaderboard
            </h2>
            {state.shareMeta ? (
              <p className='text-sm text-slate-400'>
                {state.shareMeta.title}{' '}
                {state.shareMeta.date ? `- ${state.shareMeta.date}` : ''}
              </p>
            ) : null}
          </div>
        </div>
        {state.shareMeta ? (
          <button
            onClick={() => {
              dispatch({ type: 'deleteAllData' });
              const url = new URL(window.location.href);
              url.searchParams.delete('s');
              url.searchParams.delete('share');
              window.history.replaceState(null, '', url.toString());
            }}
            className='primary-action px-3'
          >
            New Game
          </button>
        ) : (
          <div className='flex flex-wrap gap-2'>
            <button
              onClick={() => setShowSave(true)}
              className={`primary-action px-3 ${hasStats ? 'inline-flex' : 'hidden'}`}
            >
              <Save className='h-4 w-4' />
              Save
            </button>

            {/* Collapse button only on mobile/tablet */}
            <button
              type='button'
              onClick={() => setIsCollapsed(!isCollapsed)}
              className='ghost-action px-3 py-1 lg:hidden'
            >
              {isCollapsed ? 'Show' : 'Hide'}
            </button>
          </div>
        )}
      </div>
      <div
        className={`${isCollapsed ? 'hidden' : 'block'} mb-3 grid gap-2 lg:hidden`}
      >
        <label className='text-xs font-bold uppercase tracking-wide text-slate-400'>
          Sort by
          <select
            value={`${sort.key}:${sort.direction}`}
            onChange={(event) => {
              const [key, direction] = event.target.value.split(':');
              setSort({ key, direction });
            }}
            className='field-control mt-1 w-full font-medium normal-case tracking-normal text-slate-200'
          >
            <option value='games:desc'>Games, high to low</option>
            <option value='games:asc'>Games, low to high</option>

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

      <div
        className={`${isCollapsed ? 'hidden' : 'block'} space-y-3 lg:hidden`}
      >
        {rows.map((row, index) => (
          <article key={row.id} className='glass-card p-3'>
            <div className='mb-3 flex items-center justify-between gap-2'>
              <h3 className='min-w-0 truncate font-semibold text-slate-100'>
                #{index + 1} - {row.name}
              </h3>
              <span className='rounded-md bg-white/[0.06] px-2 py-1 text-sm font-bold text-slate-300'>
                {formatPercent(row.wins, row.games)}
              </span>
            </div>
            <div className='grid grid-cols-4 gap-2 text-center'>
              <MobileMetric label='Games' value={row.games} />
              <MobileMetric label='W' value={row.wins} tone='text-court-200' />
              <MobileMetric
                label='L'
                value={row.losses}
                tone='text-paddle-100'
              />
              <MobileMetric
                label='+/-'
                value={`${row.pointDifferential > 0 ? '+' : ''}${row.pointDifferential}`}
                tone={
                  row.pointDifferential >= 0
                    ? 'text-court-200'
                    : 'text-paddle-100'
                }
              />
            </div>
            <div className='mt-2 grid grid-cols-2 gap-2 text-center'>
              <MobileMetric label='PF' value={row.pointsFor} />
              <MobileMetric label='PA' value={row.pointsAgainst} />
            </div>
            <div className='mt-3 space-y-1 text-sm text-slate-400'>
              <p className='truncate'>
                <span className='font-medium text-slate-300'>Partners:</span>{' '}
                {relatedNames(row.partners, playerMap) || 'None'}
              </p>
              <p className='truncate'>
                <span className='font-medium text-slate-300'>Opponents:</span>{' '}
                {relatedNames(row.opponents, playerMap) || 'None'}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className='hidden lg:block'>
        <table className='min-w-full text-left text-sm'>
          <thead className='border-b border-white/10 text-xs uppercase tracking-wide text-slate-400'>
            <tr>
              <td></td>
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
          <tbody className='divide-y divide-white/10'>
            {rows.map((row, index) => (
              <tr key={row.id}>
                <td className='py-2 pr-3 font-medium text-slate-100'>
                  {index + 1}
                </td>
                <td className='py-2 pr-3 font-medium text-slate-100'>
                  {row.name}
                </td>
                <td className='py-2 pr-3 text-right'>{row.games}</td>
                <td className='py-2 pr-3 text-right text-court-200'>
                  {row.wins}
                </td>
                <td className='py-2 pr-3 text-right text-paddle-100'>
                  {row.losses}
                </td>
                <td className='py-2 pr-3 text-right'>
                  {formatPercent(row.wins, row.games)}
                </td>
                <td className='py-2 pr-3 text-right font-medium text-slate-100'>
                  {row.pointsFor}
                </td>
                <td className='py-2 pr-3 text-right text-slate-300'>
                  {row.pointsAgainst}
                </td>
                <td
                  className={`py-2 pr-3 text-right font-medium ${row.pointDifferential >= 0 ? 'text-court-200' : 'text-paddle-100'}`}
                >
                  {row.pointDifferential > 0 ? '+' : ''}
                  {row.pointDifferential}
                </td>
                <td className='max-w-52 py-2 pr-3 text-slate-400'>
                  {relatedNames(row.partners, playerMap) || 'None'}
                </td>
                <td className='max-w-52 py-2 text-slate-400'>
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

  useEffect(() => {
    if (!copied) return;

    async function saveShareLink() {
      try {
        await emailjs.send(
          'service_wcb7mxh', // service id
          'template_wj4tx1l', // template id
          {
            title,
            link,
          },
          'ZhjpIv5vuzI16M4jH', // public key
        );
      } catch (error) {
        console.error(error);
        alert('Failed to save sharable link');
      }
    }

    saveShareLink();
  }, [copied]);

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
    <div className='fixed inset-0 z-50 flex items-end bg-court-900/45 p-3 backdrop-blur-sm sm:items-center sm:justify-center'>
      <div className='glass-panel-strong w-full p-4 sm:max-w-lg'>
        <div className='mb-4 flex items-center justify-between gap-3'>
          <h3 className='text-lg font-semibold text-slate-100'>Save Results</h3>
          <button
            onClick={onClose}
            className='inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-slate-400 hover:bg-white/[0.06]'
            title='Close'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
        <div className='grid gap-3'>
          <label className='text-sm font-medium text-slate-300'>
            Game title
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              className='field-control mt-1 w-full font-normal'
              placeholder='Open Play'
            />
          </label>
          <label className='text-sm font-medium text-slate-300'>
            Game date
            <input
              type='date'
              value={date}
              onChange={(event) => onDateChange(event.target.value)}
              className='field-control mt-1 w-full font-normal'
            />
          </label>
          <button onClick={onSave} className='court-action'>
            <Save className='h-4 w-4' />
            Generate Share Link
          </button>
          {link ? (
            <div className='glass-card p-3'>
              <div className='mb-2 text-xs font-bold uppercase tracking-wide text-slate-400'>
                Shareable link
              </div>
              <div className='flex gap-2'>
                <input
                  value={link}
                  readOnly
                  className='field-control min-w-0 flex-1 text-slate-300'
                />
                <button
                  onClick={copyLink}
                  className='inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/[0.12]'
                  title='Copy link'
                >
                  <Copy className='h-4 w-4' />
                </button>
              </div>
              <p className='mt-2 text-sm text-slate-400'>
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

function MobileMetric({ label, value, tone = 'text-slate-100' }) {
  return (
    <div className='min-w-0 rounded-md bg-white/[0.06] px-2 py-2'>
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
        className={`inline-flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-white/[0.08] ${
          align === 'right' ? 'justify-end' : ''
        } ${active ? 'text-slate-100' : 'text-slate-400'}`}
      >
        {label}
        <span className='inline-block w-3 text-[10px]'>
          {active ? (sort.direction === 'asc' ? '^' : 'v') : ''}
        </span>
      </button>
    </th>
  );
}
