import { For, Show } from 'solid-js';
import { builtinCollections, builtinScenarios } from '../content/sample-collection';
import type { Scenario } from '../domain/types';
import {
  app,
  editScenario,
  navigate,
  openPlay,
  removeCustomScenario,
} from '../app/store';
import { MiniBoard } from './MiniBoard';

function ScenarioCard(props: { scenario: Scenario; custom?: boolean }) {
  const progress = () => {
    const recent = app.attempts.filter((attempt) => attempt.scenarioId === props.scenario.id);
    return {
      recent,
      status: recent.some((attempt) => attempt.success)
        ? 'completed'
        : recent.length > 0
          ? 'attempted'
          : 'unattempted',
    };
  };
  return (
    <article class="flex flex-col gap-4 rounded-xl border border-white/10 bg-neutral-800 p-4 sm:flex-row">
      <MiniBoard fen={props.scenario.initialFen} size="md" class="shadow" />
      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-2">
          <div>
            <h3 class="font-semibold">{props.scenario.name}</h3>
            <p class="mt-1 text-sm text-white/60">
              {props.scenario.goal.replace('_', ' ')} · {props.scenario.whiteClockMs / 1_000}s /{' '}
              {props.scenario.blackClockMs / 1_000}s
            </p>
          </div>
          <span class="rounded-full bg-white/10 px-2 py-1 text-xs capitalize text-white/70">
            {progress().status}
          </span>
        </div>
        <Show when={props.scenario.context}>
          <p class="mt-3 text-sm text-white/75">{props.scenario.context}</p>
        </Show>
        <Show when={progress().recent.length > 0}>
          <p class="mt-2 text-xs text-white/45">
            Recent: {progress().recent.slice(0, 3).map((attempt) => `${attempt.success ? '✓' : '×'} ${attempt.endingReason.replace('_', ' ')}`).join(' · ')}
          </p>
        </Show>
        <div class="mt-4 flex flex-wrap gap-2">
          <button class="primary-button" onClick={() => openPlay(props.scenario)}>Play</button>
          <Show when={props.custom}>
            <button class="secondary-button" onClick={() => editScenario(props.scenario)}>Edit</button>
            <button class="secondary-button" onClick={() => removeCustomScenario(props.scenario.id)}>Delete</button>
          </Show>
        </div>
      </div>
    </article>
  );
}

export function LibraryScreen() {
  return (
    <main class="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6">
      <header class="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">Chess Bullet Trainer</p>
          <h1 class="mt-1 text-3xl font-bold">Train the scramble</h1>
          <p class="mt-2 max-w-2xl text-white/60">Practice conversions, defense, premoves, and flagging against Stockfish.</p>
        </div>
        <nav class="flex flex-wrap gap-2">
          <button class="secondary-button" onClick={() => navigate('import')}>Import games</button>
          <button class="secondary-button" onClick={() => editScenario()}>New scenario</button>
          <button class="secondary-button" onClick={() => navigate('settings')}>Settings</button>
        </nav>
      </header>

      <For each={builtinCollections}>
        {(collection) => (
          <section class="mb-10">
            <h2 class="text-xl font-semibold">{collection.name}</h2>
            <p class="mt-1 text-sm text-white/60">{collection.description}</p>
            <div class="mt-4 grid gap-4 lg:grid-cols-2">
              <For each={collection.scenarioIds}>
                {(id) => {
                  const scenario = builtinScenarios.find((item) => item.id === id);
                  return scenario ? <ScenarioCard scenario={scenario} /> : null;
                }}
              </For>
            </div>
          </section>
        )}
      </For>

      <Show when={app.customScenarios.length > 0}>
        <section>
          <h2 class="text-xl font-semibold">Saved scenarios</h2>
          <div class="mt-4 grid gap-4 lg:grid-cols-2">
            <For each={app.customScenarios}>
              {(scenario) => <ScenarioCard scenario={scenario} custom />}
            </For>
          </div>
        </section>
      </Show>
    </main>
  );
}
