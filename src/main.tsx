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

// Force browser tab icon to immediately update without relying on cached files
try {
  const brandIconSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' width='64' height='64'%3E%3Crect width='64' height='64' rx='16' fill='%23141418'/%3E%3Crect x='1.5' y='1.5' width='61' height='61' rx='14.5' fill='none' stroke='%232d2d38' stroke-width='2'/%3E%3Ccircle cx='32' cy='32' r='18' fill='%23ffffff'/%3E%3Ccircle cx='32' cy='32' r='12' fill='none' stroke='%23a1a1aa' stroke-width='2.5'/%3E%3Ccircle cx='32' cy='32' r='4.5' fill='%23ffffff'/%3E%3C/svg%3E";
  document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']").forEach(el => {
    el.href = brandIconSvg;
  });
} catch {}

createRoot(document.getElementById('root')!).render(<App />);
