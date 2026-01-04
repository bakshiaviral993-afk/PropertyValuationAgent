
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

/**
 * Senior Dev Note: Environment Polyfill
 * Ensures process.env is available even in environments that don't provide it natively.
 */
function initializeEnvironment() {
  if (typeof (window as any).process === 'undefined') {
    (window as any).process = { env: {} };
  }
  if (!(window as any).process.env) {
    (window as any).process.env = {};
  }
}

initializeEnvironment();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

/**
 * Robust Service Worker Registration
 */
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const swUrl = new URL('./sw.js', import.meta.url).href;
    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: './'
    });
    console.log('QuantCasa Core SW Registered:', registration.scope);
  } catch (err) {
    console.info('Service Worker registration skipped:', err instanceof Error ? err.message : err);
  }
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

registerServiceWorker();
