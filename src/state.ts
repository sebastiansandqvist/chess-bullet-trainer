import { Chess } from 'chess.js';
import { parseUciMove, type PieceColor, type PieceType } from './chess';

const startFen = '4k3/8/8/8/8/8/8/RNBQKBNR w - - 1 1';
const defaultStockfishConfig = {
  fen: startFen,
  movetimeMs: 2000,
};

type DraggingPiece = {
  from: string;
  type: PieceType;
  color: PieceColor;
};

export const state = {
  game: new Chess(startFen),
  fen: startFen,
  stockfish: {
    setup: { ...defaultStockfishConfig },
    applied: { ...defaultStockfishConfig },
    cooldownMs: 0,
  },
  premoves: [] as string[],
  dragging: false as false | DraggingPiece,
  mouse: {
    x: 0,
    y: 0,
    boardX: 0,
    boardY: 0,
    isDown: false,
    justPressed: false,
    justReleased: false,
  },
};

window.addEventListener('pointerdown', (e) => {
  console.log('pointerdown');
  state.mouse.x = e.clientX;
  state.mouse.y = e.clientY;
  state.mouse.isDown = true;
  state.mouse.justPressed = true;
});

window.addEventListener('pointerup', (e) => {
  console.log('pointerup');
  state.mouse.x = e.clientX;
  state.mouse.y = e.clientY;
  state.mouse.isDown = false;
  state.mouse.justReleased = true;
});

window.addEventListener('pointermove', (e) => {
  state.mouse.x = e.clientX;
  state.mouse.y = e.clientY;
});

export function cleanupInputs() {
  state.mouse.justPressed = false;
  state.mouse.justReleased = false;
}

export function setPositionFromFen(fen: string) {
  try {
    const game = new Chess(fen);
    state.game = game;
    state.fen = game.fen();
    state.dragging = false;
    state.premoves = [];
    return true;
  } catch (error) {
    console.error('[fen]', error);
    return false;
  }
}

export function normalizeUciMove(game: Chess, uci: string) {
  const parsed = parseUciMove(uci);
  if (!parsed) return null;
  const { from, to, promotion } = parsed;
  const legalMoves = game.moves({ verbose: true });
  const candidates = legalMoves.filter((move) => move.from === from && move.to === to);
  if (candidates.length === 0) return null;

  if (promotion) {
    return candidates.some((move) => move.promotion === promotion) ? `${from}${to}${promotion}` : null;
  }

  const promotionChoice =
    candidates.find((move) => move.promotion === 'q')?.promotion ??
    candidates.find((move) => move.promotion)?.promotion;

  return promotionChoice ? `${from}${to}${promotionChoice}` : `${from}${to}`;
}

export function applyUciMove(game: Chess, uci: string) {
  const normalized = normalizeUciMove(game, uci);
  if (!normalized) return null;
  const from = normalized.slice(0, 2);
  const to = normalized.slice(2, 4);
  const promotion = normalized.length > 4 ? normalized[4] : undefined;
  try {
    game.move({ from, to, promotion });
  } catch (error) {
    console.error('[move]', error);
    return null;
  }
  return normalized;
}

export function playMove(uci: string) {
  const normalized = applyUciMove(state.game, uci);
  if (!normalized) return null;
  state.fen = state.game.fen();
  return normalized;
}
