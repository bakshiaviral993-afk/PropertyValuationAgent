import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

/**
 * Robust Service Worker Registration
 * Uses import.meta.url to ensure the sw.js path is resolved relative to the 
 * current script's origin, which fixes origin mismatch errors in sandboxed 
 * previews like AI Studio.
 */
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  try {
    // Determine the Service Worker URL relative to this module's location
    // This ensures it uses the correct origin (e.g. usercontent.goog)
    const swUrl = new URL('./sw.js', import.meta.url).href;
    
    // Check if the resolved URL is on the same origin as the current page
    if (new URL(swUrl).origin !== window.location.origin) {
      console.info('Service Worker registration skipped: Origin mismatch in preview environment.');
      return;
    }

    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: './'
    });
    console.log('QuantCasa SW Registered:', registration.scope);
  } catch (err) {
    // Log as info to avoid noisy red errors in environments that block Service Workers
    console.info('Service Worker registration skipped or failed:', err instanceof Error ? err.message : err);
  }
}

// Initializing the app
const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker after the initial render
registerServiceWorker();
