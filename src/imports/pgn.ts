import { Chess } from 'chess.js';
import type { ImportedGameDetail, ImportedPly, PlayerPresentation } from '../domain/types';
import { parseTimeControl } from './types';

function headersFromPgn(pgn: string) {
  const headers: Record<string, string> = {};
  for (const match of pgn.matchAll(/^\s*\[([A-Za-z0-9_]+)\s+"([^"]*)"\]\s*$/gm)) {
    if (match[1]) headers[match[1]] = match[2] ?? '';
  }
  return headers;
}

function removeVariations(value: string) {
  let depth = 0;
  let comment = false;
  let result = '';
  for (const char of value) {
    if (char === '{') comment = true;
    if (!comment && char === '(') {
      depth += 1;
      continue;
    }
    if (!comment && char === ')') {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth === 0) result += char;
    if (char === '}') comment = false;
  }
  return result;
}

function parseClock(comment: string) {
  const value = /\[%clk\s+(\d+):(\d{1,2}):(\d{1,2}(?:\.\d+)?)\]/i.exec(comment);
  if (!value) return undefined;
  return (Number(value[1]) * 3_600 + Number(value[2]) * 60 + Number(value[3])) * 1_000;
}

function presentation(headers: Record<string, string>, color: 'White' | 'Black'): PlayerPresentation {
  const rating = Number(headers[`${color}Elo`]);
  return {
    username: headers[color] || color,
    rating: Number.isFinite(rating) && rating > 0 ? rating : undefined,
    title: headers[`${color}Title`] || undefined,
  };
}

export function walkPgn(pgn: string): ImportedGameDetail {
  const headers = headersFromPgn(pgn);
  const initialFen = headers['FEN'] || new Chess().fen();
  const game = new Chess(initialFen);
  const control = parseTimeControl(headers['TimeControl']);
  const plies: ImportedPly[] = [
    {
      index: 0,
      fen: game.fen(),
      whiteClockMs: control.initialMs,
      blackClockMs: control.initialMs,
    },
  ];
  const body = removeVariations(pgn.replace(/^\s*\[[^\n]*\]\s*$/gm, ' '));
  const tokens = body.match(/\{[^}]*\}|[^\s]+/g) ?? [];

  for (const raw of tokens) {
    if (raw.startsWith('{')) {
      const clock = parseClock(raw);
      const current = plies.at(-1);
      if (clock === undefined || !current || current.index === 0) continue;
      const movedWhite = game.turn() === 'b';
      if (movedWhite) current.whiteClockMs = clock;
      else current.blackClockMs = clock;
      continue;
    }
    let token = raw.replace(/^\d+\.(?:\.\.)?/, '').replace(/\$\d+/g, '');
    token = token.replace(/[!?]+$/g, '');
    if (!token || /^\d+\.+$/.test(token) || /^(1-0|0-1|1\/2-1\/2|\*)$/.test(token)) continue;
    try {
      const move = game.move(token);
      const previous = plies.at(-1);
      plies.push({
        index: plies.length,
        fen: game.fen(),
        san: move.san,
        whiteClockMs: previous?.whiteClockMs,
        blackClockMs: previous?.blackClockMs,
      });
    } catch {
      throw new Error(`Could not parse PGN move "${token}".`);
    }
  }

  return {
    id: headers['Site'] || `pgn-${crypto.randomUUID()}`,
    provider: 'pgn',
    url: /^https?:\/\//.test(headers['Site'] ?? '') ? headers['Site'] : undefined,
    pgn,
    initialFen,
    finalFen: game.fen(),
    timeControl: headers['TimeControl'],
    variant: headers['Variant'] || 'Standard',
    result: headers['Result'],
    playedAt: headers['UTCDate']
      ? Date.parse(`${headers['UTCDate'].replace(/\./g, '-')}T${headers['UTCTime'] || '00:00:00'}Z`)
      : undefined,
    white: presentation(headers, 'White'),
    black: presentation(headers, 'Black'),
    plies,
  };
}
