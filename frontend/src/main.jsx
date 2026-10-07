import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { FavoritesProvider } from './context/FavoritesContext'

if (typeof window !== 'undefined') {
  window.addEventListener(
    'focusin',
    (e) => {
      const target = e.target;
      if (!target || !(target instanceof HTMLElement))
        return;

      if (target.closest('[role="dialog"]') || target.closest('.fixed'))
        return;

      requestAnimationFrame(() => {
        try {
          if (target.matches(':focus-visible')) {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest',
            });
          }
        } catch {
        }
      });
    },
    true
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <FavoritesProvider>
        <App />
      </FavoritesProvider>
    </AuthProvider>
  </StrictMode>,
);

