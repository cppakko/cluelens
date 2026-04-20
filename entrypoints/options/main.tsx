import React from 'react';
import ReactDOM from 'react-dom/client';
import '~/assets/globals.css';
import { initI18n } from '@/i18n';

if (location.pathname.endsWith('options.html')) {
  initI18n().then(async () => {
    const { default: App } = await import('./App.tsx');
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  });
}
