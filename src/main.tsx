import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Remove service workers and caches left behind by the previous PWA build.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
  });
}

if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
  });
}

// Force browser tab icon to immediately update to the sketchbook emblem
try {
  const sketchbookFavicon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' width='64' height='64'%3E%3Crect x='5' y='6' width='54' height='52' rx='8' fill='%23FAF6EE' stroke='%232C241C' stroke-width='4'/%3E%3Crect x='13' y='2' width='5' height='10' rx='2.5' fill='%2354483C'/%3E%3Crect x='25' y='2' width='5' height='10' rx='2.5' fill='%2354483C'/%3E%3Crect x='37' y='2' width='5' height='10' rx='2.5' fill='%2354483C'/%3E%3Crect x='49' y='2' width='5' height='10' rx='2.5' fill='%2354483C'/%3E%3Cpolygon points='38,6 59,6 59,25 46,25' fill='%23ECD58E'/%3E%3Cpath d='M 15 25 Q 24 35 32 45' fill='none' stroke='%23B83320' stroke-width='6' stroke-linecap='round'/%3E%3Cpath d='M 32 25 Q 24 35 15 45' fill='none' stroke='%23B83320' stroke-width='6' stroke-linecap='round'/%3E%3Cellipse cx='43' cy='37' rx='9' ry='10' fill='none' stroke='%231F4E78' stroke-width='5.5' stroke-linecap='round'/%3E%3C/svg%3E";
  document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']").forEach(el => {
    el.href = sketchbookFavicon;
  });
} catch {}

createRoot(document.getElementById('root')!).render(<App />);
