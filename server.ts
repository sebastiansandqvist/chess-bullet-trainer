import { command, shutdown, waitForBestMove, waitUntil } from "./stockfish";

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

// ---- boot ----
command("uci");

await waitUntil("uciok");

// configure
command("setoption name Hash value 256");
// these are all defaults in v17.1
// command("setoption name Ponder value false");
// command("setoption name Threads value 1");
// command("setoption name UCI_LimitStrength value false");

// ---- move ----
command("position startpos");
command("go movetime 200");

{
  const { depth } = await waitForBestMove();
}

const replyMove = "b2b3";
command(`position startpos moves ${replyMove}`);
command("go movetime 200");

{
  const { depth } = await waitForBestMove();
}

// ---- shutdown ----
command("quit");
shutdown();
