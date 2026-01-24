export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

export type RenderPiece = {
  rank: number;
  file: number;
  type: PieceType;
  color: PieceColor;
  square: string;
};

const fileLetters = 'abcdefgh';

const pieceTypeMap: Record<string, PieceType> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

const pieceColorMap: Record<string, PieceColor> = {
  w: 'white',
  b: 'black',
};

export function rankAndFileToString(piece: { rank: number; file: number }) {
  const file = fileLetters[piece.file - 1];
  return file ? `${file}${piece.rank}` : '';
}

export function parseUciMove(uci: string) {
  const trimmed = uci.trim().toLowerCase();
  if (trimmed.length < 4) return null;
  const from = trimmed.slice(0, 2);
  const to = trimmed.slice(2, 4);
  const promotion = trimmed.length >= 5 ? trimmed[4] : undefined;
  return { from, to, promotion };
}

export function boardToPieces(board: ({ square: string; type: string; color: string } | null)[][]): RenderPiece[] {
  const pieces: RenderPiece[] = [];
  for (let row = 0; row < board.length; row += 1) {
    const boardRow = board[row] ?? [];
    for (let col = 0; col < boardRow.length; col += 1) {
      const cell = boardRow[col];
      if (!cell) continue;
      const type = pieceTypeMap[cell.type];
      const color = pieceColorMap[cell.color];
      if (!type || !color) continue;
      pieces.push({
        rank: 8 - row,
        file: col + 1,
        type,
        color,
        square: cell.square,
      });
    }
  }
  return pieces;
}
