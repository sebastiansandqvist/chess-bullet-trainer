import { For, Show } from 'solid-js';
import { fenPieceUrl, fenPlacementSquares } from '../pieces';

const sizes = {
  sm: 'h-20 w-20',
  md: 'h-28 w-28',
} as const;

export function MiniBoard(props: { fen: string; size?: keyof typeof sizes; class?: string }) {
  const squares = () => fenPlacementSquares(props.fen);
  return (
    <div
      class={`grid shrink-0 grow-0 grid-cols-8 grid-rows-8 self-start overflow-hidden rounded [grid-template-rows:repeat(8,minmax(0,1fr))] ${sizes[props.size ?? 'md']} ${props.class ?? ''}`}
      aria-hidden="true"
    >
      <For each={squares()}>
        {(letter, index) => (
          <div
            class={`flex items-center justify-center overflow-hidden ${(Math.floor(index() / 8) + index()) % 2 ? 'bg-[#769656]' : 'bg-[#eeeed2]'}`}
          >
            <Show when={fenPieceUrl(letter)}>
              {(src) => (
                <img
                  src={src()}
                  alt=""
                  width={45}
                  height={45}
                  draggable={false}
                  class="max-h-[88%] max-w-[88%] object-contain"
                />
              )}
            </Show>
          </div>
        )}
      </For>
    </div>
  );
}
