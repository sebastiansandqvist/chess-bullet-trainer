import { Component, onCleanup, onMount } from 'solid-js';
import { startCanvasLoop } from './chess-canvas';
import pawnDark from './pieces/Chess_pdt45.svg';
import pawnLight from './pieces/Chess_plt45.svg';
import { playMove } from './state';
import { createStockfishClient } from './stockfish/client';

export const App = () => {
  return (
    <div class="grid grid-cols-[200px_1fr] min-h-screen">
      <aside class="bg-neutral-800">
        <form class="flex flex-col gap-4 p-4">
          <h2 class="text-lg font-semibold">Setup</h2>
          {/*<div>Starting position (PGN/FEN/URLs)</div>*/}
          <fieldset class="flex flex-col gap-2">
            <legend class="text-sm font-medium">Color</legend>
            <div class="flex gap-2">
              <label class="cursor-pointer">
                <input type="radio" name="playerColor" value="white" checked class="sr-only peer" />
                <span class="flex aspect-square w-12 items-center justify-center rounded bg-black/20 peer-checked:bg-white">
                  <img src={pawnLight} alt="White pawn" class="h-6 w-6" />
                </span>
              </label>
              <label class="cursor-pointer">
                <input type="radio" name="playerColor" value="black" class="sr-only peer" />
                <span class="flex aspect-square w-12 items-center justify-center rounded bg-black/20 peer-checked:bg-white">
                  <img src={pawnDark} alt="Black pawn" class="h-6 w-6" />
                </span>
              </label>
            </div>
          </fieldset>
          <fieldset class="flex flex-col gap-2">
            <legend class="text-sm font-medium">Starting times</legend>
            <label class="flex items-center justify-between gap-2">
              <span class="text-sm">White</span>
              <input
                class="w-24 rounded border border-black/10 bg-black/20 px-2 py-1 text-right"
                type="number"
                min="1"
                step="1"
                value="60"
              />
            </label>
            <label class="flex items-center justify-between gap-2">
              <span class="text-sm">Black</span>
              <input
                class="w-24 rounded border border-black/10 bg-black/20 px-2 py-1 text-right"
                type="number"
                min="1"
                step="1"
                value="60"
              />
            </label>
          </fieldset>
          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium">Time per Stockfish move</span>
            <input
              class="w-24 rounded border border-black/10 bg-black/20 px-2 py-1 text-right"
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
      <main class="flex flex-col gap-2 justify-center bg-neutral-800">
        <div class="flex items-center justify-between">
          name
          <div class="rounded bg-black/20 text-white p-2">00:00</div>
        </div>
        <ChessCanvas />
        <div class="flex items-center justify-between">
          name
          <div class="rounded bg-white/50 text-black p-2">00:00</div>
        </div>
      </main>
    </div>
  );
};

const ChessCanvas: Component = () => {
  return (
    <div class="relative max-h-full max-w-full aspect-square">
      <canvas class="absolute inset-0 h-full w-full" ref={startCanvasLoop} />
    </div>
  );
};
