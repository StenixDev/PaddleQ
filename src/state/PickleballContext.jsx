import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { generateNextMatches } from '../logic/scheduler.js';
import { getPlayerStats } from '../logic/stats.js';
import { createId } from '../utils/ids.js';
import { decodeShareState } from '../utils/share.js';

const STORAGE_KEY = 'pickleball-rotation-state-v1';

const seedPlayers = ['Avery', 'Blake', 'Casey', 'Drew', 'Elliot', 'Finley', 'Gray', 'Harper'].map((name) => ({
  id: createId('player'),
  name,
  lastOutcome: 'new',
  isResting: false
}));

const initialState = {
  players: seedPlayers,
  queue: seedPlayers.map((player) => player.id),
  courtCount: 2,
  activeMatches: [],
  history: [],
  lockedPartners: [],
  shareMeta: null
};

function loadState() {
  try {
    const shared = decodeShareState(new URLSearchParams(window.location.search).get('share'));
    if (shared?.players && shared?.history) {
      const players = shared.players.map((player) => ({ isResting: false, lastOutcome: 'new', ...player }));
      return {
        ...initialState,
        players,
        queue: [],
        activeMatches: [],
        history: shared.history.map((match) => ({ scoreA: '', scoreB: '', ...match })),
        shareMeta: {
          title: shared.title || 'Shared Pickleball Results',
          date: shared.date || '',
          savedAt: shared.savedAt || ''
        }
      };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : initialState;
    const players = parsed.players.map((player) => ({ isResting: false, lastOutcome: 'new', ...player }));
    const activeIds = new Set(players.map((player) => player.id));
    return {
      ...initialState,
      ...parsed,
      players,
      activeMatches: (parsed.activeMatches || []).map((match) => ({ scoreA: '', scoreB: '', ...match })),
      history: (parsed.history || []).map((match) => ({ scoreA: '', scoreB: '', ...match })),
      queue: parsed.queue.filter((id) => activeIds.has(id) && !players.find((player) => player.id === id)?.isResting)
    };
  } catch {
    return initialState;
  }
}

function withRecalculatedLastOutcomes(players, history) {
  return players.map((player) => {
    const latestMatch = history.find((match) => [...match.teamA, ...match.teamB].includes(player.id));
    if (!latestMatch) return { ...player, lastOutcome: 'new' };
    const team = latestMatch.teamA.includes(player.id) ? 'A' : 'B';
    return { ...player, lastOutcome: latestMatch.winner === team ? 'win' : 'loss' };
  });
}

function reducer(state, action) {
  switch (action.type) {
    case 'addPlayer': {
      const player = { id: createId('player'), name: action.name.trim(), lastOutcome: 'new', isResting: false };
      return { ...state, players: [...state.players, player], queue: [...state.queue, player.id] };
    }
    case 'removePlayer': {
      const id = action.id;
      return {
        ...state,
        players: state.players.filter((player) => player.id !== id),
        queue: state.queue.filter((playerId) => playerId !== id),
        activeMatches: state.activeMatches.filter((match) => ![...match.teamA, ...match.teamB].includes(id)),
        lockedPartners: state.lockedPartners.filter((lock) => lock.a !== id && lock.b !== id)
      };
    }
    case 'renamePlayer':
      return {
        ...state,
        players: state.players.map((player) => (player.id === action.id ? { ...player, name: action.name } : player))
      };
    case 'toggleRest': {
      const player = state.players.find((item) => item.id === action.id);
      if (!player) return state;
      const isResting = !player.isResting;
      const isInActiveMatch = state.activeMatches.some((match) => [...match.teamA, ...match.teamB].includes(action.id));
      const nextPlayers = state.players.map((item) => (item.id === action.id ? { ...item, isResting } : item));
      const nextQueue = isResting
        ? state.queue.filter((id) => id !== action.id)
        : isInActiveMatch || state.queue.includes(action.id)
          ? state.queue
          : [...state.queue, action.id];
      return { ...state, players: nextPlayers, queue: nextQueue };
    }
    case 'reorderQueue': {
      const next = [...state.queue];
      const [moved] = next.splice(action.from, 1);
      next.splice(action.to, 0, moved);
      return { ...state, queue: next };
    }
    case 'setCourtCount':
      return { ...state, courtCount: Math.max(1, Number(action.count) || 1) };
    case 'generateMatches': {
      const generated = generateNextMatches(state);
      return { ...state, activeMatches: generated.matches, queue: generated.queue };
    }
    case 'substitutePlayer': {
      if (!action.toId || action.fromId === action.toId) return state;
      const targetPlayer = state.players.find((player) => player.id === action.toId);
      if (!targetPlayer || targetPlayer.isResting) return state;

      const isAssignedElsewhere = state.activeMatches.some(
        (match) => match.id !== action.matchId && [...match.teamA, ...match.teamB].includes(action.toId)
      );
      if (isAssignedElsewhere) return state;

      const nextMatches = state.activeMatches.map((match) => {
        if (match.id !== action.matchId) return match;
        if ([...match.teamA, ...match.teamB].includes(action.toId)) return match;
        return {
          ...match,
          teamA: match.teamA.map((id) => (id === action.fromId ? action.toId : id)),
          teamB: match.teamB.map((id) => (id === action.fromId ? action.toId : id))
        };
      });

      const fromPlayer = state.players.find((player) => player.id === action.fromId);
      const queueWithoutSub = state.queue.filter((id) => id !== action.toId);
      const nextQueue =
        fromPlayer && !fromPlayer.isResting && !queueWithoutSub.includes(action.fromId)
          ? [...queueWithoutSub, action.fromId]
          : queueWithoutSub;

      return { ...state, activeMatches: nextMatches, queue: nextQueue };
    }
    case 'updateMatchScore':
      return {
        ...state,
        activeMatches: state.activeMatches.map((match) =>
          match.id === action.matchId ? { ...match, [action.field]: action.value } : match
        )
      };
    case 'recordResult': {
      const match = state.activeMatches.find((item) => item.id === action.matchId);
      if (!match) return state;
      const completed = {
        ...match,
        id: createId('match'),
        winner: action.winner,
        completedAt: new Date().toISOString()
      };
      const nextPlayers = state.players.map((player) => {
        if (match.teamA.includes(player.id) || match.teamB.includes(player.id)) {
          const playerTeam = match.teamA.includes(player.id) ? 'A' : 'B';
          return { ...player, lastOutcome: playerTeam === action.winner ? 'win' : 'loss' };
        }
        return player;
      });
      const played = [...match.teamA, ...match.teamB];
      const waiting = state.queue.filter((id) => !played.includes(id));
      const returningPlayers = played.filter((id) => !nextPlayers.find((player) => player.id === id)?.isResting);
      return {
        ...state,
        players: nextPlayers,
        queue: [...waiting, ...returningPlayers],
        activeMatches: state.activeMatches.filter((item) => item.id !== action.matchId),
        history: [completed, ...state.history]
      };
    }
    case 'updateHistoryScore':
      return {
        ...state,
        history: state.history.map((match) =>
          match.id === action.matchId ? { ...match, [action.field]: action.value } : match
        )
      };
    case 'updateHistoryWinner': {
      const history = state.history.map((match) =>
        match.id === action.matchId ? { ...match, winner: action.winner } : match
      );
      return {
        ...state,
        history,
        players: withRecalculatedLastOutcomes(state.players, history)
      };
    }
    case 'togglePartnerLock': {
      const [a, b] = action.ids;
      if (!a || !b || a === b) return state;
      const exists = state.lockedPartners.some((lock) => (lock.a === a && lock.b === b) || (lock.a === b && lock.b === a));
      return {
        ...state,
        lockedPartners: exists
          ? state.lockedPartners.filter((lock) => !((lock.a === a && lock.b === b) || (lock.a === b && lock.b === a)))
          : [...state.lockedPartners, { id: createId('lock'), a, b }]
      };
    }
    case 'clearHistory':
      return { ...state, history: [], players: state.players.map((player) => ({ ...player, lastOutcome: 'new' })) };
    default:
      return state;
  }
}

const PickleballContext = createContext(null);

export function PickleballProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo(() => {
    const stats = getPlayerStats(state.players, state.history);
    const playerMap = Object.fromEntries(state.players.map((player) => [player.id, player]));
    return { state, stats, playerMap, dispatch };
  }, [state]);

  return <PickleballContext.Provider value={value}>{children}</PickleballContext.Provider>;
}

export function usePickleball() {
  const context = useContext(PickleballContext);
  if (!context) throw new Error('usePickleball must be used inside PickleballProvider');
  return context;
}
