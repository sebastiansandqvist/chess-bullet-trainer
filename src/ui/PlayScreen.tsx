import { createMemo, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { BoardCanvas } from '../board/BoardCanvas';
import type { BoardIntent } from '../board/input';
import { builtinScenarios } from '../content/sample-collection';
import { turnToColor } from '../domain/chess';
import { formatClock } from '../domain/clocks';
import type { Color, PlayerPresentation } from '../domain/types';
import {
  app,
  beginSession,
  boardPieces,
  cancelEngineDownload,
  cancelPremoves,
  choosePromotion,
  displayedClock,
  downloadEngine,
  handleBoardMove,
  legalSquares,
  navigate,
  openPlay,
  resign,
  retrySession,
  setApp,
  tick,
} from '../app/store';

export function PlayScreen() {
  const [now, setNow] = createSignal(performance.now());
  onMount(() => {
    const timer = window.setInterval(() => {
      const value = performance.now();
      setNow(value);
      tick(value);
    }, 50);
    onCleanup(() => window.clearInterval(timer));
  });

  const lastMove = createMemo(() => {
    const uci = app.session?.moves.at(-1)?.uci;
    return uci ? ([uci.slice(0, 2), uci.slice(2, 4)] as [string, string]) : null;
  });
  const checkSquare = createMemo(() => {
    const session = app.session;
    if (!session?.game.inCheck()) return null;
    const color = turnToColor(session.game.turn());
    return boardPieces().find((piece) => piece.type === 'king' && piece.color === color)?.square ?? null;
  });
  const progressPercent = createMemo(() => {
    const progress = app.engine.progress;
    return progress?.total ? Math.min(100, (progress.loaded / progress.total) * 100) : null;
  });
  const onIntent = (intent: BoardIntent) => {
    if (intent.type === 'select') setApp('selectedSquare', intent.square);
    if (intent.type === 'move') handleBoardMove(intent.from, intent.to, intent.altKey);
    if (intent.type === 'cancel_premoves') cancelPremoves();
  };

  return (
    <main class="mx-auto flex min-h-screen max-w-5xl flex-col px-3 py-3 sm:px-6">
      <header class="mb-3 flex items-center justify-between gap-4">
        <div>
          <h1 class="font-semibold">{app.selectedScenario?.name ?? 'Scenario'}</h1>
          <p class="text-sm capitalize text-white/55">{app.selectedScenario?.goal.replace('_', ' ')}</p>
        </div>
        <button class="secondary-button" onClick={() => { resign(); navigate('library'); }}>Exit</button>
      </header>

      <Show
        when={app.session}
        fallback={
          <section class="m-auto w-full max-w-md rounded-xl border border-white/10 bg-neutral-800 p-6 text-center">
            <Show when={app.engine.cached === false}>
              <h2 class="text-xl font-semibold">Stockfish is required</h2>
              <p class="mt-2 text-sm text-white/60">The engine runs entirely on this device and is stored for offline play.</p>
              <button class="primary-button mt-5 w-full" disabled={app.engine.state === 'loading'} onClick={downloadEngine}>
                {app.engine.state === 'loading' ? 'Downloading engine…' : 'Download engine (~75 MB)'}
              </button>
              <Show when={app.engine.state === 'loading'}>
                <div class="mt-4 h-2 overflow-hidden rounded bg-white/10">
                  <div class={`h-full bg-amber-400 ${progressPercent() === null ? 'animate-pulse w-1/2' : ''}`} style={{ width: progressPercent() === null ? undefined : `${progressPercent()}%` }} />
                </div>
                <p class="mt-2 text-xs text-white/50">
                  {app.engine.progress?.filesComplete ?? 0} / {app.engine.progress?.filesTotal ?? 7} files
                </p>
                <button class="secondary-button mt-3" onClick={cancelEngineDownload}>Cancel</button>
              </Show>
            </Show>
            <Show when={app.engine.cached === null}>
              <p>Checking the offline engine…</p>
            </Show>
            <Show when={app.engine.cached === true}>
              <button class="primary-button w-full" onClick={beginSession}>Start scenario</button>
            </Show>
            <Show when={app.engine.error}><p class="mt-3 text-sm text-red-400">{app.engine.error}</p></Show>
          </section>
        }
      >
        {(session) => (
          <div class="mx-auto grid w-full max-w-[min(95vw,78vh)] flex-1 grid-rows-[auto_minmax(0,1fr)_auto] gap-2">
            <PlayerBar
              label={session().scenario.traineeColor === 'white' ? 'Stockfish' : 'You'}
              player={playerForColor(
                session().scenario,
                session().scenario.traineeColor === 'white' ? 'black' : 'white',
              )}
              time={displayedClock(session().scenario.traineeColor === 'white' ? 'black' : 'white', now())}
              active={session().clocks.running !== session().scenario.traineeColor}
            />
            <div class="relative min-h-0">
              <BoardCanvas
                view={{
                  pieces: boardPieces(),
                  orientation: session().scenario.orientation,
                  selected: app.selectedSquare,
                  legalSquares: app.preferences.legalMoveDots ? legalSquares() : [],
                  lastMove: lastMove(),
                  premoveSquares: session().premoves.flatMap((move) => [move.from, move.to]),
                  checkSquare: checkSquare(),
                }}
                onIntent={onIntent}
              />
              <Show when={session().phase === 'countdown'}>
                <div class="absolute inset-0 grid place-items-center rounded bg-black/45 text-6xl font-bold">
                  {Math.max(1, Math.ceil(((session().countdownUntil ?? now()) - now()) / 1_000))}
                </div>
              </Show>
            </div>
            <PlayerBar
              label={session().scenario.traineeColor === 'white' ? 'You' : 'Stockfish'}
              player={playerForColor(session().scenario, session().scenario.traineeColor)}
              time={displayedClock(session().scenario.traineeColor, now())}
              active={session().clocks.running === session().scenario.traineeColor}
            />
            <button class="secondary-button justify-self-center" onClick={resign}>Resign</button>
          </div>
        )}
      </Show>

      <Show when={app.promotion}>
        <div class="fixed inset-0 z-20 grid place-items-center bg-black/60">
          <div class="rounded-xl bg-neutral-800 p-5">
            <p class="mb-3 font-semibold">Promote to</p>
            <div class="flex gap-2">
              {(['q', 'r', 'b', 'n'] as const).map((piece) => (
                <button class="primary-button text-xl uppercase" onClick={() => choosePromotion(piece)}>{piece}</button>
              ))}
            </div>
          </div>
        </div>
      </Show>

      <Show when={app.session?.result}>
        {(result) => (
          <div class="fixed inset-0 z-30 grid place-items-center bg-black/70 p-4">
            <section class="w-full max-w-sm rounded-xl border border-white/10 bg-neutral-800 p-6 text-center shadow-2xl">
              <p class={`text-sm font-semibold uppercase tracking-wider ${result().success ? 'text-emerald-400' : 'text-red-400'}`}>
                {result().success ? 'Goal achieved' : 'Try again'}
              </p>
              <h2 class="mt-2 text-2xl font-bold capitalize">{result().chessResult} · {result().endingReason.replace('_', ' ')}</h2>
              <p class="mt-3 text-sm text-white/60">{formatClock(result().whiteClockMs)} — {formatClock(result().blackClockMs)}</p>
              <div class="mt-6 flex justify-center gap-2">
                <button class="primary-button" onClick={retrySession}>Retry</button>
                <Show when={nextScenario()}>
                  {(next) => <button class="secondary-button" onClick={() => openPlay(next())}>Next</button>}
                </Show>
                <button class="secondary-button" onClick={() => navigate('library')}>Exit</button>
              </div>
            </section>
          </div>
        )}
      </Show>
    </main>
  );
}

function nextScenario() {
  const current = app.selectedScenario;
  if (current?.source.kind !== 'builtin') return null;
  const source = current.source;
  return builtinScenarios.find(
    (scenario) =>
      scenario.source.kind === 'builtin' &&
      scenario.source.collectionId === source.collectionId &&
      scenario.source.index === source.index + 1,
  ) ?? null;
}

function playerForColor(
  scenario: { whitePlayer?: PlayerPresentation; blackPlayer?: PlayerPresentation },
  color: Color,
) {
  return color === 'white' ? scenario.whitePlayer : scenario.blackPlayer;
}

function PlayerBar(props: { label: string; player?: PlayerPresentation; time: number; active: boolean }) {
  return (
    <div class="flex items-center justify-between rounded-lg bg-neutral-800 px-3 py-2">
      <span class="flex min-w-0 items-center gap-2 font-medium">
        <Show when={props.player?.avatarUrl}>
          <img class="h-8 w-8 rounded-full object-cover" src={props.player?.avatarUrl} alt="" />
        </Show>
        <span class="truncate">
          {props.player?.title ? `${props.player.title} ` : ''}
          {props.player?.username ?? props.label}
          <Show when={props.player?.rating}><small class="ml-1 text-white/50">{props.player?.rating}</small></Show>
        </span>
      </span>
      <span class={`rounded px-3 py-2 text-xl font-semibold tabular-nums ${props.active ? 'bg-amber-300 text-black' : 'bg-black/30'}`}>
        {formatClock(props.time)}
      </span>
    </div>
  );
}
