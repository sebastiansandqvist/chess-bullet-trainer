# Chess Bullet Trainer

A client-only scenario trainer for practicing low-time conversion, defense, premoves, and flagging against Stockfish. It is built with SolidJS, TypeScript, Vite, Tailwind CSS, chess.js, TanStack Solid Query, and Bun.

## Development

```sh
bun install
bun run dev
bun run typecheck
bun run build
```

Pure domain tests are available through `bun test`. The production output is a static app in `dist/`.

## Product flow

- Choose any scenario from an ordered built-in collection or a locally saved custom scenario.
- Create a position from FEN, PGN, a visual editor, a Lichess game URL, or recent Chess.com/Lichess account games.
- Configure trainee color, clocks, increment, Stockfish move time, and a typed goal.
- Play with real elapsed-time clocks and up to five Chess.com-style premoves at a 100 ms cost each.
- Retry, advance to the next curated scenario, or return to the library after the result.

Preferences, custom scenarios, and bounded per-scenario attempt history stay in versioned browser storage.

## Architecture

- `src/domain/` contains chess adapters, monotonic clocks, premoves, outcome evaluation, the session state machine, and persistence boundaries.
- `src/board/` separates orientation-aware geometry, input intents, canvas rendering, and the Solid canvas component.
- `src/stockfish/` owns consent-gated asset storage and the generation-aware UCI worker lifecycle.
- `src/imports/` contains provider adapters and deterministic PGN/clock parsing.
- `src/app/store.ts` coordinates UI state and side effects; `src/ui/` contains screen components.
- `src/content/` contains stable, ordered built-in curriculum data.

## Stockfish download

Stockfish is not fetched when the app loads. The first scenario asks the user to download approximately 75 MB: one versioned worker and six WASM parts. Progress is streamed into Cache Storage, and the engine is only constructed after consent. Settings can remove the cached engine.

The service worker excludes Stockfish from precaching. Its runtime cache route is only exercised after the user starts the explicit download or engine boot. A version change uses a new cache name and therefore requires a fresh download.

## Imports

- Chess.com uses the public player archive list and monthly archive endpoints. Recent months are fetched on demand; each archive already supplies PGN and ending FEN.
- Lichess uses the bounded user-games NDJSON endpoint with `lastFen`, then fetches full PGN and clocks only for a selected game. Public game URLs are supported.
- Rich profiles are requested only for the two players in the selected game.
- Imports are network-only. Provider limits, private/deleted users, missing clocks, and unavailable games produce user-facing errors.
- Only standard chess positions can become scenarios. Missing clocks fall back to the game time control and then to a small setup default.

## PWA and deployment

The app shell, built-in content, custom scenarios, and previously downloaded engine work offline. Provider imports do not.

Threaded Stockfish requires a secure context and cross-origin isolation. The development and preview servers already send:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Configure the same headers on every production response, including the HTML, service worker, worker JavaScript, and WASM files. For example, a static host should apply:

```text
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

Deploy `dist/` as a single-page application with unknown navigation routes falling back to `index.html`. Do not add the Stockfish directory to a separate eager CDN/precache rule.

## Curriculum notes

The original prototype’s useful training ideas are preserved here for future scenario curation:

- Premove unambiguous recaptures and think on the opponent’s time.
- In severe time trouble, use checks and forcing moves; hover likely continuations that are unsafe to premove.
- When materially ahead but nearly flagged, simplify the opponent’s choices and consider returning material to create safe premoves.
- Practice “tickle” moves that buy thinking time, fortress construction, reset mates, and one-move-at-a-time drawing defenses.
- Build dedicated endgame scenarios for removing all counterplay before premoving a conversion.

The shipped collection is intentionally small; expanding and validating the curriculum is separate content work.
