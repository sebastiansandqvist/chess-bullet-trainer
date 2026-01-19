import { command, shutdown, waitForBestMove, waitUntil } from "./stockfish";

/*

client-side:
  - set up starting position, board orientation, player times
  - set time per stockfish move
    - v2: predefined scenarios to click between in sidebar
    - v2: set dressing. player 1 and 2 name/title/image/flag/rating
    - v2: import position. pgn, fen, chess.com game url, lichess url too?
  - show log of move history and the depth stockfish was able to get to for that move in the time above
  - playing your first move starts the timer. it always starts on your turn. you decide what color you are by playing the move.
  - unlimited stack of premoves. each costs 0.1s.

  - https://www.chess.com/game/live/162635823237?username=ginger_gm&move=152
  - https://www.youtube.com/watch?v=YEopyf367ck&t=2667s

strats:
  - always premove unambiguous recaptures
  - time scramble: go for checks, force opponent to flonuder
  - <1s and lots of pieces: consider throwing them away to win on time
  - queen+pawns or similar endgames and up on time: try to take away all opponents' moves then premove the rest - https://www.chess.com/game/live/161597823075?username=hansen&move=152
  - tickle to buy time to think - https://www.chess.com/game/live/161599628179?username=hansen&move=46
  - think on opponent's time
  - hover next moves if there is a likely sequence but not safe to premove
  - endgame examples:
    1. https://www.youtube.com/watch?v=PtBjKCVo2so&t=495s

*/

// ---- boot ----
command("uci");
await waitUntil("uciok");

// ---- move ----
command("position startpos");
command("go movetime 200");

await waitForBestMove();

const replyMove = "b2b3";
command(`position startpos moves ${replyMove}`);
command("go movetime 200");

await waitForBestMove();

// ---- shutdown ----
command("quit");
shutdown();
