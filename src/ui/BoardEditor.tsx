import { createSignal, For, Show } from 'solid-js';
import { validateFen } from '../domain/chess';
import { fenPieceUrl, fenPlacementSquares } from '../pieces';

const palette = ['K', 'Q', 'R', 'B', 'N', 'P', 'k', 'q', 'r', 'b', 'n', 'p', ''] as const;

function placementFromSquares(squares: string[]) {
  const ranks: string[] = [];
  for (let row = 0; row < 8; row += 1) {
    let rank = '';
    let empty = 0;
    for (let col = 0; col < 8; col += 1) {
      const piece = squares[row * 8 + col] ?? '';
      if (!piece) empty += 1;
      else {
        if (empty) rank += empty;
        empty = 0;
        rank += piece;
      }
    }
    if (empty) rank += empty;
    ranks.push(rank);
  }
  return ranks.join('/');
}

export function BoardEditor(props: { fen: string; onChange: (fen: string) => void }) {
  const [selected, setSelected] = createSignal<(typeof palette)[number]>('');
  const parts = () => props.fen.split(/\s+/);
  const squares = () => {
    const result = fenPlacementSquares(props.fen);
    return result.length === 64 ? result : Array.from({ length: 64 }, () => '');
  };
  const setPiece = (index: number) => {
    const next = [...squares()];
    next[index] = selected();
    const fenParts = parts();
    props.onChange(
      [
        placementFromSquares(next),
        fenParts[1] ?? 'w',
        fenParts[2] ?? '-',
        fenParts[3] ?? '-',
        fenParts[4] ?? '0',
        fenParts[5] ?? '1',
      ].join(' '),
    );
  };
  const setTurn = (turn: 'w' | 'b') => {
    const next = [...parts()];
    next[1] = turn;
    props.onChange(next.join(' '));
  };
  const setPart = (index: number, value: string) => {
    const next = [...parts()];
    while (next.length < 6) next.push(next.length === 5 ? '1' : '-');
    next[index] = value || (index < 4 ? '-' : index === 4 ? '0' : '1');
    props.onChange(next.join(' '));
  };
  const validation = () => validateFen(props.fen);

  return (
    <div class="space-y-3">
      <div class="flex flex-wrap gap-1">
        <For each={palette}>
          {(piece) => (
            <button
              type="button"
              class={`grid h-9 w-9 place-items-center rounded ${selected() === piece ? 'bg-amber-400 text-black' : 'bg-white/10'}`}
              title={piece ? `Place ${piece}` : 'Erase'}
              onClick={() => setSelected(piece)}
            >
              <Show when={fenPieceUrl(piece)} fallback={<span class="text-sm">⌫</span>}>
                {(src) => <img src={src()} alt="" class="h-7 w-7 object-contain" draggable={false} />}
              </Show>
            </button>
          )}
        </For>
      </div>
      <div class="grid aspect-square max-w-md grid-cols-8 grid-rows-8 overflow-hidden rounded-md">
        <For each={squares()}>
          {(piece, index) => (
            <button
              type="button"
              class={`min-h-0 min-w-0 ${(Math.floor(index() / 8) + index()) % 2 ? 'bg-[#769656]' : 'bg-[#eeeed2]'}`}
              onClick={() => setPiece(index())}
            >
              <Show when={fenPieceUrl(piece)}>
                {(src) => (
                  <img
                    src={src()}
                    alt=""
                    draggable={false}
                    class="box-border h-full w-full object-contain p-[6%]"
                  />
                )}
              </Show>
            </button>
          )}
        </For>
      </div>
      <div class="flex gap-2">
        <button type="button" class={parts()[1] === 'w' ? 'primary-button' : 'secondary-button'} onClick={() => setTurn('w')}>White to move</button>
        <button type="button" class={parts()[1] === 'b' ? 'primary-button' : 'secondary-button'} onClick={() => setTurn('b')}>Black to move</button>
      </div>
      <details>
        <summary class="cursor-pointer text-sm text-white/60">Advanced FEN</summary>
        <div class="mt-2 grid grid-cols-2 gap-2">
          <label class="label">Castling<input class="field" value={parts()[2] ?? '-'} onInput={(event) => setPart(2, event.currentTarget.value)} /></label>
          <label class="label">En passant<input class="field" value={parts()[3] ?? '-'} onInput={(event) => setPart(3, event.currentTarget.value)} /></label>
          <label class="label">Halfmove<input class="field" type="number" min="0" value={parts()[4] ?? '0'} onInput={(event) => setPart(4, event.currentTarget.value)} /></label>
          <label class="label">Fullmove<input class="field" type="number" min="1" value={parts()[5] ?? '1'} onInput={(event) => setPart(5, event.currentTarget.value)} /></label>
        </div>
        <input class="field mt-2 w-full font-mono text-xs" value={props.fen} onInput={(event) => props.onChange(event.currentTarget.value)} />
      </details>
      <p class={`text-sm ${validation().valid ? 'text-emerald-400' : 'text-red-400'}`}>
        {validation().valid ? 'Position is valid.' : validation().error}
      </p>
    </div>
  );
}
