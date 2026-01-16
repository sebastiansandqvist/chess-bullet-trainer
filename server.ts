/*

client-side:
  - set up starting position, board orientation, player times
  - set time per stockfish move
    - v2: predefined scenarios to click between in sidebar
    - v2: set dressing. player 1 and 2 name/title/image/flag/rating
  - show log of move history and the depth stockfish was able to get to for that move in the time above
  - playing your first move starts the timer. it always starts on your turn. you decide what color you are by playing the move.
  - unlimited stack of premoves. each costs 0.1s.
*/

const proc = Bun.spawn(["stockfish"], {
  stdin: "pipe",
  stdout: "pipe",
});

const waitIterator = proc.stdout.pipeThrough(new TextDecoderStream())[Symbol.asyncIterator]();

const waitUntil = async (needle: string) => {
  while (true) {
    const { value, done } = await waitIterator.next();
    if (done || value === undefined) return "";
    for (const line of (value).split("\n")) {
      if (line.startsWith(needle)) {
        console.log(line);
        return line;
      }
    }
  }
};

// ---- boot ----
proc.stdin.write("uci\n");

await waitUntil("uciok");

// configure
proc.stdin.write("setoption name Hash value 256\n");
// these are all defaults in v17.1
// proc.stdin.write("setoption name Ponder value false\n");
// proc.stdin.write("setoption name Threads value 1\n");
// proc.stdin.write("setoption name UCI_LimitStrength value false\n");

// ---- move ----
proc.stdin.write("position startpos\n");
proc.stdin.write("go movetime 200\n");

await waitUntil("bestmove");

const replyMove = "e2e4";
console.log(replyMove);
proc.stdin.write(`position startpos moves ${replyMove}\n`);
proc.stdin.write("go movetime 200\n");

await waitUntil("bestmove");

// ---- shutdown ----
proc.stdin.write("quit\n");
proc.kill()
