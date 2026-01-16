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
        console.log(`IN    | ${line}`);
        return line;
      }
    }
  }
};

export async function waitForBestMove() {
  let previousLine = "";
  while (true) {
    const { value, done } = await waitIterator.next();
    if (done || value === undefined) return { line: "", depth: 0 };
    for (const line of value.split("\n")) {
      if (line.startsWith("bestmove")) {
        console.log(`IN    | ${line}`);
        const match = /(?:^|\s)depth\s+(\d+)/.exec(previousLine);
        const depth = match ? Number(match[1]) : 0;
        console.log(`DEPTH | ${depth}`);
        return { line, depth };
      }
      previousLine = line;
    }
  }
}

export function command(command: string) {
  console.log(`OUT   | ${command}`);
  proc.stdin.write(`${command}\n`);
}

export function shutdown() {
  proc.kill();
}
