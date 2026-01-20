import { Component } from 'solid-js';
import { startCanvasLoop } from './chess-canvas';
import pawnDark from './pieces/Chess_pdt45.svg';
import pawnLight from './pieces/Chess_plt45.svg';

export const App = () => {
  return (
    <div class="grid grid-cols-[200px_1fr] min-h-screen">
      <aside class="bg-neutral-800">
        <form class="flex flex-col gap-4 p-4">
          <h2 class="text-lg font-semibold">Setup</h2>
          {/*<div>Starting position (PGN/FEN/URLs)</div>*/}
          <fieldset class="flex flex-col gap-3">
            <legend class="text-sm font-medium text-white/70">Color</legend>
            <div class="flex gap-2">
              <label class="cursor-pointer">
                <input type="radio" name="playerColor" value="white" checked class="sr-only peer" />
                <span class="flex aspect-square w-12 items-center justify-center rounded-md bg-neutral-700/50 ring-1 ring-white/10 transition hover:ring-white/20 peer-checked:ring-2 peer-checked:ring-amber-400 peer-checked:hover:ring-2 peer-checked:hover:ring-amber-400">
                  <img src={pawnLight} alt="White pawn" class="h-6 w-6" />
                </span>
              </label>
              <label class="cursor-pointer">
                <input type="radio" name="playerColor" value="black" class="sr-only peer" />
                <span class="flex aspect-square w-12 items-center justify-center rounded-md bg-neutral-700/50 ring-1 ring-white/10 transition hover:ring-white/20 peer-checked:ring-2 peer-checked:ring-amber-400 peer-checked:hover:ring-2 peer-checked:hover:ring-amber-400">
                  <img src={pawnDark} alt="Black pawn" class="h-6 w-6" />
                </span>
              </label>
            </div>
          </fieldset>
          <fieldset class="flex flex-col gap-3">
            <legend class="text-sm font-medium text-white/70">Starting times</legend>
            <div class="flex flex-col gap-2">
              <label class="flex items-center justify-between gap-2">
                <span class="text-sm text-white/70">White</span>
                <input
                  class="w-24 rounded-md border border-white/10 bg-neutral-700/60 px-3 py-1.5 text-right text-sm text-white shadow-sm tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-800"
                  type="number"
                  min="1"
                  step="1"
                  value="60"
                />
              </label>
              <label class="flex items-center justify-between gap-2">
                <span class="text-sm text-white/70">Black</span>
                <input
                  class="w-24 rounded-md border border-white/10 bg-neutral-700/60 px-3 py-1.5 text-right text-sm text-white shadow-sm tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-800"
                  type="number"
                  min="1"
                  step="1"
                  value="60"
                />
              </label>
            </div>
          </fieldset>
          <label class="flex flex-col gap-2">
            <span class="text-sm font-medium text-white/70">Time per Stockfish move</span>
            <input
              class="w-24 rounded-md border border-white/10 bg-neutral-700/60 px-3 py-1.5 text-right text-sm text-white shadow-sm tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-800"
              type="number"
              min="0.1"
              step="0.1"
              value="0.5"
            />
          </label>
          {/*<div>Move history + depth log</div>*/}
          {/*<div>First move starts timer</div>*/}
          {/*<div>Choose color by first move</div>*/}
          {/*<div>Unlimited premoves (0.1s each)</div>*/}
          {/*<div>Scenario presets</div>*/}
        </form>
      </aside>
      <main class="grid grid-rows-[auto_minmax(0,1fr)_auto] h-fit self-center gap-2 bg-neutral-800 p-4 max-w-[70vh] mx-auto">
        <div class="flex items-center justify-between">
          name
          <div class="rounded bg-black/20 text-white p-2">00:00</div>
        </div>
        <div class="flex min-h-0 min-w-0 items-center justify-center">
          <div class="w-full max-w-[70vh] aspect-square overflow-hidden">
            <ChessCanvas />
          </div>
        </div>
        <div class="flex items-center justify-between">
          name
          <div class="rounded bg-white/50 text-black p-2">00:00</div>
        </div>
      </main>
    </div>
  );
};

const ChessCanvas: Component = () => {
  return <canvas class="block h-full w-full" ref={startCanvasLoop} />;
};
