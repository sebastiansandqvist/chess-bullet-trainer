import type { Color, RenderPiece } from '../domain/types';
import { calculateBoardRect, pointToSquare } from './geometry';

export type BoardIntent =
  | { type: 'select'; square: string | null }
  | { type: 'move'; from: string; to: string; altKey: boolean }
  | { type: 'cancel_premoves' };

export type LocalDrag = {
  piece: RenderPiece;
  x: number;
  y: number;
};

export function createBoardInput(args: {
  canvas: HTMLCanvasElement;
  getOrientation: () => Color;
  getPieces: () => RenderPiece[];
  onIntent: (intent: BoardIntent) => void;
  onDrag: (drag: LocalDrag | null) => void;
}) {
  let selected: string | null = null;
  let dragging: RenderPiece | null = null;
  let pointerId: number | null = null;
  let moved = false;
  let originX = 0;
  let originY = 0;

  const relativePoint = (event: PointerEvent) => {
    const bounds = args.canvas.getBoundingClientRect();
    return {
      bounds,
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
  };

  const clearDrag = () => {
    dragging = null;
    pointerId = null;
    moved = false;
    args.onDrag(null);
  };

  const down = (event: PointerEvent) => {
    if (event.button === 2) {
      args.onIntent({ type: 'cancel_premoves' });
      return;
    }
    event.preventDefault();
    const point = relativePoint(event);
    const square = pointToSquare(
      calculateBoardRect(point.bounds),
      point.x,
      point.y,
      args.getOrientation(),
    );
    if (!square) return;
    const piece = args.getPieces().find((item) => item.square === square) ?? null;
    if (event.pointerType === 'touch' && !selected && !piece) {
      args.onIntent({ type: 'cancel_premoves' });
      return;
    }
    pointerId = event.pointerId;
    originX = point.x;
    originY = point.y;
    moved = false;
    args.canvas.setPointerCapture(event.pointerId);

    if (selected && selected !== square) {
      args.onIntent({ type: 'move', from: selected, to: square, altKey: event.altKey });
      selected = null;
      args.onIntent({ type: 'select', square: null });
      clearDrag();
      return;
    }

    selected = piece ? square : null;
    dragging = piece;
    args.onIntent({ type: 'select', square: selected });
    if (piece) args.onDrag({ piece, x: point.x, y: point.y });
  };

  const move = (event: PointerEvent) => {
    if (!dragging || event.pointerId !== pointerId) return;
    event.preventDefault();
    const point = relativePoint(event);
    if (!moved) {
      const dx = point.x - originX;
      const dy = point.y - originY;
      moved = dx * dx + dy * dy > 9;
    }
    args.onDrag({ piece: dragging, x: point.x, y: point.y });
  };

  const end = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    const from = dragging?.square;
    const point = relativePoint(event);
    const to = pointToSquare(
      calculateBoardRect(point.bounds),
      point.x,
      point.y,
      args.getOrientation(),
    );
    const didDrag = moved;
    clearDrag();
    if (from && to && from !== to && didDrag) {
      selected = null;
      args.onIntent({ type: 'select', square: null });
      args.onIntent({ type: 'move', from, to, altKey: event.altKey });
    }
  };

  const cancel = () => {
    selected = null;
    clearDrag();
    args.onIntent({ type: 'select', square: null });
  };
  const contextMenu = (event: MouseEvent) => {
    event.preventDefault();
    args.onIntent({ type: 'cancel_premoves' });
  };

  args.canvas.addEventListener('pointerdown', down);
  args.canvas.addEventListener('pointermove', move);
  args.canvas.addEventListener('pointerup', end);
  args.canvas.addEventListener('pointercancel', cancel);
  args.canvas.addEventListener('contextmenu', contextMenu);
  window.addEventListener('blur', cancel);
  return () => {
    args.canvas.removeEventListener('pointerdown', down);
    args.canvas.removeEventListener('pointermove', move);
    args.canvas.removeEventListener('pointerup', end);
    args.canvas.removeEventListener('pointercancel', cancel);
    args.canvas.removeEventListener('contextmenu', contextMenu);
    window.removeEventListener('blur', cancel);
  };
}
