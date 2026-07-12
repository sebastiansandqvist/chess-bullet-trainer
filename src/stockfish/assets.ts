export const STOCKFISH_VERSION = '17.1-8e4d048';
export const STOCKFISH_CACHE = `stockfish-${STOCKFISH_VERSION}`;
export const STOCKFISH_WORKER_PATH = `/stockfish/stockfish-${STOCKFISH_VERSION}.js`;
export const STOCKFISH_ASSET_PATHS = [
  STOCKFISH_WORKER_PATH,
  ...Array.from(
    { length: 6 },
    (_, index) => `/stockfish/stockfish-${STOCKFISH_VERSION}-part-${index}.wasm`,
  ),
];

export type EngineDownloadProgress = {
  loaded: number;
  total: number | null;
  filesComplete: number;
  filesTotal: number;
};

export async function isStockfishCached() {
  if (!('caches' in globalThis)) return false;
  const cache = await caches.open(STOCKFISH_CACHE);
  const matches = await Promise.all(STOCKFISH_ASSET_PATHS.map((path) => cache.match(path)));
  return matches.every(Boolean);
}

async function streamResponse(response: Response, onChunk: (bytes: number) => void) {
  if (!response.body) {
    const buffer = await response.arrayBuffer();
    onChunk(buffer.byteLength);
    return new Response(buffer, { status: response.status, statusText: response.statusText, headers: response.headers });
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    onChunk(value.byteLength);
  }
  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Response(bytes, { status: response.status, statusText: response.statusText, headers: response.headers });
}

export async function downloadStockfishAssets(
  onProgress: (progress: EngineDownloadProgress) => void,
  signal?: AbortSignal,
) {
  if (!('caches' in globalThis)) throw new Error('This browser cannot store the engine offline.');
  await caches.delete(STOCKFISH_CACHE);
  const cache = await caches.open(STOCKFISH_CACHE);
  const responses = await Promise.all(
    STOCKFISH_ASSET_PATHS.map(async (path) => {
      const response = await fetch(path, { signal, cache: 'no-store' });
      if (!response.ok) throw new Error(`Engine download failed (${response.status}).`);
      return response;
    }),
  );
  const lengths = responses.map((response) => {
    const value = response.headers.get('content-length');
    return value ? Number(value) : null;
  });
  const total = lengths.every((value): value is number => value !== null)
    ? lengths.reduce((sum, value) => sum + value, 0)
    : null;
  let loaded = 0;
  let filesComplete = 0;
  for (let index = 0; index < STOCKFISH_ASSET_PATHS.length; index += 1) {
    const path = STOCKFISH_ASSET_PATHS[index];
    const source = responses[index];
    if (!path || !source) continue;
    const response = await streamResponse(
      source,
      (bytes) => {
        loaded += bytes;
        onProgress({
          loaded,
          total,
          filesComplete,
          filesTotal: STOCKFISH_ASSET_PATHS.length,
        });
      },
    );
    await cache.put(path, response);
    filesComplete += 1;
    onProgress({
      loaded,
      total,
      filesComplete,
      filesTotal: STOCKFISH_ASSET_PATHS.length,
    });
  }
}

export async function clearStockfishCache() {
  if ('caches' in globalThis) await caches.delete(STOCKFISH_CACHE);
}
