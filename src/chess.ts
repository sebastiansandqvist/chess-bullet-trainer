export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

export type Piece = {
  rank: number;
  file: number;
  type: PieceType;
  color: PieceColor;
};

export const initialPieces: Piece[] = [
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

const pieceToFenChar: Record<PieceType, string> = {
  pawn: 'p',
  rook: 'r',
  knight: 'n',
  bishop: 'b',
  queen: 'q',
  king: 'k',
};

const fenCharToPiece: Record<string, PieceType> = {
  p: 'pawn',
  r: 'rook',
  n: 'knight',
  b: 'bishop',
  q: 'queen',
  k: 'king',
};

export function piecesToFen(
  inputPieces: Piece[],
  options: {
    sideToMove?: 'w' | 'b';
    castling?: string;
    enPassant?: string;
    halfmove?: number;
    fullmove?: number;
  } = {},
) {
  const board: (Piece | null)[][] = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null));

  for (const piece of inputPieces) {
    const rankIndex = 8 - piece.rank;
    const fileIndex = piece.file - 1;
    if (rankIndex < 0 || rankIndex > 7 || fileIndex < 0 || fileIndex > 7) {
      continue;
    }
    const row = board[rankIndex];
    if (!row) continue;
    row[fileIndex] = piece;
  }

  const rows = board.map((row) => {
    let empty = 0;
    let line = '';
    for (const cell of row) {
      if (!cell) {
        empty += 1;
        continue;
      }
      if (empty > 0) {
        line += String(empty);
        empty = 0;
      }
      const char = pieceToFenChar[cell.type];
      line += cell.color === 'white' ? char.toUpperCase() : char;
    }
    if (empty > 0) {
      line += String(empty);
    }
    return line;
  });

  const placement = rows.join('/');
  const sideToMove = options.sideToMove ?? 'w';
  const castling = options.castling ?? 'KQkq';
  const enPassant = options.enPassant ?? '-';
  const halfmove = options.halfmove ?? 0;
  const fullmove = options.fullmove ?? 1;

  return `${placement} ${sideToMove} ${castling} ${enPassant} ${halfmove} ${fullmove}`;
}

export function fenToPieces(fen: string) {
  const [placement] = fen.trim().split(/\s+/);
  const rows = (placement ?? '').split('/');
  const output: Piece[] = [];

  for (let rankIndex = 0; rankIndex < 8; rankIndex += 1) {
    const row = rows[rankIndex] ?? '';
    let fileIndex = 0;
    for (const char of row) {
      const emptyCount = Number(char);
      if (!Number.isNaN(emptyCount)) {
        fileIndex += emptyCount;
        continue;
      }
      const lower = char.toLowerCase();
      const type = fenCharToPiece[lower];
      if (!type) {
        fileIndex += 1;
        continue;
      }
      output.push({
        rank: 8 - rankIndex,
        file: fileIndex + 1,
        type,
        color: char === lower ? 'black' : 'white',
      });
      fileIndex += 1;
    }
  }

  return output;
}

const files = 'abcdefgh'.split('');

export function formatMove(move: string) {
  // like "e7e5"
  return {
    from: {
      rank: parseInt(move[1]!, 10),
      file: files.indexOf(move[0]!) + 1,
    },
    to: {
      rank: parseInt(move[3]!, 10),
      file: files.indexOf(move[2]!) + 1,
    },
  };
}

export function rankAndFileToString(piece: { rank: number; file: number }) {
  const file = 'abcdefgh'[piece.file - 1]!;
  return `${file}${piece.rank}`;
}

// todo: more legality checks
export function isLegalMove(move: string) {
  const x = formatMove(move);
  return !(x.from.file === x.to.file && x.from.rank === x.to.rank);
}
