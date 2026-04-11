import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './style.scss';
import { initI18n } from '@/i18n';

initI18n().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
