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

export function pieceImage(type: 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king', color: 'white' | 'black') {
  return {
    pawn: { white: pawnLight, black: pawnDark },
    knight: { white: knightLight, black: knightDark },
    bishop: { white: bishopLight, black: bishopDark },
    rook: { white: rookLight, black: rookDark },
    queen: { white: queenLight, black: queenDark },
    king: { white: kingLight, black: kingDark },
  }[type][color];
}
