import { STOCKFISH_WORKER_PATH } from './assets';

export type EngineState = 'idle' | 'loading' | 'ready' | 'searching' | 'stopping' | 'error';
export type BestMove = { move: string; depth: number; sessionId: string; searchId: number };

export function createStockfishEngine(workerUrl = STOCKFISH_WORKER_PATH) {
  let worker: Worker | null = null;
  let state: EngineState = 'idle';
  let readyResolve: (() => void) | null = null;
  let readyReject: ((error: Error) => void) | null = null;
  let readyPromise: Promise<void> | null = null;
  let pending: { sessionId: string; searchId: number } | null = null;
  let queued: { fen: string; movetimeMs: number; sessionId: string; searchId: number } | null = null;
  let lastDepth = 0;
  const stateListeners = new Set<(state: EngineState, error?: string) => void>();
  const moveListeners = new Set<(move: BestMove) => void>();

  const setState = (next: EngineState, error?: string) => {
    state = next;
    for (const listener of stateListeners) listener(next, error);
  };
  const send = (command: string) => worker?.postMessage(command);

  const handleLine = (line: string) => {
    if (line === 'uciok') {
      send('setoption name Threads value 1');
      send('isready');
      return;
    }
    if (line === 'readyok') {
      setState('ready');
      readyResolve?.();
      readyResolve = null;
      readyReject = null;
      return;
    }
    if (line.startsWith('info ')) {
      const depth = /(?:^|\s)depth\s+(\d+)/.exec(line)?.[1];
      if (depth) lastDepth = Number(depth);
      return;
    }
    if (!line.startsWith('bestmove')) return;
    if (state === 'stopping') {
      const next = queued;
      queued = null;
      pending = null;
      if (next) startSearch(next);
      else setState('ready');
      return;
    }
    const active = pending;
    pending = null;
    setState('ready');
    if (!active) return;
    const rawMove = line.split(/\s+/)[1] ?? '';
    const move = rawMove === '(none)' ? '' : rawMove;
    for (const listener of moveListeners) {
      listener({ move, depth: lastDepth, ...active });
    }
    lastDepth = 0;
  };

  const handleMessage = (event: MessageEvent) => {
    const output = typeof event.data === 'string' ? event.data : String(event.data);
    for (const line of output.split('\n')) handleLine(line.trim());
  };

  const handleError = (event: ErrorEvent) => {
    const error = event.error instanceof Error ? event.error : new Error(event.message);
    pending = null;
    setState('error', error.message);
    readyReject?.(error);
    readyResolve = null;
    readyReject = null;
  };

  function boot() {
    if (state === 'error') dispose();
    if (readyPromise) return readyPromise;
    setState('loading');
    readyPromise = new Promise<void>((resolve, reject) => {
      readyResolve = resolve;
      readyReject = reject;
      try {
        worker = new Worker(workerUrl, { type: 'classic' });
        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);
        send('uci');
      } catch (error) {
        handleError({ error, message: error instanceof Error ? error.message : String(error) } as ErrorEvent);
      }
    });
    return readyPromise;
  }

  function startSearch(args: {
    fen: string;
    movetimeMs: number;
    sessionId: string;
    searchId: number;
  }) {
    pending = { sessionId: args.sessionId, searchId: args.searchId };
    lastDepth = 0;
    send('position fen ' + args.fen);
    send(`go movetime ${Math.max(1, Math.round(args.movetimeMs))}`);
    setState('searching');
  }

  async function search(args: {
    fen: string;
    movetimeMs: number;
    sessionId: string;
    searchId: number;
  }) {
    await boot();
    if (!worker) throw new Error('Stockfish worker is unavailable.');
    if (state === 'searching' || state === 'stopping') {
      queued = args;
      pending = null;
      if (state === 'searching') {
        setState('stopping');
        send('stop');
      }
      return;
    }
    startSearch(args);
  }

  function stop() {
    queued = null;
    if (state !== 'searching') return;
    pending = null;
    setState('stopping');
    send('stop');
  }

  function dispose() {
    pending = null;
    queued = null;
    worker?.removeEventListener('message', handleMessage);
    worker?.removeEventListener('error', handleError);
    worker?.terminate();
    worker = null;
    readyPromise = null;
    setState('idle');
  }

  return {
    boot,
    search,
    stop,
    dispose,
    getState: () => state,
    onState(listener: (state: EngineState, error?: string) => void) {
      stateListeners.add(listener);
      return () => stateListeners.delete(listener);
    },
    onBestMove(listener: (move: BestMove) => void) {
      moveListeners.add(listener);
      return () => moveListeners.delete(listener);
    },
  };
}
