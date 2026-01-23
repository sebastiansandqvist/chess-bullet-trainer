const STOCKFISH_WORKER_URL = '/stockfish/stockfish-17.1-8e4d048.js';

type StockfishConfig = {
  fen: string;
  movetimeMs: number;
};

type StockfishReply = {
  move: string;
  depth: number;
};

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) {
    throw new Error(message);
  }
};

export function createStockfishClient(workerUrl = STOCKFISH_WORKER_URL) {
  const worker = new Worker(workerUrl, { type: 'classic' });
  let config: StockfishConfig | null = null;
  let moveHistory: string[] = [];
  let bestMove: StockfishReply | null = null;
  let lastDepth = 0;
  let armed = false;
  let needsSearch = false;
  let needsNewGame = false;
  let awaitingStop = false;

  const engine = {
    isReady: false,
    isThinking: false,
    hasBestMove: false,
    configure,
    newgame,
    play,
    takeBestMove,
    stop,
  };

  const send = (command: string) => {
    worker.postMessage(command);
  };

  const clearBestMove = () => {
    bestMove = null;
    engine.hasBestMove = false;
  };

  const resetForNewGame = () => {
    moveHistory = [];
    lastDepth = 0;
    clearBestMove();
    needsSearch = false;
    needsNewGame = true;
  };

  const positionCommand = () => {
    assert(config, 'Stockfish not configured. Call configure() first.');
    const moves = moveHistory.join(' ');
    if (moves.length > 0) {
      return `position fen ${config.fen} moves ${moves}`;
    }
    return `position fen ${config.fen}`;
  };

  const maybeStartSearch = () => {
    if (!engine.isReady || !armed || engine.isThinking || awaitingStop || !needsSearch) return;
    assert(config, 'Stockfish not configured. Call configure() first.');
    if (needsNewGame) {
      send('ucinewgame');
      needsNewGame = false;
    }
    send(positionCommand());
    send(`go movetime ${config.movetimeMs}`);
    engine.isThinking = true;
    needsSearch = false;
  };

  const handleLine = (rawLine: string) => {
    const line = rawLine.trim();
    if (!line) return;

    if (line === 'uciok') {
      send('isready');
      return;
    }

    if (line === 'readyok') {
      engine.isReady = true;
      maybeStartSearch();
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
      engine.isThinking = false;

      if (awaitingStop) {
        awaitingStop = false;
        lastDepth = 0;
        maybeStartSearch();
        return;
      }

      const move = line.split(' ')[1] ?? '';
      const normalizedMove = move === '(none)' ? '' : move;
      bestMove = { move: normalizedMove, depth: lastDepth };
      engine.hasBestMove = true;
      lastDepth = 0;

      if (normalizedMove) {
        moveHistory.push(normalizedMove);
      }
    }
  };

  const handleMessage = (event: MessageEvent) => {
    const text = typeof event.data === 'string' ? event.data : String(event.data);
    for (const line of text.split('\n')) {
      handleLine(line);
    }
  };

  const handleError = (event: ErrorEvent) => {
    console.error('[stockfish]', event.error ?? event.message);
  };

  worker.addEventListener('message', handleMessage);
  worker.addEventListener('error', handleError);
  send('uci');

  function configure(nextConfig: StockfishConfig) {
    const fen = nextConfig.fen.trim();
    assert(fen.length > 0, 'Stockfish requires a FEN string.');
    const movetimeMs = Math.max(1, Math.round(nextConfig.movetimeMs));
    config = { fen, movetimeMs };
    armed = false;
    resetForNewGame();
    if (engine.isThinking && !awaitingStop) {
      send('stop');
      awaitingStop = true;
    }
  }

  function newgame() {
    assert(config, 'Stockfish not configured. Call configure() first.');
    resetForNewGame();
    armed = true;

    if (engine.isThinking && !awaitingStop) {
      send('stop');
      awaitingStop = true;
    }
  }

  function play(move: string) {
    assert(config, 'Stockfish not configured. Call configure() first.');
    assert(armed, 'Stockfish not armed. Call newgame() first.');
    if (!move) return;
    if (engine.isThinking && !awaitingStop) return;

    moveHistory.push(move);
    needsSearch = true;
    maybeStartSearch();
  }

  function takeBestMove() {
    if (!engine.hasBestMove || !bestMove) return null;
    const reply = bestMove;
    clearBestMove();
    return reply;
  }

  function stop() {
    armed = false;
    needsSearch = false;
    needsNewGame = false;
    clearBestMove();
    lastDepth = 0;

    if (engine.isThinking && !awaitingStop) {
      send('stop');
      awaitingStop = true;
    }
  }

  return engine;
}
