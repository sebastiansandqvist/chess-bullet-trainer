import { useQuery } from '@tanstack/solid-query';
import { createEffect, createMemo, createSignal, For, Show } from 'solid-js';
import { app, navigate, setApp, updatePreferences } from '../app/store';
import { BoardCanvas } from '../board/BoardCanvas';
import { boardToPieces, turnToColor } from '../domain/chess';
import { MiniBoard } from './MiniBoard';
import type { ImportedGame, ImportedGameDetail, PlayerPresentation } from '../domain/types';
import { fetchChesscomArchive, fetchChesscomArchives, fetchChesscomProfile } from '../imports/chesscom';
import { fetchLichessGamePgn, fetchLichessGames, fetchLichessProfile, parseLichessGameId } from '../imports/lichess';
import { walkPgn } from '../imports/pgn';
import { parseTimeControl } from '../imports/types';
import { Chess } from 'chess.js';

type Provider = 'chesscom' | 'lichess' | 'pgn';

export function ImportScreen() {
  const setupInput = app.setup.input.trim();
  const [provider, setProvider] = createSignal<Provider>(
    /^https?:\/\/(?:www\.)?lichess\.org\//i.test(setupInput) ? 'pgn' : 'chesscom',
  );
  const [chessUsername, setChessUsername] = createSignal(app.preferences.chesscomUsername);
  const [lichessUsername, setLichessUsername] = createSignal(app.preferences.lichessUsername);
  const [submittedChess, setSubmittedChess] = createSignal('');
  const [submittedLichess, setSubmittedLichess] = createSignal('');
  const [archiveIndex, setArchiveIndex] = createSignal(0);
  const [lichessUntil, setLichessUntil] = createSignal<number | undefined>();
  const [lichessCollected, setLichessCollected] = createSignal<ImportedGame[]>([]);
  const [selected, setSelected] = createSignal<ImportedGame | null>(null);
  const [pastedDetail, setPastedDetail] = createSignal<ImportedGameDetail | null>(null);
  const [pgnInput, setPgnInput] = createSignal(setupInput);
  const [resultFilter, setResultFilter] = createSignal('');
  const [timeFilter, setTimeFilter] = createSignal('');
  const [dateFilter, setDateFilter] = createSignal('');
  const [ply, setPly] = createSignal(0);
  const [parseError, setParseError] = createSignal('');
  let lastDetailId = '';

  const archives = useQuery(() => ({
    queryKey: ['chesscom', 'archives', submittedChess()],
    queryFn: () => fetchChesscomArchives(submittedChess()),
    enabled: Boolean(submittedChess()),
    retry: 1,
  }));
  const archiveGames = useQuery(() => ({
    queryKey: ['chesscom', 'archive', archives.data?.[archiveIndex()] ?? ''],
    queryFn: () => fetchChesscomArchive(archives.data?.[archiveIndex()] ?? ''),
    enabled: Boolean(archives.data?.[archiveIndex()]),
    retry: 1,
  }));
  const lichessGames = useQuery(() => ({
    queryKey: ['lichess', 'games', submittedLichess(), lichessUntil() ?? 'latest'],
    queryFn: () => fetchLichessGames(submittedLichess(), 24, lichessUntil()),
    enabled: Boolean(submittedLichess()),
    retry: 1,
  }));
  const detail = useQuery(() => ({
    queryKey: ['import-detail', selected()?.provider, selected()?.id],
    queryFn: async () => {
      const game = selected();
      if (!game) throw new Error('No game selected.');
      const pgn = game.provider === 'lichess' ? await fetchLichessGamePgn(game.id) : game.pgn;
      if (!pgn) throw new Error('This game does not include a PGN.');
      const walked = walkPgn(pgn);
      return {
        ...walked,
        id: game.id,
        provider: game.provider,
        url: game.url,
        white: mergeListedPlayer(walked.white, game.white),
        black: mergeListedPlayer(walked.black, game.black),
      } satisfies ImportedGameDetail;
    },
    enabled: Boolean(selected() && selected()?.provider !== 'pgn'),
    retry: 1,
  }));
  const whiteProfile = useQuery(() => ({
    queryKey: ['profile', selected()?.provider, selected()?.white.username],
    queryFn: () => fetchProfile(selected()!.provider, selected()!.white.username),
    enabled: Boolean(selected() && selected()?.provider !== 'pgn'),
    retry: false,
  }));
  const blackProfile = useQuery(() => ({
    queryKey: ['profile', selected()?.provider, selected()?.black.username],
    queryFn: () => fetchProfile(selected()!.provider, selected()!.black.username),
    enabled: Boolean(selected() && selected()?.provider !== 'pgn'),
    retry: false,
  }));

  createEffect(() => {
    const page = lichessGames.data;
    if (!page) return;
    setLichessCollected((current) => {
      const byId = new Map(current.map((game) => [game.id, game]));
      for (const game of page) byId.set(game.id, game);
      return [...byId.values()].sort((a, b) => (b.playedAt ?? 0) - (a.playedAt ?? 0));
    });
  });
  const games = createMemo(() => provider() === 'chesscom' ? archiveGames.data ?? [] : lichessCollected());
  const filteredGames = createMemo(() => games().filter((game) => {
    if (resultFilter() && !game.result?.includes(resultFilter())) return false;
    if (timeFilter() && !game.timeControl?.toLowerCase().includes(timeFilter().toLowerCase())) return false;
    if (dateFilter() && (game.playedAt ?? 0) < Date.parse(`${dateFilter()}T00:00:00`)) return false;
    return true;
  }));
  const activeDetail = createMemo(() => pastedDetail() ?? detail.data ?? null);
  createEffect(() => {
    const value = activeDetail();
    if (value && value.id !== lastDetailId) {
      lastDetailId = value.id;
      setPly(value.plies.length - 1);
    }
  });
  createEffect(() => {
    const value = detail.data;
    const current = selected();
    if (
      value &&
      current &&
      (current.white.username === 'White' || current.black.username === 'Black')
    ) {
      setSelected({ ...current, white: value.white, black: value.black });
    }
  });
  const activePly = createMemo(() => activeDetail()?.plies[ply()]);
  const canCreate = createMemo(() => {
    const variant = activeDetail()?.variant?.toLowerCase();
    return !variant || variant === 'standard' || variant === 'chess';
  });

  const submitAccount = () => {
    setSelected(null);
    setPastedDetail(null);
    if (provider() === 'chesscom') {
      setArchiveIndex(0);
      setSubmittedChess(chessUsername().trim());
      updatePreferences({ chesscomUsername: chessUsername().trim() });
    } else {
      setLichessCollected([]);
      setLichessUntil(undefined);
      setSubmittedLichess(lichessUsername().trim());
      updatePreferences({ lichessUsername: lichessUsername().trim() });
    }
  };
  const switchProvider = (next: Provider) => {
    setProvider(next);
    setSelected(null);
    setPastedDetail(null);
    setParseError('');
  };
  const importPgn = () => {
    setParseError('');
    try {
      const id = parseLichessGameId(pgnInput());
      if (id) {
        setProvider('lichess');
        setSelected({
          id,
          provider: 'lichess',
          url: `https://lichess.org/${id}`,
          white: { username: 'White' },
          black: { username: 'Black' },
        });
        setPastedDetail(null);
        return;
      }
      const walked = walkPgn(pgnInput());
      setPastedDetail(walked);
      setSelected(walked);
    } catch (error) {
      setPastedDetail(null);
      setParseError(error instanceof Error ? error.message : 'Could not parse PGN.');
    }
  };
  const createScenario = () => {
    const game = activeDetail();
    const position = activePly();
    if (!game || !position || !canCreate()) return;
    const time = parseTimeControl(game.timeControl);
    const positionGame = new Chess(position.fen);
    setApp('setup', {
      name: `${game.white.username} vs ${game.black.username}`,
      context: `Imported ${game.provider} game at ply ${position.index}.`,
      input: '',
      fen: position.fen,
      traineeColor: turnToColor(positionGame.turn()),
      whiteClockSeconds: (position.whiteClockMs ?? time.initialMs ?? 10_000) / 1_000,
      blackClockSeconds: (position.blackClockMs ?? time.initialMs ?? 10_000) / 1_000,
      incrementSeconds: time.incrementMs / 1_000,
      engineMoveSeconds: 1,
      goal: 'win',
      source: { kind: 'import', provider: game.provider, gameId: game.id },
      whitePlayer: mergePlayer(game.white, whiteProfile.data),
      blackPlayer: mergePlayer(game.black, blackProfile.data),
    });
    navigate('setup');
  };

  return (
    <main class="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <header class="mb-6 flex items-center justify-between">
        <div><p class="text-sm text-amber-400">Game import</p><h1 class="text-2xl font-bold">Create from your games</h1></div>
        <button class="secondary-button" onClick={() => navigate('library')}>Back</button>
      </header>
      <div class="mb-5 flex flex-wrap gap-2">
        {(['chesscom', 'lichess', 'pgn'] as const).map((item) => (
          <button class={provider() === item ? 'primary-button' : 'secondary-button'} onClick={() => switchProvider(item)}>
            {item === 'chesscom' ? 'Chess.com' : item === 'lichess' ? 'Lichess' : 'PGN / URL'}
          </button>
        ))}
      </div>

      <Show when={provider() !== 'pgn'} fallback={
        <section class="mb-6 max-w-2xl space-y-3">
          <textarea class="field min-h-40 w-full font-mono text-xs" placeholder="Paste PGN or a Lichess game URL" value={pgnInput()} onInput={(event) => setPgnInput(event.currentTarget.value)} />
          <button class="primary-button" onClick={importPgn}>Open game</button>
          <Show when={parseError()}><p class="text-sm text-red-400">{parseError()}</p></Show>
        </section>
      }>
        <section class="mb-6 flex flex-wrap items-end gap-3">
          <label class="label flex-1">Public username
            <input class="field" value={provider() === 'chesscom' ? chessUsername() : lichessUsername()} onInput={(event) => provider() === 'chesscom' ? setChessUsername(event.currentTarget.value) : setLichessUsername(event.currentTarget.value)} />
          </label>
          <button class="primary-button" onClick={submitAccount}>Load games</button>
          <label class="label">From date<input class="field" type="date" value={dateFilter()} onInput={(event) => setDateFilter(event.currentTarget.value)} /></label>
          <label class="label">Clock<input class="field w-24" placeholder="60+0" value={timeFilter()} onInput={(event) => setTimeFilter(event.currentTarget.value)} /></label>
          <label class="label">Result<input class="field w-28" placeholder="win…" value={resultFilter()} onInput={(event) => setResultFilter(event.currentTarget.value)} /></label>
        </section>
      </Show>

      <Show when={archives.isError || archiveGames.isError || lichessGames.isError}>
        <p class="mb-5 rounded bg-red-950/50 p-3 text-red-300">{String(archives.error ?? archiveGames.error ?? lichessGames.error)}</p>
      </Show>

      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <section>
          <div class="grid gap-3 sm:grid-cols-2">
            <For each={filteredGames()}>
              {(game) => <GameCard game={game} selected={selected()?.id === game.id} onClick={() => { setPastedDetail(null); setSelected(game); }} />}
            </For>
          </div>
          <Show when={provider() === 'chesscom' && archives.data && archiveIndex() + 1 < archives.data.length}>
            <button class="secondary-button mt-4" onClick={() => setArchiveIndex(archiveIndex() + 1)}>Load previous month</button>
          </Show>
          <Show when={provider() === 'lichess' && lichessGames.data?.length}>
            <button class="secondary-button mt-4" onClick={() => setLichessUntil((lichessGames.data?.at(-1)?.playedAt ?? Date.now()) - 1)}>Load older games</button>
          </Show>
        </section>

        <Show when={activeDetail()} fallback={<aside class="rounded-xl border border-white/10 bg-neutral-800 p-5 text-white/50">Select a game to inspect every position.</aside>}>
          {(game) => (
            <aside class="space-y-4 rounded-xl border border-white/10 bg-neutral-800 p-5">
              <PlayerRow player={mergePlayer(game().black, blackProfile.data)} />
              <div class="aspect-square">
                <BoardCanvas view={{ pieces: boardToPieces(new Chess(activePly()?.fen ?? new Chess().fen()).board()), orientation: 'white' }} />
              </div>
              <PlayerRow player={mergePlayer(game().white, whiteProfile.data)} />
              <div class="flex items-center justify-between gap-2">
                <button class="secondary-button" disabled={ply() <= 0} onClick={() => setPly(Math.max(0, ply() - 1))}>Previous</button>
                <span class="text-sm tabular-nums">{ply()} / {game().plies.length - 1}</span>
                <button class="secondary-button" disabled={ply() >= game().plies.length - 1} onClick={() => setPly(Math.min(game().plies.length - 1, ply() + 1))}>Next</button>
              </div>
              <p class="text-center text-sm text-white/60">
                {formatOptionalClock(activePly()?.whiteClockMs)} — {formatOptionalClock(activePly()?.blackClockMs)}
              </p>
              <button class="primary-button w-full" disabled={!canCreate()} onClick={createScenario}>Create scenario here</button>
              <Show when={!canCreate()}><p class="text-sm text-red-400">Only standard chess games can become scenarios.</p></Show>
            </aside>
          )}
        </Show>
      </div>
    </main>
  );
}

function GameCard(props: { game: ImportedGame; selected: boolean; onClick: () => void }) {
  return (
    <button style={{ 'content-visibility': 'auto' }} class={`flex gap-3 rounded-xl border p-3 text-left ${props.selected ? 'border-amber-400 bg-amber-400/10' : 'border-white/10 bg-neutral-800'}`} onClick={props.onClick}>
      <MiniBoard fen={props.game.finalFen ?? new Chess().fen()} size="sm" />
      <span class="min-w-0">
        <strong class="block truncate">{props.game.white.username} vs {props.game.black.username}</strong>
        <span class="mt-1 block text-xs text-white/55">{props.game.timeControl ?? 'Unknown clock'} · {props.game.result ?? 'Unknown result'}</span>
        <span class="mt-1 block text-xs text-white/40">{props.game.playedAt ? new Date(props.game.playedAt).toLocaleDateString() : ''}</span>
      </span>
    </button>
  );
}

function fetchProfile(provider: ImportedGame['provider'], username: string) {
  if (provider === 'chesscom') return fetchChesscomProfile(username);
  if (provider === 'lichess') return fetchLichessProfile(username);
  return Promise.resolve({ username });
}

function mergePlayer(base: PlayerPresentation, rich?: PlayerPresentation) {
  return { ...base, ...rich, rating: base.rating ?? rich?.rating };
}

function mergeListedPlayer(parsed: PlayerPresentation, listed: PlayerPresentation) {
  if (listed.username === 'White' || listed.username === 'Black') return parsed;
  return { ...parsed, ...listed, rating: listed.rating ?? parsed.rating };
}

function PlayerRow(props: { player: PlayerPresentation }) {
  return (
    <div class="flex items-center gap-3">
      <Show when={props.player.avatarUrl}><img class="h-9 w-9 rounded-full object-cover" src={props.player.avatarUrl} alt="" /></Show>
      <div><strong>{props.player.title ? `${props.player.title} ` : ''}{props.player.username}</strong><p class="text-xs text-white/50">{props.player.rating ?? 'Unrated'} {props.player.country ? `· ${props.player.country}` : ''}</p></div>
    </div>
  );
}

function formatOptionalClock(value?: number) {
  if (value === undefined) return '—';
  const seconds = value / 1_000;
  return seconds < 60 ? seconds.toFixed(1) : `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}
