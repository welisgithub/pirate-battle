// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './app/App';
import { worker } from './mocks/browser';
import './styles.css';

// Inicia o MSW em segundo plano — se demorar, não trava a tela de jeito nenhum
void worker
  .start({
    onUnhandledRequest: 'bypass',
    quiet: true,
  })
  .catch((err) => {
    console.warn('MSW background start notice:', err);
  });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const root = document.getElementById('root');
if (!root) {
  throw new Error('The application root element is missing.');
}

// Renderização instantânea imediata
createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);