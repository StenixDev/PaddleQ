import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { generateNextMatches } from '../logic/scheduler.js';
import { getPlayerStats } from '../logic/stats.js';
import { createId } from '../utils/ids.js';
import { decodeShareState } from '../utils/share.js';

const STORAGE_KEY = 'pickleball-rotation-state-v1';

const seedPlayers = [].map((name) => ({
  id: createId('player'),
  name,
  lastOutcome: 'new',
  isResting: false,
}));

const initialState = {
  players: seedPlayers,
  queue: seedPlayers.map((player) => player.id),
  courtCount: 1,
  activeMatches: [],
  history: [],
  lockedPartners: [],
  shareMeta: null,
};

function normalizeQueue(players, queue) {
  const eligibleIds = players
    .filter((player) => !player.isResting)
    .map((player) => player.id);
  const eligibleSet = new Set(eligibleIds);
  const seen = new Set();
  const normalized = [];

  queue.forEach((id) => {
    if (!eligibleSet.has(id) || seen.has(id)) return;
    seen.add(id);
    normalized.push(id);
  });

  eligibleIds.forEach((id) => {
    if (seen.has(id)) return;
    seen.add(id);
    normalized.push(id);
  });

  return normalized;
}

function loadState() {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const shared = decodeShareState(
      searchParams.get('s') || searchParams.get('share'),
    );
    if (shared?.players && shared?.history) {
      const players = shared.players.map((player) => ({
        isResting: false,
        lastOutcome: 'new',
        ...player,
      }));
      return {
        ...initialState,
        players,
        queue: [],
        activeMatches: [],
        history: shared.history.map((match) => ({
          scoreA: '',
          scoreB: '',
          ...match,
        })),
        shareMeta: {
          title: shared.title || 'Shared Pickleball Results',
          date: shared.date || '',
          savedAt: shared.savedAt || '',
        },
      };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : initialState;
    const players = parsed.players.map((player) => ({
      isResting: false,
      lastOutcome: 'new',
      ...player,
    }));
    const activeIds = new Set(players.map((player) => player.id));
    return {
      ...initialState,
      ...parsed,
      players,
      activeMatches: (parsed.activeMatches || []).map((match) => ({
        scoreA: '',
        scoreB: '',
        ...match,
      })),
      history: (parsed.history || []).map((match) => ({
        scoreA: '',
        scoreB: '',
        ...match,
      })),
      queue: normalizeQueue(
        players,
        (parsed.queue || []).filter((id) => activeIds.has(id)),
      ),
    };
  } catch {
    return initialState;
  }
}

function withRecalculatedLastOutcomes(players, history) {
  return players.map((player) => {
    const latestMatch = history.find((match) =>
      [...match.teamA, ...match.teamB].includes(player.id),
    );
    if (!latestMatch) return { ...player, lastOutcome: 'new' };
    const team = latestMatch.teamA.includes(player.id) ? 'A' : 'B';
    return {
      ...player,
      lastOutcome: latestMatch.winner === team ? 'win' : 'loss',
    };
  });
}

function getWinnerFromScores(scoreA, scoreB) {
  if (
    scoreA === '' ||
    scoreB === '' ||
    scoreA === undefined ||
    scoreB === undefined
  ) {
    return null;
  }
  const teamAScore = Number(scoreA);
  const teamBScore = Number(scoreB);
  if (
    Number.isNaN(teamAScore) ||
    Number.isNaN(teamBScore) ||
    teamAScore === teamBScore
  ) {
    return null;
  }
  return teamAScore > teamBScore ? 'A' : 'B';
}

function matchRespectsPartnerLocks(match, lockedPartners) {
  const players = [...match.teamA, ...match.teamB];
  return lockedPartners.every((lock) => {
    const hasA = players.includes(lock.a);
    const hasB = players.includes(lock.b);
    if (!hasA && !hasB) return true;
    if (hasA !== hasB) return false;
    return (
      (match.teamA.includes(lock.a) && match.teamA.includes(lock.b)) ||
      (match.teamB.includes(lock.a) && match.teamB.includes(lock.b))
    );
  });
}

function getPartnerPairings(match) {
  const [p1, p2] = match.teamA;
  const [p3, p4] = match.teamB;
  return [
    {
      teamA: [p1, p2],
      teamB: [p3, p4],
    },
    {
      teamA: [p1, p3],
      teamB: [p2, p4],
    },
    {
      teamA: [p1, p4],
      teamB: [p2, p3],
    },
  ];
}

function sameTeams(first, second) {
  return (
    first.teamA.join('|') === second.teamA.join('|') &&
    first.teamB.join('|') === second.teamB.join('|')
  );
}

function reducer(state, action) {
  switch (action.type) {
    case 'addPlayer': {
      const player = {
        id: createId('player'),
        name: action.name.trim(),
        lastOutcome: 'new',
        isResting: false,
      };
      return {
        ...state,
        players: [...state.players, player],
        queue: [...state.queue, player.id],
      };
    }
    case 'removePlayer': {
      const id = action.id;
      return {
        ...state,
        players: state.players.filter((player) => player.id !== id),
        queue: state.queue.filter((playerId) => playerId !== id),
        activeMatches: state.activeMatches.filter(
          (match) => ![...match.teamA, ...match.teamB].includes(id),
        ),
        lockedPartners: state.lockedPartners.filter(
          (lock) => lock.a !== id && lock.b !== id,
        ),
      };
    }
    case 'renamePlayer':
      return {
        ...state,
        players: state.players.map((player) =>
          player.id === action.id ? { ...player, name: action.name } : player,
        ),
      };
    case 'toggleRest': {
      const player = state.players.find((item) => item.id === action.id);
      if (!player) return state;
      const isResting = !player.isResting;
      const isInActiveMatch = state.activeMatches.some((match) =>
        [...match.teamA, ...match.teamB].includes(action.id),
      );
      const nextPlayers = state.players.map((item) =>
        item.id === action.id ? { ...item, isResting } : item,
      );
      const nextQueue = isResting
        ? state.queue.filter((id) => id !== action.id)
        : isInActiveMatch || state.queue.includes(action.id)
          ? state.queue
          : [...state.queue, action.id];
      return { ...state, players: nextPlayers, queue: normalizeQueue(nextPlayers, nextQueue) };
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
      const activePlayerIds = new Set(
        state.activeMatches.flatMap((match) => [...match.teamA, ...match.teamB]),
      );
      const occupiedCourts = new Set(
        state.activeMatches.map((match) => match.court),
      );
      const openCourts = Array.from(
        { length: state.courtCount },
        (_, index) => index + 1,
      ).filter((court) => !occupiedCourts.has(court));

      if (!openCourts.length) return state;

      const normalizedQueue = normalizeQueue(state.players, state.queue);
      const availableQueue = normalizedQueue.filter(
        (id) => !activePlayerIds.has(id),
      );
      const generated = generateNextMatches({
        ...state,
        players: state.players.map((player) =>
          activePlayerIds.has(player.id)
            ? { ...player, isResting: true }
            : player,
        ),
        queue: availableQueue,
        courtCount: openCourts.length,
      });
      const matches = generated.matches.map((match, index) => ({
        ...match,
        court: openCourts[index],
      }));
      const activeQueue = normalizedQueue.filter((id) => activePlayerIds.has(id));
      const nextQueue = [
        ...activeQueue,
        ...generated.queue.filter((id) => !activePlayerIds.has(id)),
      ];

      return {
        ...state,
        activeMatches: [...state.activeMatches, ...matches],
        queue: normalizeQueue(state.players, nextQueue),
      };
    }
    case 'substitutePlayer': {
      if (!action.toId || action.fromId === action.toId) return state;
      const targetPlayer = state.players.find(
        (player) => player.id === action.toId,
      );
      if (!targetPlayer || targetPlayer.isResting) return state;

      const isAssignedElsewhere = state.activeMatches.some(
        (match) =>
          match.id !== action.matchId &&
          [...match.teamA, ...match.teamB].includes(action.toId),
      );
      if (isAssignedElsewhere) return state;

      const nextMatches = state.activeMatches.map((match) => {
        if (match.id !== action.matchId) return match;
        if ([...match.teamA, ...match.teamB].includes(action.toId))
          return match;
        const nextMatch = {
          ...match,
          teamA: match.teamA.map((id) =>
            id === action.fromId ? action.toId : id,
          ),
          teamB: match.teamB.map((id) =>
            id === action.fromId ? action.toId : id,
          ),
        };
        return matchRespectsPartnerLocks(nextMatch, state.lockedPartners)
          ? nextMatch
          : match;
      });
      const currentMatch = state.activeMatches.find(
        (match) => match.id === action.matchId,
      );
      const updatedMatch = nextMatches.find((match) => match.id === action.matchId);
      if (
        !currentMatch ||
        !updatedMatch ||
        (currentMatch.teamA.join('|') === updatedMatch.teamA.join('|') &&
          currentMatch.teamB.join('|') === updatedMatch.teamB.join('|'))
      ) {
        return state;
      }

      const fromPlayer = state.players.find(
        (player) => player.id === action.fromId,
      );
      const queueWithoutSub = state.queue.filter((id) => id !== action.toId);
      const nextQueue =
        fromPlayer &&
        !fromPlayer.isResting &&
        !queueWithoutSub.includes(action.fromId)
          ? [...queueWithoutSub, action.fromId]
          : queueWithoutSub;

      return { ...state, activeMatches: nextMatches, queue: nextQueue };
    }
    case 'cycleMatchPartners':
      return {
        ...state,
        activeMatches: state.activeMatches.map((match) => {
          if (match.id !== action.matchId) return match;
          const pairings = getPartnerPairings(match)
            .map((pairing) => ({ ...match, ...pairing }))
            .filter((pairing) =>
              matchRespectsPartnerLocks(pairing, state.lockedPartners),
            );
          const currentIndex = pairings.findIndex((pairing) =>
            sameTeams(pairing, match),
          );
          const nextPairing =
            pairings[(currentIndex + 1 + pairings.length) % pairings.length];
          return nextPairing || match;
        }),
      };
    case 'setMatchPartnerPairing':
      return {
        ...state,
        activeMatches: state.activeMatches.map((match) => {
          if (match.id !== action.matchId) return match;
          const pairings = getPartnerPairings(match)
            .map((pairing) => ({ ...match, ...pairing }))
            .filter((pairing) =>
              matchRespectsPartnerLocks(pairing, state.lockedPartners),
            );
          return pairings[action.pairingIndex] || match;
        }),
      };
    case 'updateMatchScore':
      return {
        ...state,
        activeMatches: state.activeMatches.map((match) =>
          match.id === action.matchId
            ? { ...match, [action.field]: action.value }
            : match,
        ),
      };
    case 'recordResult': {
      const match = state.activeMatches.find(
        (item) => item.id === action.matchId,
      );
      if (!match) return state;
      const winner = getWinnerFromScores(match.scoreA, match.scoreB);
      if (!winner) return state;
      const completed = {
        ...match,
        id: createId('match'),
        winner,
        completedAt: new Date().toISOString(),
      };
      const nextPlayers = state.players.map((player) => {
        if (
          match.teamA.includes(player.id) ||
          match.teamB.includes(player.id)
        ) {
          const playerTeam = match.teamA.includes(player.id) ? 'A' : 'B';
          return {
            ...player,
            lastOutcome: playerTeam === winner ? 'win' : 'loss',
          };
        }
        return player;
      });
      const played = [...match.teamA, ...match.teamB];
      const waiting = normalizeQueue(nextPlayers, state.queue).filter(
        (id) => !played.includes(id),
      );
      const returningPlayers = played.filter(
        (id) => !nextPlayers.find((player) => player.id === id)?.isResting,
      );
      return {
        ...state,
        players: nextPlayers,
        queue: normalizeQueue(nextPlayers, [...waiting, ...returningPlayers]),
        activeMatches: state.activeMatches.filter(
          (item) => item.id !== action.matchId,
        ),
        history: [completed, ...state.history],
      };
    }
    case 'updateHistoryScore': {
      const history = state.history.map((match) => {
        if (match.id !== action.matchId) return match;
        const nextMatch = { ...match, [action.field]: action.value };
        return {
          ...nextMatch,
          winner:
            getWinnerFromScores(nextMatch.scoreA, nextMatch.scoreB) ||
            nextMatch.winner,
        };
      });
      return {
        ...state,
        history,
        players: withRecalculatedLastOutcomes(state.players, history),
      };
    }
    case 'updateHistoryWinner': {
      const history = state.history.map((match) =>
        match.id === action.matchId
          ? { ...match, winner: action.winner }
          : match,
      );
      return {
        ...state,
        history,
        players: withRecalculatedLastOutcomes(state.players, history),
      };
    }
    case 'deleteHistoryMatch': {
      const history = state.history.filter(
        (match) => match.id !== action.matchId,
      );
      return {
        ...state,
        history,
        players: withRecalculatedLastOutcomes(state.players, history),
      };
    }
    case 'togglePartnerLock': {
      const [a, b] = action.ids;
      if (!a || !b || a === b) return state;
      const exists = state.lockedPartners.some(
        (lock) =>
          (lock.a === a && lock.b === b) || (lock.a === b && lock.b === a),
      );
      return {
        ...state,
        lockedPartners: exists
          ? state.lockedPartners.filter(
              (lock) =>
                !(
                  (lock.a === a && lock.b === b) ||
                  (lock.a === b && lock.b === a)
                ),
            )
          : [
              ...state.lockedPartners.filter(
                (lock) =>
                  lock.a !== a && lock.b !== a && lock.a !== b && lock.b !== b,
              ),
              { id: createId('lock'), a, b },
            ],
      };
    }
    case 'clearHistory':
      return {
        ...state,
        history: [],
        players: state.players.map((player) => ({
          ...player,
          lastOutcome: 'new',
        })),
      };
    case 'deleteAllData':
      return initialState;
    default:
      return state;
  }
}

const PickleballContext = createContext(null);

export function PickleballProvider({ children }) {
  const [state, rawDispatch] = useReducer(reducer, undefined, loadState);
  const skipNextPersist = useRef(false);
  const dispatch = useCallback((action) => {
    if (action.type === 'deleteAllData') {
      skipNextPersist.current = true;
    }
    rawDispatch(action);
  }, []);

  useEffect(() => {
    if (skipNextPersist.current) {
      localStorage.removeItem(STORAGE_KEY);
      skipNextPersist.current = false;
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo(() => {
    const stats = getPlayerStats(state.players, state.history);
    const playerMap = Object.fromEntries(
      state.players.map((player) => [player.id, player]),
    );
    return { state, stats, playerMap, dispatch };
  }, [state]);

  return (
    <PickleballContext.Provider value={value}>
      {children}
    </PickleballContext.Provider>
  );
}

export function usePickleball() {
  const context = useContext(PickleballContext);
  if (!context)
    throw new Error('usePickleball must be used inside PickleballProvider');
  return context;
}
