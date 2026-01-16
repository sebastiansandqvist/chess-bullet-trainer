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
        console.log(`line: ${line}`);
        return line;
      }
    }
  }
};

export async function command(command: string) {
  console.log(`exec: ${command}`);
  proc.stdin.write(`${command}\n`);
}
