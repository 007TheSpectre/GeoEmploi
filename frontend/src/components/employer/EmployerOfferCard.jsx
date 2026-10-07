import { MapPin, Eye, Users, Calendar, DollarSign, Trash2, Tag } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

export const EmployerOfferCard = ({ offer, onDelete, onViewApplications }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'pending_moderation':
        return <Badge variant="info">En attente de modération</Badge>;
      case 'rejected':
        return <Badge variant="error">Rejetée</Badge>;
      case 'closed':
        return <Badge variant="neutral">Fermée</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-md transition-all space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-xs text-xs font-semibold bg-blue/10 text-blue border border-blue/20 uppercase">
              {offer.contract_type}
            </span>
            {getStatusBadge(offer.status)}
          </div>
          <h4 className="text-lg font-bold text-slate-900 leading-snug truncate" title={offer.title}>
            {offer.title}
          </h4>
        </div>

        <div className="flex items-center gap-2 self-start shrink-0">
          {onViewApplications && (
            <Button
              variant="outline"
              size="sm"
              icon={<Users size={14} />}
              onClick={() => onViewApplications(offer)}
              className="text-xs font-semibold text-blue border-blue/30 hover:bg-blue-50"
            >
              Candidatures ({offer.application_count ?? 0})
            </Button>
          )}

          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={() => onDelete(offer.id)}
              className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 shrink-0"
              title="Supprimer cette offre"
            >
              Supprimer
            </Button>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-600 line-clamp-2">{offer.description}</p>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
        {(offer.commune_code || offer.postal_code || offer.city || (offer.latitude && offer.longitude)) && (
          <div className="flex items-center gap-1 text-slate-700 font-medium">
            <MapPin size={14} className="text-blue shrink-0" />
            <span>
              {[offer.city, offer.postal_code].filter(Boolean).join(' ') || offer.commune_code}
              {offer.latitude && offer.longitude && (
                <span className="text-slate-400 font-normal ml-1">
                  ({Number(offer.latitude).toFixed(4)}, {Number(offer.longitude).toFixed(4)})
                </span>
              )}
            </span>
          </div>
        )}

        {(offer.salary_min || offer.salary_max) && (
          <div className="flex items-center gap-1 text-slate-700 font-medium">
            <DollarSign size={14} className="text-emerald-600 shrink-0" />
            <span>
              {offer.salary_min ? `${offer.salary_min.toLocaleString()} €` : ''}
              {offer.salary_min && offer.salary_max ? ' - ' : ''}
              {offer.salary_max ? `${offer.salary_max.toLocaleString()} €` : ''}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <Eye size={14} className="text-slate-400 shrink-0" />
          <span>{offer.views ?? offer.view_count ?? 0} vues</span>
        </div>

        <button
          type="button"
          onClick={() => onViewApplications && onViewApplications(offer)}
          className="flex items-center gap-1 text-blue hover:text-blue-hover font-semibold cursor-pointer underline"
        >
          <Users size={14} className="shrink-0" />
          <span>{offer.application_count ?? 0} candidatures</span>
        </button>

        {offer.created_at && (
          <div className="flex items-center gap-1">
            <Calendar size={14} className="text-slate-400 shrink-0" />
            <span>Publiée le {new Date(offer.created_at).toLocaleDateString('fr-FR')}</span>
          </div>
        )}
      </div>

      {Array.isArray(offer.tags) && offer.tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <Tag size={12} className="text-slate-400" />
          {offer.tags.map((tag, idx) => (
            <span key={idx} className="bg-slate-100 text-slate-600 text-[11px] px-2 py-0.5 rounded-full font-medium">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

