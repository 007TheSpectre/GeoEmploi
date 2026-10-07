import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, FileText, User, Menu, X, LogOut, ShieldCheck, Download, Loader2 } from 'lucide-react';
import { Logo } from '../common/Logo';
import { SearchBar } from '../common/SearchBar';
import { NavGroup } from './NavGroup';
import { NavItem } from './NavItem';
import { useAuth } from '../../context/AuthContext';
import { useDataExport, useBodyScrollLock } from '../../hooks';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, token, isAuthenticated, logoutState } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN' || user?.isAdmin;

  const { exporting, handleExportData } = useDataExport(token, user?.email);
  useBodyScrollLock(mobileMenuOpen);

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center justify-between">
          <Logo />
          
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-md text-blue hover:bg-slate-100 lg:hidden" aria-label="Menu">
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        <div className="hidden lg:flex flex-col items-end gap-3">
          <NavGroup direction="row" className="flex-wrap justify-end items-center">
            <NavItem label="Emplois" to="/jobs" icon={<MapPin size={18} />} />
            <NavItem label="FAQ" to="/faq" icon={<FileText size={18} />} />
            {isAuthenticated && isAdmin && (
              <NavItem label="Admin" to="/admin" icon={<ShieldCheck size={18} />} />
            )}
            {isAuthenticated ? (
              <>
                <NavItem label="Mon Compte" to="/account" icon={<User size={18} />} />
                <div className="flex items-center gap-2 pl-3 ml-2 border-l border-slate-200">
                  <Link
                    to="/account"
                    className="hidden xl:inline-block text-xs font-semibold text-blue bg-blue-light hover:bg-blue-100 px-2.5 py-1.5 rounded-md border border-blue/20 max-w-[140px] truncate cursor-pointer transition-colors"
                    title={`Mon compte (${user?.email})`}
                  >
                    {user?.email}
                  </Link>
                  <button
                    onClick={() => handleExportData()}
                    disabled={exporting}
                    className="text-xs font-semibold text-slate-700 hover:text-blue hover:bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200/80 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                    title="Télécharger mes données personnelles (RGPD Art. 20)"
                  >
                    {exporting ? <Loader2 size={14} className="animate-spin text-blue" /> : <Download size={14} />}
                    <span className="hidden xl:inline">{exporting ? 'Export...' : 'Exporter'}</span>
                  </button>
                  <button
                    onClick={logoutState}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-md border border-slate-200/80 hover:border-red-200 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                    title="Se déconnecter"
                  >
                    <LogOut size={14} />
                    <span className="hidden xl:inline">Déconnexion</span>
                  </button>
                </div>
              </>
            ) : (
              <NavItem label="Me connecter" to="/login" icon={<User size={18} />} />
            )}
          </NavGroup>

          <div className="w-full max-w-sm">
            <SearchBar placeholder="Rechercher" size="md" />
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-white flex flex-col lg:hidden">
            <div className="px-4 py-4 border-b border-slate-200 flex items-center justify-between">
              <Logo />
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-md text-blue hover:bg-slate-100" aria-label="Fermer le menu">
                <X size={28} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <SearchBar
                  placeholder="Rechercher une offre, une région..."
                  size="lg"
                />

                <div className="pt-2">
                  <NavGroup direction="col" className="space-y-2">
                    <NavItem label="Carte des emplois" to="/jobs" icon={<MapPin size={22} />} onClick={() => setMobileMenuOpen(false)} className="w-full text-base py-3" />
                    <NavItem label="FAQ" to="/faq" icon={<FileText size={22} />} onClick={() => setMobileMenuOpen(false)} className="w-full text-base py-3" />
                    {isAuthenticated && isAdmin && (
                      <NavItem label="Administration" to="/admin" icon={<ShieldCheck size={22} />} onClick={() => setMobileMenuOpen(false)} className="w-full text-base py-3" />
                    )}
                    {isAuthenticated ? (
                      <div className="pt-3 border-t border-slate-200 mt-2 space-y-3">
                        <NavItem label="Mon Compte" to="/account" icon={<User size={22} />} onClick={() => setMobileMenuOpen(false)} className="w-full text-base py-3" />
                        <div className="px-3 py-2 bg-blue-light rounded-lg border border-blue/20 text-xs font-semibold text-blue truncate">
                          Connecté : {user?.email}
                        </div>
                        <button
                          onClick={() => {
                            handleExportData();
                            setMobileMenuOpen(false);
                          }}
                          disabled={exporting}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {exporting ? <Loader2 size={18} className="animate-spin text-blue" /> : <Download size={18} />}
                          {exporting ? 'Exportation...' : 'Exporter mes données (RGPD)'}
                        </button>
                        <button
                          onClick={() => {
                            logoutState();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors cursor-pointer"
                        >
                          <LogOut size={18} />
                          Déconnexion
                        </button>
                      </div>
                    ) : (
                      <NavItem label="Me connecter" to="/login" icon={<User size={22} />} onClick={() => setMobileMenuOpen(false)} className="w-full text-base py-3 border-t border-slate-200 mt-2 pt-4" />
                    )}
                  </NavGroup>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
                « Démonstrateur technique, ne constitue pas un service public en exploitation. »
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
