import { Trophy, TrendingDown, UserRound } from 'lucide-react';
import { usePickleball } from '../state/PickleballContext.jsx';

export default function PlayerBadge({ id, subtle = false }) {
  const { playerMap, stats } = usePickleball();
  const player = playerMap[id];
  const playerStats = stats[id];
  if (!player) return null;
  const outcome = player.lastOutcome;
  const Icon = outcome === 'win' ? Trophy : outcome === 'loss' ? TrendingDown : UserRound;
  const tone =
    outcome === 'win'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : outcome === 'loss'
        ? 'bg-rose-50 text-rose-800 border-rose-200'
        : 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm ${subtle ? 'bg-white' : tone}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="font-medium">{player.name}</span>
      <span className="text-xs opacity-70">{playerStats?.games || 0}g</span>
    </span>
  );
}
