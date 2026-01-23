import { onCleanup } from 'solid-js';
import { isLegalMove, PieceColor, PieceType, rankAndFileToString } from './chess';
import { pieceImage } from './pieces';
import { playSound } from './sound-effects';
import { cleanupInputs, playMove, setPositionFromFen, state } from './state';
import { createStockfishClient } from './stockfish/engine';

const stockfish = createStockfishClient();
let lastFen = '';
let lastMovetimeMs = 0;

const syncStockfishConfig = () => {
  const fen = state.stockfish.fen.trim();
  if (!fen) return;
  const movetimeMs = state.stockfish.movetimeMs;
  const fenChanged = fen !== lastFen;
  const movetimeChanged = movetimeMs !== lastMovetimeMs;
  if (!fenChanged && !movetimeChanged) return;

  stockfish.configure({ fen, movetimeMs });
  stockfish.newgame();

  if (fenChanged) {
    setPositionFromFen(fen);
  }
  lastFen = fen;
  lastMovetimeMs = movetimeMs;
};

syncStockfishConfig();

const green = '#769656';
const white = '#eeeed2';

function update(boardRect: BoardRect, canvasRect: DOMRect) {
  syncStockfishConfig();
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

    const pieceUnderCursor = state.pieces.findIndex((piece) => piece.rank == rank && piece.file === file);

    if (pieceUnderCursor !== -1 && !state.dragging && state.mouse.justPressed) {
      state.dragging = pieceUnderCursor;
    }

    if (state.mouse.justReleased && state.dragging) {
      const before = rankAndFileToString(state.pieces[state.dragging]!);
      const after = rankAndFileToString({ rank, file });
      const move = `${before}${after}`;
      state.dragging = false;

      if (isLegalMove(move)) {
        playMove(move);
        playSound('move');
        stockfish.play(move);
      }
    }
  }

  if (stockfish.hasBestMove) {
    const reply = stockfish.takeBestMove();
    if (reply?.move) {
      playMove(reply.move);
      playSound('move');
    }
  }
}

export const startCanvasLoop = (canvas: HTMLCanvasElement) => {
  const tick = () => {
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

    // update
    {
      update(boardRect, rect);
    }

    // draw
    {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBoard(ctx, boardRect);
      drawPieces(ctx, boardRect, state.pieces);
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

function drawPieces(
  ctx: CanvasRenderingContext2D,
  boardRect: BoardRect,
  piecesToDraw: {
    rank: number;
    file: number;
    type: PieceType;
    color: PieceColor;
  }[],
) {
  const squares = 8;
  const squareSize = boardRect.size / squares;
  const padding = squareSize * 0.08;
  const pieceSize = squareSize - padding * 2;

  for (let i = 0; i < piecesToDraw.length; i++) {
    const piece = piecesToDraw[i]!;
    const img = pieceImage(piece.type, piece.color);
    if (i === state.dragging) {
      ctx.drawImage(
        img,
        state.mouse.boardX - pieceSize * 0.5,
        state.mouse.boardY - pieceSize * 0.5,
        pieceSize,
        pieceSize,
      );
    } else {
      const col = piece.file - 1;
      const row = squares - piece.rank;
      const x = boardRect.x + col * squareSize + padding;
      const y = boardRect.y + row * squareSize + padding;
      if (!img.complete) continue;
      ctx.drawImage(img, x, y, pieceSize, pieceSize);
    }
  }
}
