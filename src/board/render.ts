import { pieceImage } from '../pieces';
import type { Color, RenderPiece } from '../domain/types';
import { calculateBoardRect, squareToPixel } from './geometry';

export type BoardViewModel = {
  pieces: RenderPiece[];
  orientation: Color;
  selected?: string | null;
  legalSquares?: string[];
  lastMove?: [string, string] | null;
  premoveSquares?: string[];
  checkSquare?: string | null;
  dragging?: { piece: RenderPiece; x: number; y: number } | null;
};

const colors = {
  light: '#eeeed2',
  dark: '#769656',
  selected: 'rgba(246, 246, 105, .68)',
  last: 'rgba(246, 246, 105, .42)',
  premove: 'rgba(202, 71, 71, .58)',
  check: 'rgba(220, 38, 38, .72)',
};

function fillSquare(
  context: CanvasRenderingContext2D,
  rect: ReturnType<typeof calculateBoardRect>,
  square: string,
  orientation: Color,
  color: string,
) {
  const pixel = squareToPixel(rect, square, orientation);
  if (!pixel) return;
  context.fillStyle = color;
  context.fillRect(pixel.x, pixel.y, pixel.size, pixel.size);
}

export function drawBoardView(canvas: HTMLCanvasElement, view: BoardViewModel) {
  const context = canvas.getContext('2d');
  if (!context) return;
  const bounds = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(bounds.width * dpr));
  const height = Math.max(1, Math.round(bounds.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, bounds.width, bounds.height);
  const board = calculateBoardRect(bounds);
  const squareSize = board.size / 8;

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      context.fillStyle = (row + col) % 2 ? colors.dark : colors.light;
      context.fillRect(board.x + col * squareSize, board.y + row * squareSize, squareSize, squareSize);
    }
  }
  for (const square of view.lastMove ?? []) fillSquare(context, board, square, view.orientation, colors.last);
  for (const square of view.premoveSquares ?? []) {
    fillSquare(context, board, square, view.orientation, colors.premove);
  }
  if (view.selected) fillSquare(context, board, view.selected, view.orientation, colors.selected);
  if (view.checkSquare) fillSquare(context, board, view.checkSquare, view.orientation, colors.check);

  for (const square of view.legalSquares ?? []) {
    const pixel = squareToPixel(board, square, view.orientation);
    if (!pixel) continue;
    context.beginPath();
    context.fillStyle = 'rgba(0, 0, 0, .25)';
    context.arc(pixel.x + pixel.size / 2, pixel.y + pixel.size / 2, pixel.size * 0.12, 0, Math.PI * 2);
    context.fill();
  }

  const draggingSquare = view.dragging?.piece.square;
  for (const piece of view.pieces) {
    if (piece.square === draggingSquare) continue;
    const pixel = squareToPixel(board, piece.square, view.orientation);
    const image = pieceImage(piece.type, piece.color);
    if (!pixel || !image.complete) continue;
    const padding = pixel.size * 0.06;
    context.drawImage(
      image,
      pixel.x + padding,
      pixel.y + padding,
      pixel.size - padding * 2,
      pixel.size - padding * 2,
    );
  }

  if (view.dragging) {
    const image = pieceImage(view.dragging.piece.type, view.dragging.piece.color);
    if (image.complete) {
      const size = squareSize * 0.9;
      context.drawImage(image, view.dragging.x - size / 2, view.dragging.y - size / 2, size, size);
    }
  }
}
