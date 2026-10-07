import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Shield, ArrowLeft, Briefcase, ExternalLink, CheckCircle2, AlertCircle, Heart, Send, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { fetchUserStatsApi, updateUserPreferencesApi, deleteUserAccountApi } from '../api/authApi';
import { useDataExport } from '../hooks';
import { AccountHeader } from '../components/account/AccountHeader';
import { AccountSectionCard } from '../components/account/AccountSectionCard';
import { AccountInfoRow } from '../components/account/AccountInfoRow';
import { AccountActivityItem } from '../components/account/AccountActivityItem';
import { AccountFavoritesSection } from '../components/account/AccountFavoritesSection';
import { AccountPrivacySettings } from '../components/account/AccountPrivacySettings';
import { DeleteAccountCard } from '../components/account/DeleteAccountCard';
import { DeleteAccountModal } from '../components/account/DeleteAccountModal';
import { CandidateProfileSection } from '../components/account/CandidateProfileSection';
import { CandidateApplicationsSection } from '../components/account/CandidateApplicationsSection';
import { EmployerDashboard } from '../components/employer/EmployerDashboard';
import { DataPortabilityCard } from '../components/common/DataPortabilityCard';

export const AccountPage = () => {
  const { user, token, isAuthenticated, logoutState } = useAuth();
  const { favoritesCount, favoriteOffers, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const candidateTab = searchParams.get('tab') || 'profile';
  const [stats, setStats] = useState({
    published_offers_count: 0,
    received_applications_count: 0,
    saved_offers_count: 0,
    sent_applications_count: 0,
  });
  const { exporting, exportFeedback, setExportFeedback, handleExportData } = useDataExport(token, user?.email);

  const [geolocationEnabled, setGeolocationEnabled] = useState(() => {
    if (typeof user?.geolocation_enabled === 'boolean') {
      return user.geolocation_enabled;
    }
    return localStorage.getItem('geoemploi_geolocation_consent') === 'granted';
  });
  const [updatingGeo, setUpdatingGeo] = useState(false);
  const [geoFeedback, setGeoFeedback] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteAccountConfirm = async (password) => {
    await deleteUserAccountApi(token, password);
    logoutState();
    navigate('/login', {
      replace: true,
      state: {
        accountDeleted: true,
        message: 'Votre compte a été supprimé avec succès conformément au RGPD.',
      },
    });
  };

  useEffect(() => {
    if (typeof user?.geolocation_enabled === 'boolean') {
      setGeolocationEnabled(user.geolocation_enabled);
    }
  }, [user]);

  const handleToggleGeolocation = async () => {
    const nextState = !geolocationEnabled;
    setUpdatingGeo(true);
    setGeoFeedback(null);

    try {
      if (token) {
        await updateUserPreferencesApi(token, { geolocation_enabled: nextState });
      }

      if (nextState) {
        localStorage.setItem('geoemploi_geolocation_consent', 'granted');
        setGeoFeedback({
          type: 'success',
          message: 'La géolocalisation automatique a été activée.',
        });
      } else {
        localStorage.setItem('geoemploi_geolocation_consent', 'denied');
        setGeoFeedback({
          type: 'success',
          message: 'La géolocalisation a été désactivée. Vos coordonnées ont été immédiatement supprimées de votre compte (Droit à l\'oubli / RGPD).',
        });
      }
      setGeolocationEnabled(nextState);
    } catch (err) {
      setGeoFeedback({
        type: 'error',
        message: err.message || 'Erreur lors de la mise à jour des préférences de géolocalisation.',
      });
    } finally {
      setUpdatingGeo(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    if (token) {
      fetchUserStatsApi(token)
        .then((data) => {
          if (data) {
            setStats(data);
          }
        })
        .catch((err) => {
          console.error('Erreur lors du chargement des statistiques :', err);
        });
    }
  }, [isAuthenticated, token, navigate]);

  if (!isAuthenticated)
    return null;

  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN' || user?.isAdmin;
  const isEmployer = user?.role === 'employer' || user?.role === 'EMPLOYER';

  return (
    <main className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue hover:text-blue-hover transition-colors"
        >
          <ArrowLeft size={16} />
          Retour à la recherche d'emplois
        </Link>

        <AccountHeader
          user={user}
          onLogout={logoutState}
          onDeleteAccount={() => setIsDeleteModalOpen(true)}
        />

        {exportFeedback && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 text-sm animate-fadeIn ${
              exportFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            {exportFeedback.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-medium">{exportFeedback.message}</div>
            <button
              onClick={() => setExportFeedback(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Fermer
            </button>
          </div>
        )}

        {isAdmin ? (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Shield size={20} className="text-purple-600" />
                  <h2 className="text-lg font-bold text-slate-800">
                    Compte Administrateur de Plateforme
                  </h2>
                </div>
                <Link
                  to="/admin"
                  className="text-xs font-semibold text-blue hover:text-blue-hover flex items-center gap-1"
                >
                  <span>Accéder au panneau d'administration</span>
                  <ExternalLink size={14} />
                </Link>
              </div>
              <p className="text-sm text-slate-600">
                Vous êtes connecté avec les privilèges d'administrateur GéoEmploi. Vous pouvez accéder aux statistiques globales, modérer les offres et exporter l'intégralité de vos données personnelles via la section ci-dessous.
              </p>
            </div>
          </div>
        ) : isEmployer ? (
          <div className="space-y-8">
            <EmployerDashboard user={user} token={token} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
              <AccountSectionCard icon={User} title="Informations de l'organisme">
                <AccountInfoRow label="Adresse E-mail :">
                  {user?.email}
                </AccountInfoRow>
                <AccountInfoRow label="Statut du compte :">
                  <span className="text-emerald-600 flex items-center gap-1">
                    <Shield size={14} /> Actif / Employeur
                  </span>
                </AccountInfoRow>
                {user?.company_name && (
                  <AccountInfoRow label="Organisme / Entreprise :">
                    {user.company_name}
                  </AccountInfoRow>
                )}
              </AccountSectionCard>

              <AccountSectionCard icon={Briefcase} title="Résumé d'Activité">
                <AccountActivityItem
                  title="Offres publiées"
                  subtitle="Vos offres d'emploi actuellement référencées"
                  count={stats.published_offers_count ?? 0}
                />
                <AccountActivityItem
                  title="Candidatures reçues"
                  subtitle="Candidatures soumises sur l'ensemble de vos offres"
                  count={stats.received_applications_count ?? 0}
                />
              </AccountSectionCard>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto">
              {[
                { id: 'profile', label: 'Mon Profil Professionnel', icon: Award },
                { id: 'applications', label: 'Mes Candidatures', icon: Send, badge: stats.sent_applications_count },
                { id: 'favorites', label: 'Offres Enregistrées', icon: Heart, badge: favoritesCount },
                { id: 'privacy', label: 'Confidentialité & RGPD', icon: Shield },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = candidateTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('tab', tab.id);
                      setSearchParams(newParams);
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-blue text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={15} />
                    <span>{tab.label}</span>
                    {typeof tab.badge === 'number' && tab.badge > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {candidateTab === 'profile' && (
              <CandidateProfileSection token={token} user={user} />
            )}

            {candidateTab === 'applications' && (
              <CandidateApplicationsSection token={token} />
            )}

            {candidateTab === 'favorites' && (
              <AccountFavoritesSection
                favoriteOffers={favoriteOffers}
                favoritesCount={favoritesCount}
                onToggleFavorite={toggleFavorite}
              />
            )}

            {candidateTab === 'privacy' && (
              <div className="space-y-6">
                <AccountPrivacySettings
                  geolocationEnabled={geolocationEnabled}
                  onToggleGeolocation={handleToggleGeolocation}
                  updatingGeo={updatingGeo}
                  geoFeedback={geoFeedback}
                  onDismissFeedback={() => setGeoFeedback(null)}
                />
                <DataPortabilityCard
                  onExport={() => handleExportData()}
                  exporting={exporting}
                />
                <DeleteAccountCard
                  onOpenModal={() => setIsDeleteModalOpen(true)}
                />
              </div>
            )}
          </div>
        )}

        {(isAdmin || isEmployer) && (
          <div className="space-y-6">
            <AccountPrivacySettings
              geolocationEnabled={geolocationEnabled}
              onToggleGeolocation={handleToggleGeolocation}
              updatingGeo={updatingGeo}
              geoFeedback={geoFeedback}
              onDismissFeedback={() => setGeoFeedback(null)}
            />

            <DataPortabilityCard
              onExport={() => handleExportData()}
              exporting={exporting}
            />

            <DeleteAccountCard
              onOpenModal={() => setIsDeleteModalOpen(true)}
            />
          </div>
        )}

        <DeleteAccountModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteAccountConfirm}
        />
      </div>
    </main>
  );
};

