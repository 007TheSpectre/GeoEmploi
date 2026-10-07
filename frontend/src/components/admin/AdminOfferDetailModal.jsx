import { useState } from 'react';
import {
  X,
  MapPin,
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Tag,
  Navigation,
  Globe,
  Loader2,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Alert } from '../common/Alert';
import { AdminOfferStatusBadge } from './AdminOfferStatusBadge';
import { useFocusTrap } from '../../hooks';

export const AdminOfferDetailModal = ({
  isOpen,
  offer,
  onClose,
  onModerate,
  loading = false,
}) => {
  const modalRef = useFocusTrap(isOpen && Boolean(offer), {
    onClose: loading ? undefined : onClose,
  });

  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [actionError, setActionError] = useState(null);

  if (!isOpen || !offer)
    return null;

  const handleApprove = async () => {
    setActionError(null);
    try {
      await onModerate(offer.id, { action: 'approve' });
      onClose();
    } catch (err) {
      setActionError(err.message || 'Erreur lors de la validation');
    }
  };

  const handleReject = async () => {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }

    if (!rejectReason.trim()) {
      setActionError('Veuillez indiquer un motif de refus.');
      return;
    }

    setActionError(null);
    try {
      await onModerate(offer.id, { action: 'reject', reason: rejectReason.trim() });
      setShowRejectInput(false);
      setRejectReason('');
      onClose();
    } catch (err) {
      setActionError(err.message || 'Erreur lors du refus');
    }
  };

  const handleCloseOffer = async () => {
    setActionError(null);
    try {
      await onModerate(offer.id, { action: 'close', reason: 'Fermée par un administrateur' });
      onClose();
    } catch (err) {
      setActionError(err.message || 'Erreur lors de la fermeture');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-offer-detail-title"
        className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Briefcase className="w-5 h-5 text-blue-400" />
            <h2 id="admin-offer-detail-title" className="text-xl font-bold tracking-wide">
              Examen de l'offre d'emploi #{offer.id}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<X size={20} />}
            iconPosition="only"
            onClick={onClose}
            ariaLabel="Fermer"
            className="text-slate-300 hover:text-white hover:bg-white/10 border-transparent!"
          >
            Fermer
          </Button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-sm">
          {actionError && (
            <Alert
              type="error"
              title="Erreur de modération"
              description={actionError}
              dismissible
              onClose={() => setActionError(null)}
            />
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-xs text-xs font-semibold bg-blue/10 text-blue border border-blue/20 uppercase">
                    {offer.contract_type}
                  </span>
                  <AdminOfferStatusBadge status={offer.status} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 leading-snug">
                  {offer.title}
                </h3>
                {offer.company_name && (
                  <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                    <Building2 size={16} className="text-blue" />
                    {offer.company_name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 pt-2 border-t border-slate-200">
              {offer.created_at && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} className="text-slate-400" />
                  Soumise le {new Date(offer.created_at).toLocaleDateString('fr-FR')} à {new Date(offer.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {offer.expires_at && (
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-slate-400" />
                  Expire le {new Date(offer.expires_at).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          </div>

          {offer.status === 'rejected' && offer.rejected_reason && (
            <Alert
              type="error"
              title="Motif de rejet précédent"
              description={offer.rejected_reason}
            />
          )}

          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900 flex items-center gap-1.5 text-base border-b border-slate-100 pb-1.5">
              <Briefcase size={16} className="text-blue" /> Description du poste
            </h4>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-slate-700 whitespace-pre-line leading-relaxed text-sm">
              {offer.description}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1">
              <span className="text-xs text-slate-500 font-medium block">Rémunération</span>
              <p className="text-base font-bold text-slate-900 flex items-center gap-1">
                <DollarSign size={16} className="text-emerald-600" />
                {offer.salary_min || offer.salary_max
                  ? `${offer.salary_min ? offer.salary_min.toLocaleString() : '0'} € - ${offer.salary_max ? offer.salary_max.toLocaleString() : 'N/C'} €`
                  : 'Non spécifiée'}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1">
              <span className="text-xs text-slate-500 font-medium block">Expérience requise</span>
              <p className="text-base font-bold text-slate-900">
                {offer.experience_years !== null && offer.experience_years !== undefined
                  ? `${offer.experience_years} an${offer.experience_years > 1 ? 's' : ''}`
                  : 'Non spécifiée'}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1">
              <span className="text-xs text-slate-500 font-medium block">Rayon de diffusion</span>
              <p className="text-base font-bold text-slate-900">
                {offer.broadcast_radius_km ? `${offer.broadcast_radius_km} km` : '50 km'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900 flex items-center gap-1.5 text-base border-b border-slate-100 pb-1.5">
              <MapPin size={16} className="text-blue" /> Localisation et Référentiel BAN
            </h4>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <MapPin size={18} className="text-blue shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">
                    {[offer.city, offer.postal_code].filter(Boolean).join(' ') || 'Commune non renseignée'}
                  </p>
                  {(offer.commune_code || offer.departement_code) && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Code commune INSEE : {offer.commune_code || 'N/C'} • Département : {offer.departement_code || 'N/C'}
                    </p>
                  )}
                </div>
              </div>

              {(offer.latitude && offer.longitude) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Navigation size={14} className="text-blue-600 shrink-0" />
                    <span>Coordonnées WGS84 : <strong>{Number(offer.latitude).toFixed(5)}, {Number(offer.longitude).toFixed(5)}</strong></span>
                  </div>
                  {(offer.lambert93_x && offer.lambert93_y) && (
                    <div className="flex items-center gap-1.5">
                      <Globe size={14} className="text-indigo-600 shrink-0" />
                      <span>Lambert-93 : <strong>X={Math.round(offer.lambert93_x)}, Y={Math.round(offer.lambert93_y)}</strong></span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {Array.isArray(offer.tags) && offer.tags.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="font-semibold text-slate-700 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <Tag size={14} /> Mots-clés / Tags
              </h4>
              <div className="flex items-center gap-1.5 flex-wrap">
                {offer.tags.map((tag, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium border border-slate-200">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {showRejectInput && (
            <div className="p-4 bg-red-50/70 border border-red-200 rounded-lg space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-red-800 font-semibold text-sm">
                <AlertTriangle size={16} className="shrink-0 text-red-600" />
                <span>Indiquez le motif de rejet pour l'employeur</span>
              </div>
              <Input
                label="Motif du refus"
                name="rejectReason"
                multiline
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="ex: Description incomplète, coordonnées erronées, non respect de la charte..."
                required
              />
            </div>
          )}
        </div>

        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <Button variant="tertiary" onClick={onClose} disabled={loading}>
            Fermer
          </Button>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            {offer.status === 'active' && (
              <Button
                variant="outline"
                size="md"
                onClick={handleCloseOffer}
                disabled={loading}
                icon={loading ? <Loader2 size={16} className="animate-spin" /> : undefined}
                className="text-slate-700 border-slate-300"
              >
                Clore l'offre
              </Button>
            )}

            {offer.status !== 'rejected' && (
              <Button
                variant="secondary"
                size="md"
                onClick={handleReject}
                disabled={loading}
                icon={loading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                className="text-red-700 border-red-300 bg-red-50 hover:bg-red-100 hover:border-red-400"
              >
                {showRejectInput ? 'Confirmer le refus' : 'Refuser l\'offre'}
              </Button>
            )}

            {offer.status !== 'active' && (
              <Button
                variant="primary"
                size="md"
                onClick={handleApprove}
                disabled={loading}
                icon={loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                Accepter et publier l'offre
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
