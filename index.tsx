
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Global shim for process.env to support SDK requirements in production/mobile environments
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}

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
    
    if (new URL(swUrl).origin !== window.location.origin) {
      console.info('Service Worker registration skipped: Origin mismatch.');
      return;
    }

    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: './'
    });
    console.log('QuantCasa SW Registered:', registration.scope);
  } catch (err) {
    console.info('Service Worker registration skipped or failed:', err instanceof Error ? err.message : err);
  }
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

registerServiceWorker();
