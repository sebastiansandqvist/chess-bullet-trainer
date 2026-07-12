import { Chess } from 'chess.js';
import { createMemo } from 'solid-js';
import { app, navigate, playSetup, saveSetup, updateSetup } from '../app/store';
import { validateFen } from '../domain/chess';
import type { Color, ScenarioGoal } from '../domain/types';
import { BoardEditor } from './BoardEditor';

const goals: { value: ScenarioGoal; label: string }[] = [
  { value: 'win', label: 'Win' },
  { value: 'draw', label: 'Draw' },
  { value: 'avoid_loss', label: 'Avoid loss' },
  { value: 'checkmate', label: 'Checkmate' },
  { value: 'flag_opponent', label: 'Flag opponent' },
];

export function SetupScreen() {
  const valid = createMemo(() => validateFen(app.setup.fen).valid);
  const parseInput = () => {
    const input = app.setup.input.trim();
    if (!input) return;
    if (/^https?:\/\/(?:www\.)?lichess\.org\//i.test(input)) {
      navigate('import');
      return;
    }
    const fen = validateFen(input);
    if (fen.valid && fen.fen) {
      updateSetup('fen', fen.fen);
      return;
    }
    try {
      const game = new Chess();
      game.loadPgn(input);
      updateSetup('fen', game.fen());
    } catch {
      // The board validation below remains the single inline error surface.
    }
  };

  return (
    <main class="mx-auto min-h-screen max-w-5xl px-4 py-6">
      <header class="mb-6 flex items-center justify-between">
        <div>
          <p class="text-sm text-amber-400">Scenario setup</p>
          <h1 class="text-2xl font-bold">{app.setup.id ? 'Edit scenario' : 'Create scenario'}</h1>
        </div>
        <button class="secondary-button" onClick={() => navigate('library')}>Back</button>
      </header>
      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section class="space-y-5">
          <label class="label">
            Paste FEN, PGN, or Lichess URL
            <textarea class="field min-h-24" value={app.setup.input} onInput={(event) => updateSetup('input', event.currentTarget.value)} />
          </label>
          <button class="secondary-button" type="button" onClick={parseInput}>Use pasted position</button>
          <BoardEditor fen={app.setup.fen} onChange={(fen) => updateSetup('fen', fen)} />
        </section>
        <form class="space-y-4 rounded-xl border border-white/10 bg-neutral-800 p-5" onSubmit={(event) => event.preventDefault()}>
          <label class="label">Name<input class="field" value={app.setup.name} onInput={(event) => updateSetup('name', event.currentTarget.value)} /></label>
          <label class="label">Context<textarea class="field" value={app.setup.context} onInput={(event) => updateSetup('context', event.currentTarget.value)} /></label>
          <label class="label">Trainee color
            <select class="field" value={app.setup.traineeColor} onChange={(event) => updateSetup('traineeColor', event.currentTarget.value as Color)}>
              <option value="white">White</option><option value="black">Black</option>
            </select>
          </label>
          <div class="grid grid-cols-2 gap-3">
            <NumberField label="White seconds" value={app.setup.whiteClockSeconds} set={(value) => updateSetup('whiteClockSeconds', value)} />
            <NumberField label="Black seconds" value={app.setup.blackClockSeconds} set={(value) => updateSetup('blackClockSeconds', value)} />
            <NumberField label="Increment" value={app.setup.incrementSeconds} set={(value) => updateSetup('incrementSeconds', value)} />
            <NumberField label="Engine move" value={app.setup.engineMoveSeconds} set={(value) => updateSetup('engineMoveSeconds', value)} />
          </div>
          <label class="label">Goal
            <select class="field" value={app.setup.goal} onChange={(event) => updateSetup('goal', event.currentTarget.value as ScenarioGoal)}>
              {goals.map((goal) => <option value={goal.value}>{goal.label}</option>)}
            </select>
          </label>
          <div class="flex gap-2 pt-2">
            <button class="primary-button" type="button" disabled={!valid()} onClick={playSetup}>Play</button>
            <button class="secondary-button" type="button" disabled={!valid()} onClick={saveSetup}>Save</button>
          </div>
        </form>
      </div>
    </main>
  );
}

function NumberField(props: { label: string; value: number; set: (value: number) => void }) {
  return (
    <label class="label">{props.label}
      <input class="field" type="number" min="0" step="0.1" value={props.value} onInput={(event) => props.set(Number(event.currentTarget.value))} />
    </label>
  );
}
