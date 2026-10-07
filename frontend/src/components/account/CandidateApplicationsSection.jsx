import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, Building2, MapPin, Calendar, CheckCircle2,
  Clock, XCircle, AlertCircle, ChevronDown, ChevronUp,
  FileText, ExternalLink, Send, Sparkles, Loader2, Eye
} from 'lucide-react';
import { Button } from '../common/Button';
import { fetchMyApplicationsApi } from '../../api/applicationsApi';
import { useAsync } from '../../hooks';

export const CandidateApplicationsSection = ({ token }) => {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);

  const {
    data: applications = [],
    loading,
    error,
  } = useAsync(
    () => fetchMyApplicationsApi(token),
    Boolean(token),
    [token],
    []
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue border border-blue-200">
            <Send size={12} /> Envoyée
          </span>
        );
      case 'viewed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Eye size={12} /> Consultée par l'employeur
          </span>
        );
      case 'shortlisted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Sparkles size={12} /> Présélectionnée
          </span>
        );
      case 'interview':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock size={12} /> Entretien en cours
          </span>
        );
      case 'offer_made':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            <CheckCircle2 size={12} /> Offre de contrat reçue
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} /> Candidature acceptée
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={12} /> Non retenue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const filtered = applications.filter((app) => {
    if (statusFilter === 'ALL') {
      return true;
    }
    if (statusFilter === 'PENDING') {
      return ['sent', 'viewed'].includes(app.status);
    }
    if (statusFilter === 'SHORTLISTED') {
      return ['shortlisted', 'interview', 'offer_made'].includes(app.status);
    }
    if (statusFilter === 'ACCEPTED') {
      return app.status === 'accepted';
    }
    if (statusFilter === 'REJECTED') {
      return app.status === 'rejected';
    }
    return true;
  });

  const counts = {
    total: applications.length,
    pending: applications.filter((a) => ['sent', 'viewed'].includes(a.status)).length,
    shortlisted: applications.filter((a) => ['shortlisted', 'interview', 'offer_made'].includes(a.status)).length,
    accepted: applications.filter((a) => a.status === 'accepted').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue" />
        <p className="text-sm font-medium">Chargement de vos candidatures...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase size={20} className="text-blue" />
              Suivi de mes candidatures ({applications.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Consultez en temps réel l'état d'examen de vos démarches auprès des recruteurs.
            </p>
          </div>
          <Link to="/jobs">
            <Button variant="outline" size="sm" icon={<ExternalLink size={14} />}>
              Explorer d'autres offres
            </Button>
          </Link>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
          {[
            { id: 'ALL', label: `Toutes (${counts.total})` },
            { id: 'PENDING', label: `En cours d'examen (${counts.pending})` },
            { id: 'SHORTLISTED', label: `Présélections & Entretiens (${counts.shortlisted})` },
            { id: 'ACCEPTED', label: `Retenues (${counts.accepted})` },
            { id: 'REJECTED', label: `Non retenues (${counts.rejected})` },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-blue text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue flex items-center justify-center mx-auto">
            <Send size={22} />
          </div>
          <h4 className="text-base font-bold text-slate-900">
            {applications.length === 0
              ? 'Aucune candidature soumise pour le moment'
              : 'Aucune candidature ne correspond à ce filtre'}
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {applications.length === 0
              ? 'Explorez la carte interactive des emplois et postulez directement en un clic avec votre profil professionnel.'
              : 'Modifiez vos filtres ci-dessus pour afficher l\'ensemble de vos candidatures.'}
          </p>
          {applications.length === 0 && (
            <div className="pt-2">
              <Link to="/jobs">
                <Button variant="primary" size="sm">
                  Découvrir les opportunités
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => {
            const isExpanded = expandedId === app.id;
            return (
              <div
                key={app.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-sm transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue/10 text-blue border border-blue/20 uppercase">
                        {app.contract_type || 'CDI'}
                      </span>
                      {getStatusBadge(app.status)}
                    </div>
                    <h4 className="text-base font-bold text-slate-900 leading-snug">
                      {app.offer_title || 'Offre d\'emploi'}
                    </h4>
                    <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <Building2 size={13} className="text-slate-400" />
                      {app.company_name}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : app.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue hover:text-blue-hover px-2.5 py-1 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <span>{isExpanded ? 'Masquer détails' : 'Voir mon message'}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <MapPin size={13} className="text-blue" />
                    <span>Département {app.departement_code || app.commune_code || 'France'}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Calendar size={13} className="text-slate-400" />
                    <span>Candidaté le {new Date(app.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>

                  {app.viewed_at && (
                    <div className="flex items-center gap-1 text-purple-700">
                      <Eye size={13} />
                      <span>Vue le {new Date(app.viewed_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}

                  {app.cv_url && (
                    <a
                      href={app.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue hover:underline font-medium"
                    >
                      <FileText size={13} />
                      <span>CV transmis</span>
                    </a>
                  )}
                </div>

                {isExpanded && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700 animate-fadeIn mt-2">
                    <span className="font-bold text-slate-800 uppercase tracking-wide block text-[11px]">
                      Message / Lettre de motivation transmis :
                    </span>
                    <p className="whitespace-pre-line leading-relaxed italic bg-white p-3 rounded-lg border border-slate-200">
                      {app.cover_letter || 'Aucun message d\'accompagnement spécifique saisi.'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
