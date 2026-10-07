import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Briefcase, AlertCircle, ArrowLeft, CheckCircle2, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AdminHeader } from '../components/admin/AdminHeader';
import { AdminStatCard } from '../components/admin/AdminStatCard';
import { AdminOffersList } from '../components/admin/AdminOffersList';
import { AdminUsersList } from '../components/admin/AdminUsersList';
import { DataPortabilityCard } from '../components/common/DataPortabilityCard';
import { fetchAdminMetrics } from '../api/adminApi';
import { useDataExport } from '../hooks';

export const AdminPage = () => {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN' || user?.isAdmin;

  const [metrics, setMetrics] = useState(null);
  const [activeTab, setActiveTab] = useState('offers'); // 'offers' | 'users'
  const { exporting, exportFeedback, setExportFeedback, handleExportData } = useDataExport(token, user?.email);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/jobs', { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const loadMetrics = useCallback(async () => {
    if (!token)
      return;
    try {
      const data = await fetchAdminMetrics(token);
      setMetrics(data);
    } catch (err) {
      console.error('Erreur chargement metrics:', err);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadMetrics();
    }
  }, [isAuthenticated, isAdmin, loadMetrics]);

  if (!isAuthenticated || !isAdmin)
    return null;

  return (
    <main className="flex-1 bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue hover:text-blue-hover transition-colors"
        >
          <ArrowLeft size={16} />
          Retour à la carte des emplois
        </Link>

        <AdminHeader
          userEmail={user?.email}
          onExport={() => handleExportData()}
          exporting={exporting}
        />

        {exportFeedback && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 text-sm ${
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminStatCard
            title="Utilisateurs inscrits"
            icon={Users}
            value={metrics?.users?.total ?? '—'}
            subtitle={
              metrics
                ? `${metrics.candidates?.total ?? 0} candidats • ${metrics.employers?.total ?? 0} employeurs`
                : 'Chargement...'
            }
            subtitleColor="text-slate-500"
          />

          <AdminStatCard
            title="Offres actives"
            icon={Briefcase}
            value={metrics?.job_offers?.active ?? '—'}
            subtitle={
              metrics
                ? `Total offres : ${metrics.job_offers?.total ?? 0}`
                : 'Chargement...'
            }
            subtitleColor="text-emerald-600"
          />

          <AdminStatCard
            title="Candidatures nationales"
            icon={Send}
            value={metrics?.applications?.total ?? 0}
            subtitle={
              metrics
                ? `${metrics.employers?.verified ?? 0} employeurs vérifiés`
                : 'Chargement...'
            }
            subtitleColor="text-blue"
          />

          <AdminStatCard
            title="Signalements en attente"
            icon={AlertCircle}
            value={metrics?.pending_reports ?? 0}
            subtitle={
              metrics?.pending_reports > 0
                ? 'Signalement(s) à examiner'
                : 'Plateforme saine'
            }
            subtitleColor={metrics?.pending_reports > 0 ? 'text-amber-600' : 'text-emerald-600'}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('offers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'offers'
                ? 'bg-blue text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Briefcase size={15} />
            <span>Modération des Offres ({metrics?.job_offers?.total ?? 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-blue text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users size={15} />
            <span>Gestion des Utilisateurs & SIRET ({metrics?.users?.total ?? 0})</span>
          </button>
        </div>

        {activeTab === 'offers' ? (
          <AdminOffersList token={token} onOfferModerated={loadMetrics} />
        ) : (
          <AdminUsersList token={token} onUserUpdated={loadMetrics} />
        )}

        <DataPortabilityCard
          onExport={() => handleExportData()}
          exporting={exporting}
          description="Conformément au Règlement Général sur la Protection des Données, vous pouvez exporter l'intégralité des données liées à votre compte administrateur au format JSON normalisé."
        />
      </div>
    </main>
  );
};

