import { Show } from 'solid-js';
import { useRegisterSW } from 'virtual:pwa-register/solid';

export function PwaUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };
  return (
    <Show when={offlineReady() || needRefresh()}>
      <aside class="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-white/10 bg-neutral-800 p-4 shadow-2xl">
        <p class="text-sm">{needRefresh() ? 'A new version is ready.' : 'The trainer is ready for offline play.'}</p>
        <div class="mt-3 flex gap-2">
          <Show when={needRefresh()}><button class="primary-button" onClick={() => updateServiceWorker(true)}>Reload</button></Show>
          <button class="secondary-button" onClick={close}>Close</button>
        </div>
      </aside>
    </Show>
  );
}
