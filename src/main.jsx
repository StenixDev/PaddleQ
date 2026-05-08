import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { PickleballProvider } from './state/PickleballContext.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PickleballProvider>
      <App />
    </PickleballProvider>
  </React.StrictMode>
);
