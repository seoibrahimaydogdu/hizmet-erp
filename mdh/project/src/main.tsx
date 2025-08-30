import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { UIUXProvider } from './contexts/UIUXContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

root.render(
  <ThemeProvider>
    <NotificationProvider>
      <UIUXProvider>
        <App />
      </UIUXProvider>
    </NotificationProvider>
  </ThemeProvider>
);
