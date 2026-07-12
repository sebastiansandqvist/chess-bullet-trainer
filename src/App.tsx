import { Match, onMount, Switch } from 'solid-js';
import { app, initializeApp } from './app/store';
import { ImportScreen } from './ui/ImportScreen';
import { LibraryScreen } from './ui/LibraryScreen';
import { PlayScreen } from './ui/PlayScreen';
import { PwaUpdatePrompt } from './ui/PwaUpdatePrompt';
import { SettingsScreen } from './ui/SettingsScreen';
import { SetupScreen } from './ui/SetupScreen';

export function App() {
  onMount(() => void initializeApp());
  return (
    <>
      <Switch>
        <Match when={app.screen === 'library'}><LibraryScreen /></Match>
        <Match when={app.screen === 'setup'}><SetupScreen /></Match>
        <Match when={app.screen === 'play'}><PlayScreen /></Match>
        <Match when={app.screen === 'import'}><ImportScreen /></Match>
        <Match when={app.screen === 'settings'}><SettingsScreen /></Match>
      </Switch>
      <PwaUpdatePrompt />
    </>
  );
}
