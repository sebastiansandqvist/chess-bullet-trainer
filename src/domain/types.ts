export type Color = 'white' | 'black';
export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export type PromotionPiece = 'q' | 'r' | 'b' | 'n';
export type ScenarioGoal = 'win' | 'draw' | 'avoid_loss' | 'checkmate' | 'flag_opponent';
export type ChessResult = 'white' | 'black' | 'draw';
export type EndingReason =
  | 'checkmate'
  | 'stalemate'
  | 'repetition'
  | 'fifty_move'
  | 'insufficient_material'
  | 'timeout'
  | 'resignation'
  | 'engine_error';

export type PlayerPresentation = {
  username: string;
  rating?: number;
  title?: string;
  country?: string;
  avatarUrl?: string;
};

export type ScenarioSource =
  | { kind: 'builtin'; collectionId: string; index: number }
  | { kind: 'custom' }
  | { kind: 'import'; provider: 'chesscom' | 'lichess' | 'pgn'; gameId?: string };

export type Scenario = {
  id: string;
  name: string;
  source: ScenarioSource;
  initialFen: string;
  traineeColor: Color;
  orientation: Color;
  whiteClockMs: number;
  blackClockMs: number;
  incrementMs: number;
  engineMoveTimeMs: number;
  goal: ScenarioGoal;
  context?: string;
  whitePlayer?: PlayerPresentation;
  blackPlayer?: PlayerPresentation;
};

export type Collection = {
  id: string;
  name: string;
  description: string;
  scenarioIds: string[];
};

export type UciMove = {
  from: string;
  to: string;
  promotion?: PromotionPiece;
};

export type Premove = UciMove & { id: string };

export type MoveRecord = {
  uci: string;
  san: string;
  color: Color;
  playedAt: number;
  elapsedMs: number;
  whiteClockMs: number;
  blackClockMs: number;
  premoved: boolean;
  capture: boolean;
  promotion: boolean;
};

export type SessionResult = {
  success: boolean;
  chessResult: ChessResult;
  endingReason: EndingReason;
  winner: Color | null;
  whiteClockMs: number;
  blackClockMs: number;
};

export type AttemptRecord = SessionResult & {
  scenarioId: string;
  attemptedAt: string;
};

export type Preferences = {
  sound: boolean;
  legalMoveDots: boolean;
  autoQueen: boolean;
  chesscomUsername: string;
  lichessUsername: string;
  lastSetup: {
    traineeColor: Color;
    whiteClockMs: number;
    blackClockMs: number;
    incrementMs: number;
    engineMoveTimeMs: number;
    goal: ScenarioGoal;
  };
};

export type ImportedGame = {
  id: string;
  provider: 'chesscom' | 'lichess' | 'pgn';
  url?: string;
  pgn?: string;
  finalFen?: string;
  initialFen?: string;
  playedAt?: number;
  timeControl?: string;
  variant?: string;
  result?: string;
  white: PlayerPresentation;
  black: PlayerPresentation;
};

export type ImportedPly = {
  index: number;
  fen: string;
  san?: string;
  whiteClockMs?: number;
  blackClockMs?: number;
};

export type ImportedGameDetail = ImportedGame & {
  pgn: string;
  plies: ImportedPly[];
};

export type RenderPiece = {
  square: string;
  rank: number;
  file: number;
  type: PieceType;
  color: Color;
};
