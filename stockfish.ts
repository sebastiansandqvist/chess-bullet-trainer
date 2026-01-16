const proc = Bun.spawn(["stockfish"], {
  stdin: "pipe",
  stdout: "pipe",
});

const waitIterator = proc.stdout.pipeThrough(new TextDecoderStream())[Symbol.asyncIterator]();

export async function waitUntil(needle: string) {
  while (true) {
    const { value, done } = await waitIterator.next();
    if (done || value === undefined) return "";
    for (const line of (value).split("\n")) {
      if (line.startsWith(needle)) {
        console.log(`IN  | ${line}`);
        return line;
      }
    }
  }
};

export async function waitBestmoveWithDepth() {
  let maxDepth = 0;
  while (true) {
    const { value, done } = await waitIterator.next();
    if (done || value === undefined) return { line: "", maxDepth };
    for (const line of value.split("\n")) {
      if (line.startsWith("info ")) {
        const match = /(?:^|\s)depth\s+(\d+)/.exec(line);
        if (match) {
          const depth = Number(match[1]);
          if (!Number.isNaN(depth) && depth > maxDepth) maxDepth = depth;
        }
      }
      if (line.startsWith("bestmove")) {
        console.log(`IN  | ${line}`);
        return { line, maxDepth };
      }
    }
  }
}

export function command(command: string) {
  console.log(`OUT | ${command}`);
  proc.stdin.write(`${command}\n`);
}

export function shutdown() {
  proc.kill();
}
