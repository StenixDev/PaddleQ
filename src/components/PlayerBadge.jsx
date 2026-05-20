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
      ? 'bg-court-500/15 text-court-100 border-court-500/25'
      : outcome === 'loss'
        ? 'bg-paddle-500/15 text-paddle-100 border-paddle-400/25'
        : 'bg-ball-400/15 text-ball-100 border-ball-300/25';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm ${subtle ? 'border-white/10 bg-white/[0.07] text-slate-100' : tone}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="font-medium">{player.name}</span>
      <span className="text-xs opacity-70">{playerStats?.games || 0}g</span>
    </span>
  );
}
