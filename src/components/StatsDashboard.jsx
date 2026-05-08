import { BarChart3 } from 'lucide-react';
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
  const rows = state.players
    .map((player) => stats[player.id])
    .sort((a, b) => a.games - b.games || b.wins - a.wins || a.name.localeCompare(b.name));

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
              <th className="py-2 pr-3">Player</th>
              <th className="py-2 pr-3 text-right">Games</th>
              <th className="py-2 pr-3 text-right">W</th>
              <th className="py-2 pr-3 text-right">L</th>
              <th className="py-2 pr-3 text-right">Win %</th>
              <th className="py-2 pr-3 text-right">PF</th>
              <th className="py-2 pr-3 text-right">PA</th>
              <th className="py-2 pr-3 text-right">+/-</th>
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
