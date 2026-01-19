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
      <main class="bg-green-500/20">
        <ChessCanvas />
      </main>
    </div>
  );
};

const ChessCanvas: Component = () => {
  return (
    <div class="relative h-full w-full">
      <canvas class="absolute inset-0 h-full w-full" ref={startCanvasLoop} />
    </div>
  );
};
