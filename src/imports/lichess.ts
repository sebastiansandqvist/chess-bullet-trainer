import type { ImportedGame, PlayerPresentation } from '../domain/types';
import { onlineError } from './types';

const api = 'https://lichess.org/api';

export function parseLichessGameId(value: string) {
  const match = /lichess\.org\/(?:game\/export\/)?([a-zA-Z0-9]{8,12})/.exec(value);
  return match?.[1]?.slice(0, 8) ?? null;
}

function player(value: {
  user?: { name?: string; title?: string };
  rating?: number;
} | undefined, fallback: string): PlayerPresentation {
  return {
    username: value?.user?.name ?? fallback,
    title: value?.user?.title,
    rating: value?.rating,
  };
}

function mapGame(game: {
  id: string;
  createdAt?: number;
  lastFen?: string;
  variant?: string;
  speed?: string;
  clock?: { initial?: number; increment?: number };
  winner?: 'white' | 'black';
  status?: string;
  players?: {
    white?: { user?: { name?: string; title?: string }; rating?: number };
    black?: { user?: { name?: string; title?: string }; rating?: number };
  };
}): ImportedGame {
  return {
    id: game.id,
    provider: 'lichess',
    url: `https://lichess.org/${game.id}`,
    finalFen: game.lastFen,
    playedAt: game.createdAt,
    timeControl: game.clock
      ? `${game.clock.initial ?? 0}+${game.clock.increment ?? 0}`
      : game.speed,
    variant: game.variant,
    result: game.winner ?? game.status,
    white: player(game.players?.white, 'White'),
    black: player(game.players?.black, 'Black'),
  };
}

export async function fetchLichessGames(username: string, max = 20, until?: number) {
  const params = new URLSearchParams({
    max: String(max),
    lastFen: 'true',
    moves: 'false',
    clocks: 'false',
    evals: 'false',
    opening: 'false',
  });
  if (until) params.set('until', String(until));
  try {
    const response = await fetch(`${api}/games/user/${encodeURIComponent(username)}?${params}`, {
      headers: { Accept: 'application/x-ndjson' },
    });
    if (!response.ok) {
      if (response.status === 404) throw new Error('Lichess user was not found.');
      if (response.status === 429) throw new Error('Lichess rate limit reached. Try again shortly.');
      throw new Error(`Lichess request failed (${response.status}).`);
    }
    const text = await response.text();
    return text
      .split('\n')
      .filter(Boolean)
      .map((line) => mapGame(JSON.parse(line) as Parameters<typeof mapGame>[0]));
  } catch (error) {
    throw onlineError(error);
  }
}

export async function fetchLichessGamePgn(gameId: string) {
  try {
    const response = await fetch(`${api}/game/export/${encodeURIComponent(gameId)}?clocks=true&evals=false&literate=false`, {
      headers: { Accept: 'application/x-chess-pgn' },
    });
    if (!response.ok) throw new Error(`Lichess game request failed (${response.status}).`);
    return response.text();
  } catch (error) {
    throw onlineError(error);
  }
}

export async function fetchLichessProfile(username: string): Promise<PlayerPresentation> {
  try {
    const response = await fetch(`${api}/user/${encodeURIComponent(username)}`);
    if (!response.ok) throw new Error(`Lichess profile request failed (${response.status}).`);
    const user = (await response.json()) as {
      username: string;
      title?: string;
      profile?: { flag?: string };
    };
    return { username: user.username, title: user.title, country: user.profile?.flag };
  } catch (error) {
    throw onlineError(error);
  }
}
