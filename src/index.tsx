import './main.css';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import { render } from 'solid-js/web';
import { App } from './App';

const queryClient = new QueryClient();

render(
  () => (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  ),
  document.getElementById('app')!,
);
