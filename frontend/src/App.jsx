import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { Navbar } from './components/navigation/Navbar';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { JobsPage } from './pages/JobsPage';
import { FaqPage } from './pages/FaqPage';
import { CguPage } from './pages/CguPage';

const AppLayout = () => {
  const location = useLocation();
  const isNoScrollPage = location.pathname === '/jobs' || location.pathname === '/';

  return (
    <div
      className={`${
        isNoScrollPage ? 'h-screen overflow-hidden' : 'min-h-screen'
      } flex flex-col bg-slate-50 text-slate-800 font-sans`}
    >
      <Navbar />

      <Routes>
        <Route path="/" element={<JobsPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/transparence" element={<FaqPage />} />
        <Route path="/cgu" element={<CguPage />} />
        <Route path="/terms" element={<CguPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <footer className="bg-white border-t border-slate-200 mt-auto shrink-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-medium">
          <p>
            « Démonstrateur technique, ne constitue pas un service public en exploitation. »
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link
              to="/faq"
              className="text-slate-600 hover:text-blue hover:underline focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue rounded px-1.5 py-0.5"
            >
              Transparence & FAQ
            </Link>
            <span className="text-slate-300">•</span>
            <Link
              to="/cgu"
              className="text-slate-600 hover:text-blue hover:underline focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue rounded px-1.5 py-0.5"
            >
              CGU
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
