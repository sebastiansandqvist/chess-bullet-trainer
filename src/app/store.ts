import { Chess } from 'chess.js';
import { createStore } from 'solid-js/store';
import { builtinScenarios } from '../content/sample-collection';
import { boardToPieces, turnToColor } from '../domain/chess';
import { clockValue } from '../domain/clocks';
import {
  defaultPreferences,
  deleteCustomScenario,
  loadAttempts,
  loadCustomScenarios,
  loadPreferences,
  saveAttempt,
  saveCustomScenario,
  savePreferences,
} from '../domain/persistence';
import { isPremoveShapeLegal, projectPremoves } from '../domain/premoves';
import {
  applyEngineMove,
  clearPremoves,
  commitPlayerMove,
  createSession,
  engineFailed,
  enqueuePremove,
  resignSession,
  tickSession,
  type Session,
} from '../domain/session';
import type {
  Color,
  AttemptRecord,
  Preferences,
  PromotionPiece,
  RenderPiece,
  Scenario,
  ScenarioGoal,
  PlayerPresentation,
} from '../domain/types';
import {
  clearStockfishCache,
  downloadStockfishAssets,
  isStockfishCached,
  type EngineDownloadProgress,
} from '../stockfish/assets';
import { createStockfishEngine, type EngineState } from '../stockfish/engine';
import { playSound } from '../sound-effects';

export type Screen = 'library' | 'setup' | 'play' | 'import' | 'settings';
export type SetupDraft = {
  id?: string;
  name: string;
  context: string;
  input: string;
  fen: string;
  traineeColor: Color;
  whiteClockSeconds: number;
  blackClockSeconds: number;
  incrementSeconds: number;
  engineMoveSeconds: number;
  goal: ScenarioGoal;
  source?: Scenario['source'];
  whitePlayer?: PlayerPresentation;
  blackPlayer?: PlayerPresentation;
};

export type AppState = {
  screen: Screen;
  preferences: Preferences;
  customScenarios: Scenario[];
  attempts: AttemptRecord[];
  selectedScenario: Scenario | null;
  setup: SetupDraft;
  session: Session | null;
  selectedSquare: string | null;
  promotion: { from: string; to: string } | null;
  engine: {
    cached: boolean | null;
    state: EngineState;
    progress: EngineDownloadProgress | null;
    error: string | null;
  };
};

const standardFen = new Chess().fen();
const storedPreferences =
  typeof window === 'undefined' ? structuredClone(defaultPreferences) : loadPreferences();
const engine = createStockfishEngine();
let requestedSearch = '';
let resultRecordedFor = '';
let downloadController: AbortController | null = null;

export const [app, setApp] = createStore<AppState>({
  screen: 'library',
  preferences: storedPreferences,
  customScenarios: typeof window === 'undefined' ? [] : loadCustomScenarios(),
  attempts: typeof window === 'undefined' ? [] : loadAttempts(),
  selectedScenario: null,
  setup: {
    name: 'Custom scenario',
    context: '',
    input: '',
    fen: standardFen,
    traineeColor: storedPreferences.lastSetup.traineeColor,
    whiteClockSeconds: storedPreferences.lastSetup.whiteClockMs / 1_000,
    blackClockSeconds: storedPreferences.lastSetup.blackClockMs / 1_000,
    incrementSeconds: storedPreferences.lastSetup.incrementMs / 1_000,
    engineMoveSeconds: storedPreferences.lastSetup.engineMoveTimeMs / 1_000,
    goal: storedPreferences.lastSetup.goal,
  },
  session: null,
  selectedSquare: null,
  promotion: null,
  engine: { cached: null, state: 'idle', progress: null, error: null },
});

engine.onState((state, error) => {
  setApp('engine', { ...app.engine, state, error: error ?? null });
  if (state === 'error' && app.session && app.session.phase !== 'finished') {
    setSession(engineFailed(app.session, error ?? 'Stockfish failed.', performance.now()));
  }
});
engine.onBestMove((reply) => {
  const session = app.session;
  if (!session || reply.sessionId !== session.id) return;
  const next = applyEngineMove(session, reply.move, reply.searchId, performance.now());
  playCommittedSounds(session, next);
  setSession(next);
  ensureEngineSearch(next);
});

export async function initializeApp() {
  setApp('engine', 'cached', await isStockfishCached());
}

export function navigate(screen: Screen) {
  setApp('screen', screen);
}

export function updatePreferences(patch: Partial<Preferences>) {
  const next = { ...app.preferences, ...patch };
  setApp('preferences', next);
  savePreferences(next);
}

export function updateSetup<K extends keyof SetupDraft>(key: K, value: SetupDraft[K]) {
  setApp('setup', key, value);
}

export function editScenario(scenario?: Scenario) {
  if (scenario) {
    setApp('setup', {
      id: scenario.id,
      name: scenario.name,
      context: scenario.context ?? '',
      input: '',
      fen: scenario.initialFen,
      traineeColor: scenario.traineeColor,
      whiteClockSeconds: scenario.whiteClockMs / 1_000,
      blackClockSeconds: scenario.blackClockMs / 1_000,
      incrementSeconds: scenario.incrementMs / 1_000,
      engineMoveSeconds: scenario.engineMoveTimeMs / 1_000,
      goal: scenario.goal,
      source: scenario.source,
      whitePlayer: scenario.whitePlayer,
      blackPlayer: scenario.blackPlayer,
    });
  } else {
    setApp('setup', 'id', undefined);
    setApp('setup', 'source', undefined);
    setApp('setup', 'whitePlayer', undefined);
    setApp('setup', 'blackPlayer', undefined);
  }
  setApp('screen', 'setup');
}

export function scenarioFromSetup(source: Scenario['source'] = { kind: 'custom' }): Scenario {
  return {
    id: app.setup.id ?? `custom-${crypto.randomUUID()}`,
    name: app.setup.name.trim() || 'Custom scenario',
    context: app.setup.context.trim() || undefined,
    source: app.setup.source ?? source,
    initialFen: app.setup.fen,
    traineeColor: app.setup.traineeColor,
    orientation: app.setup.traineeColor,
    whiteClockMs: Math.max(0, app.setup.whiteClockSeconds * 1_000),
    blackClockMs: Math.max(0, app.setup.blackClockSeconds * 1_000),
    incrementMs: Math.max(0, app.setup.incrementSeconds * 1_000),
    engineMoveTimeMs: Math.max(1, app.setup.engineMoveSeconds * 1_000),
    goal: app.setup.goal,
    whitePlayer: app.setup.whitePlayer,
    blackPlayer: app.setup.blackPlayer,
  };
}

export function saveSetup() {
  const scenario = scenarioFromSetup();
  setApp('customScenarios', saveCustomScenario(scenario));
  persistSetupDefaults();
  setApp('screen', 'library');
}

export function playSetup() {
  persistSetupDefaults();
  openPlay(scenarioFromSetup());
}

export function removeCustomScenario(id: string) {
  setApp('customScenarios', deleteCustomScenario(id));
}

function persistSetupDefaults() {
  updatePreferences({
    lastSetup: {
      traineeColor: app.setup.traineeColor,
      whiteClockMs: app.setup.whiteClockSeconds * 1_000,
      blackClockMs: app.setup.blackClockSeconds * 1_000,
      incrementMs: app.setup.incrementSeconds * 1_000,
      engineMoveTimeMs: app.setup.engineMoveSeconds * 1_000,
      goal: app.setup.goal,
    },
  });
}

export function openPlay(scenario: Scenario) {
  engine.stop();
  requestedSearch = '';
  resultRecordedFor = '';
  setApp('screen', 'play');
  setApp('selectedScenario', scenario);
  setApp('session', null);
  setApp('selectedSquare', null);
  setApp('promotion', null);
  if (app.engine.cached) void beginSession();
}

export async function downloadEngine() {
  if (!globalThis.crossOriginIsolated) {
    setApp('engine', {
      ...app.engine,
      state: 'error',
      error: 'Stockfish requires cross-origin isolation. Check the deployment COOP/COEP headers.',
    });
    return;
  }
  downloadController?.abort();
  downloadController = new AbortController();
  setApp('engine', { ...app.engine, state: 'loading', progress: null, error: null });
  try {
    await downloadStockfishAssets(
      (progress) => setApp('engine', 'progress', progress),
      downloadController.signal,
    );
    setApp('engine', 'cached', true);
    await beginSession();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      await clearStockfishCache();
      setApp('engine', { cached: false, state: 'idle', progress: null, error: null });
      return;
    }
    setApp('engine', {
      ...app.engine,
      state: 'error',
      error: error instanceof Error ? error.message : 'Engine download failed.',
    });
  } finally {
    downloadController = null;
  }
}

export function cancelEngineDownload() {
  downloadController?.abort();
}

export async function beginSession() {
  const scenario = app.selectedScenario;
  if (!scenario) return;
  if (!globalThis.crossOriginIsolated) {
    setApp('engine', 'error', 'Stockfish requires cross-origin isolation. Check the deployment COOP/COEP headers.');
    return;
  }
  try {
    await engine.boot();
    const session = createSession(scenario, performance.now());
    setSession(session);
    ensureEngineSearch(session);
  } catch (error) {
    setApp('engine', 'error', error instanceof Error ? error.message : 'Engine failed to start.');
  }
}

export function retrySession() {
  const scenario = app.selectedScenario;
  if (!scenario) return;
  engine.stop();
  requestedSearch = '';
  resultRecordedFor = '';
  const session = createSession(scenario, performance.now());
  setSession(session);
  ensureEngineSearch(session);
}

export function tick(now = performance.now()) {
  if (!app.session) return;
  const next = tickSession(app.session, now);
  setSession(next);
  ensureEngineSearch(next);
}

function ensureEngineSearch(session: Session) {
  if (session.phase !== 'engine_thinking' || session.activeSearchId === null) return;
  const key = `${session.id}:${session.activeSearchId}`;
  if (requestedSearch === key) return;
  requestedSearch = key;
  engine
    .search({
      fen: session.game.fen(),
      movetimeMs: session.scenario.engineMoveTimeMs,
      sessionId: session.id,
      searchId: session.activeSearchId,
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      setApp('engine', 'error', message);
      const current = app.session;
      if (
        current &&
        current.id === session.id &&
        current.phase === 'engine_thinking' &&
        current.activeSearchId === session.activeSearchId
      ) {
        setSession(engineFailed(current, message, performance.now()));
      }
    });
}

function setSession(session: Session) {
  setApp('session', session);
  if (session.result && resultRecordedFor !== session.id) {
    resultRecordedFor = session.id;
    const record = {
      ...session.result,
      scenarioId: session.scenario.id,
      attemptedAt: new Date().toISOString(),
    };
    saveAttempt(record);
    setApp('attempts', loadAttempts());
  }
}

export function handleBoardMove(from: string, to: string, altKey = false, promotion?: PromotionPiece) {
  const session = app.session;
  if (!session) return;
  const piece = session.game.get(from as never);
  const isPromotion = piece?.type === 'p' && (to[1] === '1' || to[1] === '8');
  if (isPromotion && (altKey || !app.preferences.autoQueen) && !promotion) {
    setApp('promotion', { from, to });
    return;
  }
  const move = { from, to, promotion: promotion ?? (isPromotion && app.preferences.autoQueen ? 'q' : undefined) };
  if (session.phase === 'engine_thinking') {
    if (!isPremoveShapeLegal(session.game, move, session.scenario.traineeColor, session.premoves)) return;
    setSession(enqueuePremove(session, move));
    return;
  }
  const next = commitPlayerMove(session, move, performance.now());
  playCommittedSounds(session, next);
  setApp('selectedSquare', null);
  setSession(next);
  ensureEngineSearch(next);
}

export function choosePromotion(promotion: PromotionPiece) {
  const pending = app.promotion;
  if (!pending) return;
  setApp('promotion', null);
  handleBoardMove(pending.from, pending.to, false, promotion);
}

export function cancelPremoves() {
  if (app.session) setSession(clearPremoves(app.session));
}

export function resign() {
  if (app.session) {
    engine.stop();
    setSession(resignSession(app.session, performance.now()));
  }
}

export async function clearEngineDownload() {
  engine.dispose();
  await clearStockfishCache();
  setApp('engine', { cached: false, state: 'idle', progress: null, error: null });
}

export function boardPieces(): RenderPiece[] {
  const session = app.session;
  if (!session) return [];
  if (session.premoves.length === 0) return boardToPieces(session.game.board());
  const projected = projectPremoves(session.game, session.scenario.traineeColor, session.premoves);
  return [...projected.values()].map((piece) => ({
    square: piece.square,
    rank: Number(piece.square[1]),
    file: piece.square.charCodeAt(0) - 96,
    type: pieceTypeName(piece.type),
    color: turnToColor(piece.color),
  }));
}

function pieceTypeName(type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k'): RenderPiece['type'] {
  return ({ p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' } as const)[type];
}

export function legalSquares() {
  const session = app.session;
  if (!session || !app.selectedSquare || session.phase !== 'player_turn') return [];
  return session.game.moves({ square: app.selectedSquare as never, verbose: true }).map((move) => move.to);
}

export function displayedClock(color: Color, now: number) {
  return app.session ? clockValue(app.session.clocks, color, now) : 0;
}

export function allScenarios() {
  return [...builtinScenarios, ...app.customScenarios];
}

function playCommittedSounds(previous: Session, next: Session) {
  if (!app.preferences.sound || next.moves.length <= previous.moves.length) return;
  for (const move of next.moves.slice(previous.moves.length)) {
    void playSound(move.promotion ? 'promote' : move.capture ? 'capture' : 'move');
  }
}
