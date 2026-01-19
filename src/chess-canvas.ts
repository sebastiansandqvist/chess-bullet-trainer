import { pieceImage } from './pieces';
import { cleanupInputs, PieceColor, PieceType, state } from './state';

const green = '#769656';
const white = '#eeeed2';

function update() {}

export const startCanvasLoop = (canvas: HTMLCanvasElement) => {
  const tick = () => {
    requestAnimationFrame(tick);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('!!');
    const rect = canvas.getBoundingClientRect();
    const boardRect = calculateBoardRect(rect);

    // setup
    {
      const dpr = window.devicePixelRatio;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    // update
    {
      update();
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
  };
  tick();
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
  piecesToDraw: { rank: number; file: number; type: PieceType; color: PieceColor }[],
) {
  const squares = 8;
  const squareSize = boardRect.size / squares;
  const padding = squareSize * 0.08;
  const pieceSize = squareSize - padding * 2;

  for (const piece of piecesToDraw) {
    const col = piece.file - 1;
    const row = squares - piece.rank;
    const x = boardRect.x + col * squareSize + padding;
    const y = boardRect.y + row * squareSize + padding;
    const img = pieceImage(piece.type, piece.color);
    if (!img.complete) continue;
    ctx.drawImage(img, x, y, pieceSize, pieceSize);
  }
}
