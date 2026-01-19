const green = '#769656';
const white = '#eeeed2';

type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
type PieceColor = 'white' | 'black';

const pieces: { rank: number; file: number; type: PieceType; color: PieceColor }[] = [
  // White back rank (rank 1)
  { rank: 1, file: 1, type: 'rook', color: 'white' },
  { rank: 1, file: 2, type: 'knight', color: 'white' },
  { rank: 1, file: 3, type: 'bishop', color: 'white' },
  { rank: 1, file: 4, type: 'queen', color: 'white' },
  { rank: 1, file: 5, type: 'king', color: 'white' },
  { rank: 1, file: 6, type: 'bishop', color: 'white' },
  { rank: 1, file: 7, type: 'knight', color: 'white' },
  { rank: 1, file: 8, type: 'rook', color: 'white' },

  // White pawns (rank 2)
  { rank: 2, file: 1, type: 'pawn', color: 'white' },
  { rank: 2, file: 2, type: 'pawn', color: 'white' },
  { rank: 2, file: 3, type: 'pawn', color: 'white' },
  { rank: 2, file: 4, type: 'pawn', color: 'white' },
  { rank: 2, file: 5, type: 'pawn', color: 'white' },
  { rank: 2, file: 6, type: 'pawn', color: 'white' },
  { rank: 2, file: 7, type: 'pawn', color: 'white' },
  { rank: 2, file: 8, type: 'pawn', color: 'white' },

  // Black pawns (rank 7)
  { rank: 7, file: 1, type: 'pawn', color: 'black' },
  { rank: 7, file: 2, type: 'pawn', color: 'black' },
  { rank: 7, file: 3, type: 'pawn', color: 'black' },
  { rank: 7, file: 4, type: 'pawn', color: 'black' },
  { rank: 7, file: 5, type: 'pawn', color: 'black' },
  { rank: 7, file: 6, type: 'pawn', color: 'black' },
  { rank: 7, file: 7, type: 'pawn', color: 'black' },
  { rank: 7, file: 8, type: 'pawn', color: 'black' },

  // Black back rank (rank 8)
  { rank: 8, file: 1, type: 'rook', color: 'black' },
  { rank: 8, file: 2, type: 'knight', color: 'black' },
  { rank: 8, file: 3, type: 'bishop', color: 'black' },
  { rank: 8, file: 4, type: 'queen', color: 'black' },
  { rank: 8, file: 5, type: 'king', color: 'black' },
  { rank: 8, file: 6, type: 'bishop', color: 'black' },
  { rank: 8, file: 7, type: 'knight', color: 'black' },
  { rank: 8, file: 8, type: 'rook', color: 'black' },
];

export const startCanvasLoop = (canvas: HTMLCanvasElement) => {
  const tick = () => {
    requestAnimationFrame(tick);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('!!');
    const rect = canvas.getBoundingClientRect();

    {
      const dpr = window.devicePixelRatio;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const boardRect = calculateBoardRect(rect);
    drawBoard(ctx, boardRect);

    drawPieces(ctx, boardRect, pieces);
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
