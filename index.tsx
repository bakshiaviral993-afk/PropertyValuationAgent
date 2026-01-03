
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

/**
 * Senior Dev Note: Nuclear Shim for process.env
 * Some browser environments and PWA builders strip the process object.
 * We ensure it's available and mapped to the window's state.
 */
function initializeGlobalEnvironment() {
  const isProcessUndefined = typeof (window as any).process === 'undefined';
  
  if (isProcessUndefined) {
    (window as any).process = { 
      env: { 
        API_KEY: (window as any).API_KEY || undefined 
      } 
    };
  } else if (!(window as any).process.env) {
    (window as any).process.env = {
      API_KEY: (window as any).API_KEY || undefined
    };
  }

  // Double-link for maximum visibility
  if ((window as any).process.env.API_KEY) {
     (window as any).API_KEY = (window as any).process.env.API_KEY;
  }
}

initializeGlobalEnvironment();

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
