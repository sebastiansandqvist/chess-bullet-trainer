import bishopDark from './pieces/Chess_bdt45.svg';
import bishopLight from './pieces/Chess_blt45.svg';
import kingDark from './pieces/Chess_kdt45.svg';
import kingLight from './pieces/Chess_klt45.svg';
import knightDark from './pieces/Chess_ndt45.svg';
import knightLight from './pieces/Chess_nlt45.svg';
import pawnDark from './pieces/Chess_pdt45.svg';
import pawnLight from './pieces/Chess_plt45.svg';
import queenDark from './pieces/Chess_qdt45.svg';
import queenLight from './pieces/Chess_qlt45.svg';
import rookDark from './pieces/Chess_rdt45.svg';
import rookLight from './pieces/Chess_rlt45.svg';

export type PieceColor = 'white' | 'black';
export type PieceKind = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';

const pieceUrls = {
  pawn: { white: pawnLight, black: pawnDark },
  knight: { white: knightLight, black: knightDark },
  bishop: { white: bishopLight, black: bishopDark },
  rook: { white: rookLight, black: rookDark },
  queen: { white: queenLight, black: queenDark },
  king: { white: kingLight, black: kingDark },
} as const;

const images = {
  pawn: { white: toImage(pawnLight), black: toImage(pawnDark) },
  knight: { white: toImage(knightLight), black: toImage(knightDark) },
  bishop: { white: toImage(bishopLight), black: toImage(bishopDark) },
  rook: { white: toImage(rookLight), black: toImage(rookDark) },
  queen: { white: toImage(queenLight), black: toImage(queenDark) },
  king: { white: toImage(kingLight), black: toImage(kingDark) },
};

function toImage(url: string) {
  const img = new Image();
  img.src = url;
  return img;
}

const fenPieceMap: Record<string, { type: PieceKind; color: PieceColor }> = {
  P: { type: 'pawn', color: 'white' },
  N: { type: 'knight', color: 'white' },
  B: { type: 'bishop', color: 'white' },
  R: { type: 'rook', color: 'white' },
  Q: { type: 'queen', color: 'white' },
  K: { type: 'king', color: 'white' },
  p: { type: 'pawn', color: 'black' },
  n: { type: 'knight', color: 'black' },
  b: { type: 'bishop', color: 'black' },
  r: { type: 'rook', color: 'black' },
  q: { type: 'queen', color: 'black' },
  k: { type: 'king', color: 'black' },
};

export function pieceImage(type: PieceKind, color: PieceColor) {
  return images[type][color];
}

export function pieceUrl(type: PieceKind, color: PieceColor) {
  return pieceUrls[type][color];
}

export function fenPieceUrl(letter: string) {
  const piece = fenPieceMap[letter];
  return piece ? pieceUrl(piece.type, piece.color) : null;
}

export function fenPlacementSquares(fen: string) {
  const placement = fen.split(/\s+/)[0] ?? '';
  const squares: string[] = [];
  for (const char of placement) {
    if (char === '/') continue;
    const empty = Number(char);
    if (empty) {
      squares.push(...Array.from({ length: empty }, () => ''));
      continue;
    }
    squares.push(char);
  }
  while (squares.length < 64) squares.push('');
  return squares.slice(0, 64);
}
