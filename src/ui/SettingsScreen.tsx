import { Show } from 'solid-js';
import { app, clearEngineDownload, navigate, updatePreferences } from '../app/store';

export function SettingsScreen() {
  return (
    <main class="mx-auto min-h-screen max-w-xl px-4 py-8">
      <header class="mb-8 flex items-center justify-between">
        <h1 class="text-2xl font-bold">Settings</h1>
        <button class="secondary-button" onClick={() => navigate('library')}>Back</button>
      </header>
      <section class="space-y-5 rounded-xl border border-white/10 bg-neutral-800 p-5">
        <Toggle label="Sound effects" checked={app.preferences.sound} set={(sound) => updatePreferences({ sound })} />
        <Toggle label="Show legal move dots" checked={app.preferences.legalMoveDots} set={(legalMoveDots) => updatePreferences({ legalMoveDots })} />
        <Toggle label="Auto-queen promotions" checked={app.preferences.autoQueen} set={(autoQueen) => updatePreferences({ autoQueen })} />
        <p class="text-xs text-white/50">Hold Alt while moving a pawn to the last rank to choose another piece.</p>
        <label class="label">Chess.com username
          <input class="field" value={app.preferences.chesscomUsername} onInput={(event) => updatePreferences({ chesscomUsername: event.currentTarget.value })} />
        </label>
        <label class="label">Lichess username
          <input class="field" value={app.preferences.lichessUsername} onInput={(event) => updatePreferences({ lichessUsername: event.currentTarget.value })} />
        </label>
        <div class="border-t border-white/10 pt-5">
          <button class="secondary-button" disabled={!app.engine.cached} onClick={clearEngineDownload}>Clear downloaded engine</button>
          <Show when={app.engine.cached}><p class="mt-2 text-xs text-white/50">The ~75 MB engine is available offline.</p></Show>
        </div>
      </section>
    </main>
  );
}

function Toggle(props: { label: string; checked: boolean; set: (checked: boolean) => void }) {
  return (
    <label class="flex items-center justify-between gap-4">
      <span>{props.label}</span>
      <input type="checkbox" class="h-5 w-5 accent-amber-400" checked={props.checked} onChange={(event) => props.set(event.currentTarget.checked)} />
    </label>
  );
}
