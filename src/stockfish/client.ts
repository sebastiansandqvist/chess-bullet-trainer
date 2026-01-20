const STOCKFISH_WORKER_URL = '/stockfish/stockfish-17.1-8e4d048.js';

export type StockfishReply = {
  move: string;
  depth: number;
};

type PendingRequest = {
  resolve: (reply: StockfishReply) => void;
  reject: (error: Error) => void;
};

export const createStockfishClient = (workerUrl: string = STOCKFISH_WORKER_URL) => {
  const worker = new Worker(workerUrl, { type: 'classic' });
  let readyResolve: (() => void) | undefined;
  let readyReject: ((error: Error) => void) | undefined;
  const ready = new Promise<void>((resolve, reject) => {
    readyResolve = resolve;
    readyReject = reject;
  });
  let moveHistory: string[] = [];
  let pending: PendingRequest | null = null;
  let lastDepth = 0;
  let queue: Promise<unknown> = Promise.resolve();

  const send = (command: string) => {
    worker.postMessage(command);
  };

  const handleMessage = (event: MessageEvent) => {
    const line = typeof event.data === 'string' ? event.data : String(event.data);

    if (line === 'uciok') {
      send('isready');
      return;
    }

    if (line === 'readyok') {
      readyResolve?.();
      readyResolve = undefined;
      readyReject = undefined;
      return;
    }

    if (line.startsWith('info ')) {
      const match = /(?:^|\s)depth\s+(\d+)/.exec(line);
      if (match) {
        lastDepth = Number(match[1]);
      }
      return;
    }

    if (line.startsWith('bestmove')) {
      const move = line.split(' ')[1] ?? '';
      const reply = { move, depth: lastDepth };
      lastDepth = 0;
      pending?.resolve(reply);
      pending = null;
    }
  };

  const handleError = (event: ErrorEvent) => {
    const error = event.error instanceof Error ? event.error : new Error(event.message);
    if (pending) {
      pending.reject(error);
      pending = null;
      return;
    }
    readyReject?.(error);
    readyResolve = undefined;
    readyReject = undefined;
  };

  worker.addEventListener('message', handleMessage);
  worker.addEventListener('error', handleError);
  send('uci');

  const enqueue = <T>(task: () => Promise<T>) => {
    const next = queue.then(task);
    queue = next.then(() => undefined);
    return next;
  };

  const sendMove = async (move: string, movetimeMs: number = 200): Promise<StockfishReply> => {
    console.log('send', move);
    return enqueue(async () => {
      await ready;
      lastDepth = 0;
      moveHistory = [...moveHistory, move];

      send(`position startpos moves ${moveHistory.join(' ')}`);
      send(`go movetime ${movetimeMs}`);

      return new Promise<StockfishReply>((resolve, reject) => {
        pending = {
          resolve: (reply) => {
            if (reply.move) {
              moveHistory = [...moveHistory, reply.move];
            }
            resolve(reply);
          },
          reject,
        };
      });
    });
  };

  const dispose = () => {
    worker.removeEventListener('message', handleMessage);
    worker.removeEventListener('error', handleError);
    worker.terminate();
  };

  return {
    sendMove,
    dispose,
  };
};
