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

function toImage(url: string) {
  const img = new Image();
  img.src = url;
  return img;
}

const pieces = {
  pawn: { white: toImage(pawnLight), black: toImage(pawnDark) },
  knight: { white: toImage(knightLight), black: toImage(knightDark) },
  bishop: { white: toImage(bishopLight), black: toImage(bishopDark) },
  rook: { white: toImage(rookLight), black: toImage(rookDark) },
  queen: { white: toImage(queenLight), black: toImage(queenDark) },
  king: { white: toImage(kingLight), black: toImage(kingDark) },
};

export function pieceImage(type: 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king', color: 'white' | 'black') {
  return pieces[type][color];
}
