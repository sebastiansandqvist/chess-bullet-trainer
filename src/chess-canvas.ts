import { Chess } from 'chess.js';
import { onCleanup } from 'solid-js';
import { boardToPieces, rankAndFileToString, type RenderPiece } from './chess';
import { pieceImage } from './pieces';
import { playSound } from './sound-effects';
import { applyUciMove, cleanupInputs, normalizeUciMove, playMove, setPositionFromFen, state } from './state';
import { createStockfishClient } from './stockfish/engine';

const stockfish = createStockfishClient();
let lastFen = '';
let lastMovetimeMs = 0;
let lastTickMs = 0;

const syncStockfishConfig = () => {
  const fen = state.stockfish.applied.fen.trim();
  if (!fen) return;
  const movetimeMs = state.stockfish.applied.movetimeMs;
  const fenChanged = fen !== lastFen;
  const movetimeChanged = movetimeMs !== lastMovetimeMs;
  if (!fenChanged && !movetimeChanged) return;

  let nextFen = lastFen || state.fen;
  if (fenChanged) {
    const loaded = setPositionFromFen(fen);
    if (!loaded) {
      return;
    }
    nextFen = state.fen;
    state.stockfish.applied.fen = nextFen;
  }

  stockfish.configure({ fen: nextFen, movetimeMs });
  stockfish.newgame();
  state.stockfish.cooldownMs = 0;
  state.premoves = [];

  lastFen = nextFen;
  lastMovetimeMs = movetimeMs;
};

syncStockfishConfig();

const green = '#769656';
const white = '#eeeed2';

const flipTurn = (turn: 'w' | 'b') => (turn === 'w' ? 'b' : 'w');

const setFenTurn = (fen: string, turn: 'w' | 'b') => {
  const parts = fen.split(/\s+/);
  if (parts.length < 2) return fen;
  parts[1] = turn;
  return parts.join(' ');
};

const buildPreviewGame = (userTurn: 'w' | 'b') => {
  let preview = new Chess(state.fen);
  for (const premove of state.premoves) {
    const validation = new Chess(setFenTurn(preview.fen(), userTurn));
    if (!applyUciMove(validation, premove)) {
      break;
    }
    preview = new Chess(setFenTurn(validation.fen(), userTurn));
  }
  return preview;
};

function update(boardRect: BoardRect, canvasRect: DOMRect) {
  syncStockfishConfig();
  const engineTurn = stockfish.isThinking || stockfish.hasBestMove || state.stockfish.cooldownMs > 0;
  const userTurn = engineTurn ? flipTurn(state.game.turn()) : state.game.turn();
  const previewGame = buildPreviewGame(userTurn);
  const validationGame = new Chess(setFenTurn(previewGame.fen(), userTurn));
  const renderPieces = boardToPieces(previewGame.board());
  const mouseRelativeToCanvas = {
    x: state.mouse.x - canvasRect.left,
    y: state.mouse.y - canvasRect.top,
  };
  state.mouse.boardX = mouseRelativeToCanvas.x;
  state.mouse.boardY = mouseRelativeToCanvas.y;

  const isMouseOverBoard =
    mouseRelativeToCanvas.x >= boardRect.x &&
    mouseRelativeToCanvas.x <= boardRect.x + boardRect.size &&
    mouseRelativeToCanvas.y >= boardRect.y &&
    mouseRelativeToCanvas.y <= boardRect.y + boardRect.size;

  if (isMouseOverBoard) {
    const file = Math.floor((mouseRelativeToCanvas.x / boardRect.size) * 8) + 1;
    const rank = 8 - Math.floor((mouseRelativeToCanvas.y / boardRect.size) * 8);

    const pieceUnderCursor = renderPieces.find((piece) => piece.rank === rank && piece.file === file);

    if (pieceUnderCursor && !state.dragging && state.mouse.justPressed) {
      state.dragging = {
        from: pieceUnderCursor.square,
        type: pieceUnderCursor.type,
        color: pieceUnderCursor.color,
      };
    }

    if (state.mouse.justReleased && state.dragging) {
      const before = state.dragging.from;
      const after = rankAndFileToString({ rank, file });
      const move = `${before}${after}`;
      state.dragging = false;

      if (before !== after) {
        const normalizedMove = normalizeUciMove(validationGame, move);
        if (normalizedMove) {
          if (engineTurn) {
            state.premoves.push(normalizedMove);
          } else {
            const appliedMove = playMove(normalizedMove);
            if (appliedMove) {
              playSound('move');
              state.stockfish.cooldownMs = state.stockfish.applied.movetimeMs;
              stockfish.play(appliedMove);
            }
          }
        }
      }
    }
  }

  if (stockfish.hasBestMove && state.stockfish.cooldownMs <= 0) {
    const reply = stockfish.takeBestMove();
    if (reply?.move) {
      const appliedReply = playMove(reply.move);
      if (!appliedReply) {
        state.premoves = [];
        return renderPieces;
      }
      playSound('move');
      if (state.premoves.length > 0) {
        const premove = state.premoves.shift()!;
        const appliedPremove = playMove(premove);
        if (!appliedPremove) {
          state.premoves = [];
        } else {
          playSound('move');
          state.stockfish.cooldownMs = state.stockfish.applied.movetimeMs;
          stockfish.play(appliedPremove);
        }
      }
    } else {
      state.premoves = [];
    }
  }

  const finalEngineTurn = stockfish.isThinking || stockfish.hasBestMove || state.stockfish.cooldownMs > 0;
  const finalUserTurn = finalEngineTurn ? flipTurn(state.game.turn()) : state.game.turn();
  const finalPreviewGame = buildPreviewGame(finalUserTurn);
  return boardToPieces(finalPreviewGame.board());
}

export const startCanvasLoop = (canvas: HTMLCanvasElement) => {
  const tick = () => {
    const now = performance.now();
    const dt = lastTickMs > 0 ? now - lastTickMs : 0;
    lastTickMs = now;
    if (state.stockfish.cooldownMs > 0) {
      state.stockfish.cooldownMs = Math.max(0, state.stockfish.cooldownMs - dt);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('!!');
    const rect = canvas.getBoundingClientRect();
    const boardRect = calculateBoardRect(rect);

    // setup
    {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = Math.floor(rect.width * dpr);
      const displayHeight = Math.floor(rect.height * dpr);
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const renderPieces = update(boardRect, rect);

    // draw
    {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBoard(ctx, boardRect);
      drawPieces(ctx, boardRect, renderPieces);
    }

    // cleanup
    {
      cleanupInputs();
    }
    return requestAnimationFrame(tick);
  };
  let raf = tick();

  onCleanup(() => {
    cancelAnimationFrame(raf);
  });
};

function drawBoard(ctx: CanvasRenderingContext2D, boardRect: BoardRect) {
  const squares = 8;
  const squareSize = boardRect.size / squares;

  // Draw 8x8 chessboard
  for (let row = 0; row < squares; row++) {
    for (let col = 0; col < squares; col++) {
      const isDark = (row + col) % 2 === 1;
      ctx.fillStyle = isDark ? green : white;
      ctx.fillRect(boardRect.x + col * squareSize, boardRect.y + row * squareSize, squareSize, squareSize);
    }
  }
}

function calculateBoardRect(rect: DOMRect) {
  /*
                 VERT_SPACE
      HORI_SPACE BOARD_SIZE HORI_SPACE
                 VERT_SPACE
   */
  const boardSize = Math.min(rect.width, rect.height);
  const vPadding = (rect.height - boardSize) / 2;
  const hPadding = (rect.width - boardSize) / 2;
  return { x: hPadding, y: vPadding, size: boardSize };
}

type BoardRect = ReturnType<typeof calculateBoardRect>;

function drawPieces(ctx: CanvasRenderingContext2D, boardRect: BoardRect, piecesToDraw: RenderPiece[]) {
  const squares = 8;
  const squareSize = boardRect.size / squares;
  const padding = squareSize * 0.08;
  const pieceSize = squareSize - padding * 2;
  const dragging = state.dragging;
  const draggingSquare = dragging ? dragging.from : '';

  for (let i = 0; i < piecesToDraw.length; i++) {
    const piece = piecesToDraw[i]!;
    if (draggingSquare && piece.square === draggingSquare) {
      continue;
    }
    const img = pieceImage(piece.type, piece.color);
    const col = piece.file - 1;
    const row = squares - piece.rank;
    const x = boardRect.x + col * squareSize + padding;
    const y = boardRect.y + row * squareSize + padding;
    if (!img.complete) continue;
    ctx.drawImage(img, x, y, pieceSize, pieceSize);
  }

  if (dragging) {
    const img = pieceImage(dragging.type, dragging.color);
    if (!img.complete) return;
    ctx.drawImage(
      img,
      state.mouse.boardX - pieceSize * 0.5,
      state.mouse.boardY - pieceSize * 0.5,
      pieceSize,
      pieceSize,
    );
  }
}
