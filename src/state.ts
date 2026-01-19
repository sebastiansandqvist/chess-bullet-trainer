export type PieceType =
  | "pawn"
  | "rook"
  | "knight"
  | "bishop"
  | "queen"
  | "king";
export type PieceColor = "white" | "black";

const pieces: {
  rank: number;
  file: number;
  type: PieceType;
  color: PieceColor;
}[] = [
  // White back rank (rank 1)
  { rank: 1, file: 1, type: "rook", color: "white" },
  { rank: 1, file: 2, type: "knight", color: "white" },
  { rank: 1, file: 3, type: "bishop", color: "white" },
  { rank: 1, file: 4, type: "queen", color: "white" },
  { rank: 1, file: 5, type: "king", color: "white" },
  { rank: 1, file: 6, type: "bishop", color: "white" },
  { rank: 1, file: 7, type: "knight", color: "white" },
  { rank: 1, file: 8, type: "rook", color: "white" },

  // White pawns (rank 2)
  { rank: 2, file: 1, type: "pawn", color: "white" },
  { rank: 2, file: 2, type: "pawn", color: "white" },
  { rank: 2, file: 3, type: "pawn", color: "white" },
  { rank: 2, file: 4, type: "pawn", color: "white" },
  { rank: 2, file: 5, type: "pawn", color: "white" },
  { rank: 2, file: 6, type: "pawn", color: "white" },
  { rank: 2, file: 7, type: "pawn", color: "white" },
  { rank: 2, file: 8, type: "pawn", color: "white" },

  // Black pawns (rank 7)
  { rank: 7, file: 1, type: "pawn", color: "black" },
  { rank: 7, file: 2, type: "pawn", color: "black" },
  { rank: 7, file: 3, type: "pawn", color: "black" },
  { rank: 7, file: 4, type: "pawn", color: "black" },
  { rank: 7, file: 5, type: "pawn", color: "black" },
  { rank: 7, file: 6, type: "pawn", color: "black" },
  { rank: 7, file: 7, type: "pawn", color: "black" },
  { rank: 7, file: 8, type: "pawn", color: "black" },

  // Black back rank (rank 8)
  { rank: 8, file: 1, type: "rook", color: "black" },
  { rank: 8, file: 2, type: "knight", color: "black" },
  { rank: 8, file: 3, type: "bishop", color: "black" },
  { rank: 8, file: 4, type: "queen", color: "black" },
  { rank: 8, file: 5, type: "king", color: "black" },
  { rank: 8, file: 6, type: "bishop", color: "black" },
  { rank: 8, file: 7, type: "knight", color: "black" },
  { rank: 8, file: 8, type: "rook", color: "black" },
];

export const state = {
  pieces,
  dragging: false as false | number, // index of dragged piece in the pieces[]
  mouse: {
    x: 0,
    y: 0,
    boardX: 0,
    boardY: 0,
    isDown: false,
    justPressed: false,
    justReleased: false,
  },
};

document.body.addEventListener("pointerdown", (e) => {
  console.log("pointerdown");
  state.mouse.x = e.clientX;
  state.mouse.y = e.clientY;
  state.mouse.isDown = true;
  state.mouse.justPressed = true;
});

window.addEventListener("pointerup", (e) => {
  state.mouse.x = e.clientX;
  state.mouse.y = e.clientY;
  state.mouse.isDown = false;
  state.mouse.justReleased = true;
});

window.addEventListener("pointermove", (e) => {
  state.mouse.x = e.clientX;
  state.mouse.y = e.clientY;
});

export function cleanupInputs() {
  state.mouse.justPressed = false;
  state.mouse.justReleased = false;
}
