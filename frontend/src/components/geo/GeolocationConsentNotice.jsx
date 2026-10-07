import { useState } from 'react';
import { MapPin, ShieldCheck, Info, ChevronDown, ChevronUp, Lock, RefreshCw, X } from 'lucide-react';
import { Button } from '../common/Button';

export const GeolocationConsentNotice = ({ onAccept, onDecline, onClose }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      role="region"
      aria-label="Information sur la géolocalisation"
      className="bg-white/95 backdrop-blur-md border border-blue-200 rounded-xl shadow-lg p-5 mb-4 text-slate-800 transition-all duration-200 animate-fadeIn relative"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue shrink-0 mt-0.5">
            <MapPin size={22} className="text-blue" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-base">
                Activer la géolocalisation pour trouver les offres autour de vous ?
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue border border-blue-200 flex items-center gap-1">
                <ShieldCheck size={12} />
                RGPD Art. 13
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              GéoEmploi vous propose de détecter automatiquement votre département pour centrer la carte et filtrer les annonces proches. Votre position précise n'est jamais transmise publiquement ni stockée de manière persistante sans votre accord.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
            aria-label="Fermer la notice"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {showDetails && (
        <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 bg-slate-50/80 p-3.5 rounded-lg border border-slate-200">
          <div className="space-y-1">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <Lock size={14} className="text-blue" />
              Base légale & Finalité
            </div>
            <p>
              Consentement explicite (Art. 6.1.a du RGPD). Utilisé uniquement pour centrer la carte sur votre département.
            </p>
          </div>

          <div className="space-y-1">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600" />
              Précision & Confidentialité
            </div>
            <p>
              Précision limitée au département / arrondissement. Aucun historique de trajet ni suivi temps réel.
            </p>
          </div>

          <div className="space-y-1">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <RefreshCw size={14} className="text-purple-600" />
              Droit de retrait & Purge
            </div>
            <p>
              Révocable à tout moment dans vos Réglages. La désactivation purge immédiatement toute coordonnée liée.
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-blue hover:text-blue-hover font-semibold inline-flex items-center gap-1 cursor-pointer self-start"
        >
          <Info size={14} />
          <span>{showDetails ? 'Masquer les détails légaux' : 'En savoir plus sur la protection de vos données'}</span>
          {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDecline}
            className="text-xs text-slate-600 hover:bg-slate-100"
          >
            Continuer sans géolocalisation
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onAccept}
            icon={<MapPin size={15} />}
            className="text-xs font-semibold shadow-xs"
          >
            Autoriser et me localiser
          </Button>
        </div>
      </div>
    </div>
  );
};
