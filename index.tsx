import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log("QuantCasa: Commencing system pulse...");

const rootElement = document.getElementById('root');

function showFatalError(error: any) {
  console.error("FATAL_BOOT_FAILURE:", error);
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="background:#0a0a0f; color:white; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; text-align:center; padding:20px;">
        <div style="width:80px; height:80px; background:rgba(88,95,216,0.1); border:2px solid #585FD8; border-radius:24px; display:flex; items-center; justify-content:center; margin-bottom:24px;">
          <svg width="40" height="40" viewBox="0 0 100 100" fill="none"><path d="M25 75 L52 45 L79 75" stroke="#585FD8" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <h1 style="color:#585FD8; font-size:24px; font-weight:900; margin-bottom:12px; text-transform:uppercase; letter-spacing:2px;">Neural Link Failure</h1>
        <p style="color:#64748b; max-width:400px; margin-bottom:32px; font-size:14px; line-height:1.6;">The application encountered a runtime initialization error. This is often resolved by clearing site data or refreshing with a hard reset.</p>
        <button onclick="window.location.reload(true)" style="background:#585FD8; border:none; color:white; padding:16px 32px; border-radius:16px; cursor:pointer; font-weight:bold; text-transform:uppercase; letter-spacing:1px; box-shadow: 0 0 20px rgba(88,95,216,0.4);">Re-Initialize Node</button>
      </div>
    `;
  }
}

try {
  if (!rootElement) {
    throw new Error("Target container #root not found.");
  }

  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log("QuantCasa: Core modules synchronized.");
} catch (e) {
  showFatalError(e);
}
