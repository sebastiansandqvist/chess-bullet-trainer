import type { ImportedGame, PlayerPresentation } from '../domain/types';
import { onlineError } from './types';

const api = 'https://api.chess.com/pub';

async function request<T>(path: string): Promise<T> {
  try {
    const response = await fetch(`${api}${path}`);
    if (!response.ok) {
      if (response.status === 404) throw new Error('Chess.com user was not found or is private.');
      if (response.status === 429) throw new Error('Chess.com rate limit reached. Try again shortly.');
      throw new Error(`Chess.com request failed (${response.status}).`);
    }
    return response.json() as Promise<T>;
  } catch (error) {
    throw onlineError(error);
  }
}

type ChessComPlayer = {
  username: string;
  rating?: number;
  result?: string;
};

type ChessComGame = {
  url: string;
  pgn: string;
  fen: string;
  end_time?: number;
  time_control?: string;
  rules?: string;
  white: ChessComPlayer;
  black: ChessComPlayer;
};

export async function fetchChesscomArchives(username: string) {
  const data = await request<{ archives: string[] }>(`/player/${encodeURIComponent(username)}/games/archives`);
  return [...data.archives].reverse();
}

export async function fetchChesscomArchive(url: string): Promise<ImportedGame[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Chess.com archive failed (${response.status}).`);
    const data = (await response.json()) as { games: ChessComGame[] };
    return data.games
      .map((game) => ({
        id: game.url.split('/').filter(Boolean).at(-1) ?? game.url,
        provider: 'chesscom' as const,
        url: game.url,
        pgn: game.pgn,
        finalFen: game.fen,
        playedAt: game.end_time ? game.end_time * 1_000 : undefined,
        timeControl: game.time_control,
        variant: game.rules,
        result: `${game.white.result ?? ''}-${game.black.result ?? ''}`,
        white: { username: game.white.username, rating: game.white.rating },
        black: { username: game.black.username, rating: game.black.rating },
      }))
      .sort((a, b) => (b.playedAt ?? 0) - (a.playedAt ?? 0));
  } catch (error) {
    throw onlineError(error);
  }
}

export async function fetchChesscomProfile(username: string): Promise<PlayerPresentation> {
  const profile = await request<{
    username: string;
    title?: string;
    avatar?: string;
    country?: string;
  }>(`/player/${encodeURIComponent(username)}`);
  return {
    username: profile.username,
    title: profile.title,
    avatarUrl: profile.avatar,
    country: profile.country?.split('/').at(-1),
  };
}
