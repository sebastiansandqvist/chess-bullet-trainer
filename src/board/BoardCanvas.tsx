import { createEffect, onCleanup, onMount } from 'solid-js';
import type { BoardIntent, LocalDrag } from './input';
import { createBoardInput } from './input';
import { drawBoardView, type BoardViewModel } from './render';

export function BoardCanvas(props: {
  view: BoardViewModel;
  onIntent?: (intent: BoardIntent) => void;
  class?: string;
}) {
  let canvas!: HTMLCanvasElement;
  let viewRef: BoardViewModel = props.view;
  let drag: LocalDrag | null = null;
  let raf = 0;

  const paint = () => {
    raf = 0;
    if (!canvas) return;
    drawBoardView(canvas, {
      ...viewRef,
      dragging: drag,
    });
  };

  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(paint);
  };

  onMount(() => {
    const disposeInput = props.onIntent
      ? createBoardInput({
          canvas,
          getOrientation: () => viewRef.orientation,
          getPieces: () => viewRef.pieces,
          onIntent: props.onIntent,
          onDrag: (next) => {
            drag = next;
            schedule();
          },
        })
      : undefined;

    const resizeObserver = new ResizeObserver(() => schedule());
    resizeObserver.observe(canvas);
    schedule();

    onCleanup(() => {
      disposeInput?.();
      resizeObserver.disconnect();
      if (raf) cancelAnimationFrame(raf);
    });
  });

  createEffect(() => {
    viewRef = props.view;
    schedule();
  });

  return (
    <canvas
      ref={canvas}
      class={`block aspect-square h-full w-full touch-none rounded-md ${props.class ?? ''}`}
      aria-label="Chess board"
    />
  );
}
