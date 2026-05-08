import { BarChart3 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { usePickleball } from '../state/PickleballContext.jsx';

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
  const { state, stats, playerMap } = usePickleball();
  const [sort, setSort] = useState({ key: 'games', direction: 'asc' });
  const rows = useMemo(() => {
    return state.players
      .map((player) => stats[player.id])
      .sort((a, b) => {
        const direction = sort.direction === 'asc' ? 1 : -1;
        if (sort.key === 'name') return a.name.localeCompare(b.name) * direction;
        if (sort.key === 'winPercentage') {
          const aValue = a.games ? a.wins / a.games : 0;
          const bValue = b.games ? b.wins / b.games : 0;
          return (aValue - bValue) * direction || a.name.localeCompare(b.name);
        }
        return ((a[sort.key] || 0) - (b[sort.key] || 0)) * direction || a.name.localeCompare(b.name);
      });
  }, [state.players, stats, sort]);

  function changeSort(key) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-court-700" />
        <h2 className="text-lg font-semibold text-slate-950">Player Statistics</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <SortableHeader label="Player" sortKey="name" sort={sort} onSort={changeSort} />
              <SortableHeader label="Games" sortKey="games" sort={sort} onSort={changeSort} align="right" />
              <SortableHeader label="W" sortKey="wins" sort={sort} onSort={changeSort} align="right" />
              <SortableHeader label="L" sortKey="losses" sort={sort} onSort={changeSort} align="right" />
              <SortableHeader label="Win %" sortKey="winPercentage" sort={sort} onSort={changeSort} align="right" />
              <SortableHeader label="PF" sortKey="pointsFor" sort={sort} onSort={changeSort} align="right" />
              <SortableHeader label="PA" sortKey="pointsAgainst" sort={sort} onSort={changeSort} align="right" />
              <SortableHeader label="+/-" sortKey="pointDifferential" sort={sort} onSort={changeSort} align="right" />
              <th className="py-2 pr-3">Partners</th>
              <th className="py-2">Opponents</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="py-2 pr-3 font-medium text-slate-900">{row.name}</td>
                <td className="py-2 pr-3 text-right">{row.games}</td>
                <td className="py-2 pr-3 text-right text-emerald-700">{row.wins}</td>
                <td className="py-2 pr-3 text-right text-rose-700">{row.losses}</td>
                <td className="py-2 pr-3 text-right">{formatPercent(row.wins, row.games)}</td>
                <td className="py-2 pr-3 text-right font-medium text-slate-900">{row.pointsFor}</td>
                <td className="py-2 pr-3 text-right text-slate-600">{row.pointsAgainst}</td>
                <td className={`py-2 pr-3 text-right font-medium ${row.pointDifferential >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {row.pointDifferential > 0 ? '+' : ''}
                  {row.pointDifferential}
                </td>
                <td className="max-w-52 py-2 pr-3 text-slate-500">{relatedNames(row.partners, playerMap) || 'None'}</td>
                <td className="max-w-52 py-2 text-slate-500">{relatedNames(row.opponents, playerMap) || 'None'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
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
        <span className="inline-block w-3 text-[10px]">{active ? (sort.direction === 'asc' ? '^' : 'v') : ''}</span>
      </button>
    </th>
  );
}
