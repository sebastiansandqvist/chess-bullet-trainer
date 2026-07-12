import type { Color } from '../domain/types';

export type BoardRect = { x: number; y: number; size: number };

export function calculateBoardRect(rect: Pick<DOMRect, 'width' | 'height'>): BoardRect {
  const size = Math.min(rect.width, rect.height);
  return { x: (rect.width - size) / 2, y: (rect.height - size) / 2, size };
}

export function pointToSquare(
  board: BoardRect,
  x: number,
  y: number,
  orientation: Color,
) {
  if (x < board.x || y < board.y || x >= board.x + board.size || y >= board.y + board.size) {
    return null;
  }
  const displayedFile = Math.floor(((x - board.x) / board.size) * 8);
  const displayedRank = Math.floor(((y - board.y) / board.size) * 8);
  const file = orientation === 'white' ? displayedFile : 7 - displayedFile;
  const rank = orientation === 'white' ? 7 - displayedRank : displayedRank;
  return `${'abcdefgh'[file]}${rank + 1}`;
}

export function squareToPixel(board: BoardRect, square: string, orientation: Color) {
  if (!/^[a-h][1-8]$/.test(square)) return null;
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  const displayedFile = orientation === 'white' ? file : 7 - file;
  const displayedRank = orientation === 'white' ? 7 - rank : rank;
  const size = board.size / 8;
  return { x: board.x + displayedFile * size, y: board.y + displayedRank * size, size };
}
