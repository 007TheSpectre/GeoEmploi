import {
  CheckCircle2, XCircle, Clock, Eye, Send, Sparkles,
  Mail, Phone, FileText, ExternalLink, Calendar,
  ChevronDown, ChevronUp, MessageSquare
} from 'lucide-react';
import { Button } from '../common/Button';

const StatusBadge = ({ status }) => {
  switch (status) {
    case 'sent':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue border border-blue-200">
          <Send size={12} /> Nouvelle (Envoyée)
        </span>
      );
    case 'viewed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <Eye size={12} /> Consultée
        </span>
      );
    case 'shortlisted':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Sparkles size={12} /> Présélectionnée
        </span>
      );
    case 'interview':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock size={12} /> Entretien
        </span>
      );
    case 'offer_made':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
          <CheckCircle2 size={12} /> Proposition d'embauche
        </span>
      );
    case 'accepted':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 size={12} /> Candidature acceptée
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle size={12} /> Refusée
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
          {status}
        </span>
      );
  }
};

const AvailabilityBadge = ({ availability }) => {
  switch (availability) {
    case 'immediate':
      return <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">Dispo immédiate</span>;
    case 'within_1_month':
      return <span className="text-blue font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">Dispo sous 1 mois</span>;
    case 'within_3_months':
      return <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">Dispo sous 3 mois</span>;
    case 'not_available':
      return <span className="text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">Non disponible</span>;
    default:
      return null;
  }
};

export const EmployerApplicationCard = ({
  app,
  offerTitle,
  isExpanded,
  onToggleExpand,
  isUpdating,
  onUpdateStatus,
  onStartReject,
}) => {
  return (
    <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-2xs transition-all space-y-4">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-base font-bold text-slate-900">
              {app.first_name} {app.last_name}
            </h4>
            <AvailabilityBadge availability={app.availability} />
            <StatusBadge status={app.status} />
          </div>

          {app.headline && (
            <p className="text-xs font-medium text-slate-600 italic">
              « {app.headline} »
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap pt-1">
            {app.email && (
              <a
                href={`mailto:${app.email}?subject=Votre candidature : ${encodeURIComponent(offerTitle || '')}`}
                className="flex items-center gap-1 text-blue hover:underline font-semibold"
                title="Envoyer un email au candidat"
              >
                <Mail size={13} />
                {app.email}
              </a>
            )}

            {app.phone && (
              <a
                href={`tel:${app.phone}`}
                className="flex items-center gap-1 text-slate-700 hover:text-blue font-medium"
              >
                <Phone size={13} className="text-slate-400" />
                {app.phone}
              </a>
            )}

            <span className="flex items-center gap-1 text-slate-400 text-[11px]">
              <Calendar size={12} />
              Candidaté le {new Date(app.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap self-start shrink-0 pt-1 md:pt-0">
          {app.status !== 'accepted' && (
            <Button
              variant="ghost"
              size="sm"
              icon={<CheckCircle2 size={13} className="text-emerald-600" />}
              onClick={() => onUpdateStatus(app.id, 'accepted')}
              disabled={isUpdating}
              className="text-xs text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-1 px-2.5 h-auto font-semibold cursor-pointer"
            >
              Accepter
            </Button>
          )}

          {(app.status === 'sent' || app.status === 'viewed') && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Sparkles size={13} className="text-indigo-600" />}
              onClick={() => onUpdateStatus(app.id, 'shortlisted')}
              disabled={isUpdating}
              className="text-xs text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 py-1 px-2.5 h-auto font-semibold cursor-pointer"
            >
              Présélectionner
            </Button>
          )}

          {app.status === 'shortlisted' && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Clock size={13} className="text-amber-600" />}
              onClick={() => onUpdateStatus(app.id, 'interview')}
              disabled={isUpdating}
              className="text-xs text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 py-1 px-2.5 h-auto font-semibold cursor-pointer"
            >
              Entretien
            </Button>
          )}

          {app.status !== 'rejected' && (
            <Button
              variant="ghost"
              size="sm"
              icon={<XCircle size={13} className="text-rose-600" />}
              onClick={() => onStartReject(app)}
              disabled={isUpdating}
              className="text-xs text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 py-1 px-2.5 h-auto font-semibold cursor-pointer"
            >
              Refuser
            </Button>
          )}

          {app.status === 'sent' && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Eye size={13} />}
              onClick={() => onUpdateStatus(app.id, 'viewed')}
              disabled={isUpdating}
              className="text-xs text-slate-600 hover:bg-slate-100 py-1 px-2 h-auto"
              title="Marquer comme consultée"
            >
              Marquer vue
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 flex-wrap text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Compétences :</span>
          {Array.isArray(app.skills) && app.skills.length > 0 ? (
            app.skills.map((s) => (
              <span
                key={s.id}
                className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium"
              >
                {s.skill_name}
              </span>
            ))
          ) : (
            <span className="text-slate-400 italic text-[11px]">Non spécifiées</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {app.cv_url && (
            <a
              href={app.cv_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue hover:text-blue-hover underline cursor-pointer"
            >
              <FileText size={13} />
              <span>Consulter le CV</span>
              <ExternalLink size={11} />
            </a>
          )}

          <button
            type="button"
            onClick={onToggleExpand}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <span>{isExpanded ? 'Masquer profil complet' : 'Voir profil & message'}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5 text-xs text-slate-700 animate-fadeIn mt-2">
          <div className="space-y-1">
            <span className="font-bold text-slate-800 uppercase tracking-wide text-[11px] flex items-center gap-1">
              <MessageSquare size={13} className="text-blue" />
              Message d'accompagnement du candidat
            </span>
            <div className="p-3 bg-white rounded-lg border border-slate-200 whitespace-pre-line leading-relaxed italic text-slate-800">
              {app.cover_letter || "Le candidat n'a pas renseigné de message d'accompagnement."}
            </div>
          </div>

          {app.bio && (
            <div className="space-y-1">
              <span className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
                Bio / Présentation
              </span>
              <p className="p-2.5 bg-white rounded-lg border border-slate-200 leading-relaxed text-slate-700">
                {app.bio}
              </p>
            </div>
          )}

          {Array.isArray(app.experiences) && app.experiences.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
                Expériences professionnelles transmises ({app.experiences.length})
              </span>
              <div className="space-y-2">
                {app.experiences.map((exp) => (
                  <div key={exp.id} className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{exp.job_title} chez {exp.company_name}</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        {exp.is_current ? 'En poste actuel' : `${exp.started_at || ''} — ${exp.ended_at || ''}`}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
