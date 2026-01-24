import { fenToPieces, formatMove, initialPieces } from './chess';

const startFen = '4k3/8/8/8/8/8/8/RNBQKBNR w - - 1 1'; // piecesToFen(initialPieces);
const defaultStockfishConfig = {
  fen: startFen,
  movetimeMs: 2000,
};

export const state = {
  pieces: initialPieces,
  stockfish: {
    setup: { ...defaultStockfishConfig },
    applied: { ...defaultStockfishConfig },
    cooldownMs: 0,
  },
  dragging: false as false | number, // index of dragged piece in the pieces[]
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
  state.pieces = fenToPieces(fen);
  state.dragging = false;
}

export function playMove(move: string) {
  const moveToPlay = formatMove(move);
  const piece = state.pieces.find(({ rank, file }) => moveToPlay.from.file === file && moveToPlay.from.rank === rank);
  if (!piece) return;
  const otherPieceIndex = state.pieces.findIndex(
    ({ rank, file }) => moveToPlay.to.file === file && moveToPlay.to.rank === rank,
  );
  if (otherPieceIndex !== -1) {
    state.pieces.splice(otherPieceIndex, 1);
  }
  piece.rank = moveToPlay.to.rank;
  piece.file = moveToPlay.to.file;
}
