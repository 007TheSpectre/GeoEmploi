import { useState, useMemo } from 'react';
import {
  X, Users, Search, Filter, ArrowUpDown, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '../common/Button';
import { fetchOfferApplicationsApi, updateApplicationStatusApi } from '../../api/applicationsApi';
import { useAsync, useFocusTrap } from '../../hooks';
import { EmployerApplicationCard } from './EmployerApplicationCard';
import { EmployerApplicationRejectBanner } from './EmployerApplicationRejectBanner';

export const EmployerApplicationsModal = ({
  isOpen,
  onClose,
  offer,
  token,
  onApplicationStatusUpdated,
}) => {
  const modalRef = useFocusTrap(isOpen, { onClose });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [rejectingApp, setRejectingApp] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const {
    data: applications = [],
    loading,
    error,
    setData: setApplications,
  } = useAsync(
    () => fetchOfferApplicationsApi(token, offer?.id),
    Boolean(isOpen && offer?.id && token),
    [isOpen, offer?.id, token],
    []
  );

  const handleUpdateStatus = async (appId, newStatus, note = null) => {
    setUpdatingId(appId);
    try {
      const updated = await updateApplicationStatusApi(token, appId, {
        status: newStatus,
        note: note || undefined,
      });

      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, ...updated } : a))
      );

      if (onApplicationStatusUpdated) {
        onApplicationStatusUpdated();
      }

      if (rejectingApp?.id === appId) {
        setRejectingApp(null);
        setRejectReason('');
      }
    } catch (err) {
      alert(err.message || 'Erreur lors de la mise à jour du statut.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredApplications = useMemo(() => {
    return applications
      .filter((app) => {
        const fullName = `${app.first_name || ''} ${app.last_name || ''}`.toLowerCase();
        const email = (app.email || '').toLowerCase();
        const headline = (app.headline || '').toLowerCase();
        const term = searchTerm.toLowerCase();

        const matchesSearch = !term || fullName.includes(term) || email.includes(term) || headline.includes(term);

        if (!matchesSearch)
          return false;
        if (statusFilter === 'ALL')
          return true;
        if (statusFilter === 'NEW')
          return ['sent', 'viewed'].includes(app.status);
        if (statusFilter === 'SHORTLISTED')
          return ['shortlisted', 'interview'].includes(app.status);
        if (statusFilter === 'ACCEPTED')
          return app.status === 'accepted';
        if (statusFilter === 'REJECTED')
          return app.status === 'rejected';

        return app.status === statusFilter;
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [applications, searchTerm, statusFilter, sortBy]);

  if (!isOpen || !offer) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden animate-fadeIn my-8 max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="employer-applications-title"
      >
        <div className="px-6 py-4 bg-gradient-to-r from-blue to-blue-hover text-white flex items-center justify-between shrink-0">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold tracking-wider uppercase text-blue-100 flex items-center gap-1.5">
              <Users size={14} /> Gestion des candidatures ({applications.length})
            </span>
            <h3 id="employer-applications-title" className="text-lg font-bold leading-snug truncate max-w-xl">
              {offer.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fermer la boîte de dialogue"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, email ou compétences..."
              className="w-full pl-10 pr-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue focus:border-blue outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
              <Filter size={13} className="text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent outline-hidden font-medium cursor-pointer"
              >
                <option value="ALL">Tous statuts ({applications.length})</option>
                <option value="NEW">Nouvelles & En cours</option>
                <option value="SHORTLISTED">Présélections & Entretiens</option>
                <option value="ACCEPTED">Candidatures acceptées</option>
                <option value="REJECTED">Candidatures refusées</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
              <ArrowUpDown size={13} className="text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent outline-hidden font-medium cursor-pointer"
              >
                <option value="newest">Plus récentes d'abord</option>
                <option value="oldest">Plus anciennes d'abord</option>
              </select>
            </div>
          </div>
        </div>

        <EmployerApplicationRejectBanner
          rejectingApp={rejectingApp}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          onCancel={() => setRejectingApp(null)}
          onConfirm={() => handleUpdateStatus(rejectingApp.id, 'rejected', rejectReason)}
          updating={updatingId === rejectingApp?.id}
        />

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue" />
              <p className="text-sm font-medium">Chargement des candidatures...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Users size={24} />
              </div>
              <h4 className="text-base font-bold text-slate-800">
                {applications.length === 0
                  ? 'Aucune candidature reçue pour le moment'
                  : 'Aucune candidature ne correspond aux filtres sélectionnés'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {applications.length === 0
                  ? "Dès qu'un candidat postule à cette offre sur la carte, son profil complet et sa lettre de motivation apparaîtront ici."
                  : "Essayez de réinitialiser vos filtres pour voir l'ensemble des candidatures."}
              </p>
            </div>
          ) : (
            filteredApplications.map((app) => (
              <EmployerApplicationCard
                key={app.id}
                app={app}
                offerTitle={offer.title}
                isExpanded={expandedId === app.id}
                onToggleExpand={() => setExpandedId(expandedId === app.id ? null : app.id)}
                isUpdating={updatingId === app.id}
                onUpdateStatus={handleUpdateStatus}
                onStartReject={setRejectingApp}
              />
            ))
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>{filteredApplications.length} candidature(s) affichée(s)</span>
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
};
