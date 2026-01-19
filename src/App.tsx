import { Component } from 'solid-js';
import { startCanvasLoop } from './chess-canvas';

export const App = () => {
  return (
    <div class="grid grid-cols-[300px_1fr] min-h-screen">
      <aside class="bg-red-500/20">
        <ul>
          <li>Starting position (PGN/FEN/URLs)</li>
          <li>Board orientation</li>
          <li>Player times</li>
          <li>Time per Stockfish move</li>
          <li>Move history + depth log</li>
          <li>First move starts timer</li>
          <li>Choose color by first move</li>
          <li>Unlimited premoves (0.1s each)</li>
          <li>Scenario presets</li>
        </ul>
      </aside>
      <main class="flex flex-col gap-2 justify-center bg-green-500/20">
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
