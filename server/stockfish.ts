import { log } from "./log";

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
        log.in(line);
        return line;
      }
    }
  }
};

export async function waitForBestMove() {
  let previousLine = "";
  while (true) {
    const { value, done } = await waitIterator.next();
    if (done || value === undefined) return { line: "", depth: 0, move: "" };
    for (const line of value.split("\n")) {
      if (line.startsWith("bestmove")) {
        log.in(line);
        const match = /(?:^|\s)depth\s+(\d+)/.exec(previousLine);
        const depth = match ? Number(match[1]) : 0;
        log.info(`depth ${depth}`);
        const move = line.split(" ")[1] ?? "";
        return { line, depth, move };
      }
      previousLine = line;
    }
  }
}

export function command(command: string) {
  log.out(command);
  proc.stdin.write(`${command}\n`);
}

export function shutdown() {
  proc.kill();
}
