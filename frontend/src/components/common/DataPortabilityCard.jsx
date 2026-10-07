import { Database, Download, Loader2 } from 'lucide-react';
import { Button } from './Button';

export const DataPortabilityCard = ({
  onExport,
  exporting = false,
  title = 'Portabilité de vos données personnelles',
  description,
  buttonLabel = 'Exporter mes données (JSON)',
  className = '',
}) => {
  const defaultDescription =
    "Conformément au Règlement Général sur la Protection des Données (RGPD Art. 20), vous disposez du droit d'exporter à tout moment l'ensemble des données numériques associées à votre compte. Le fichier téléchargé (format JSON normalisé) comprend vos informations de profil, coordonnées, historique, candidatures, offres créées ou sauvegardées et notifications.";

  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-6 shadow-sm ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue shrink-0 mt-0.5">
            <Database size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{title}</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                RGPD Art. 20
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {description || defaultDescription}
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="md"
          icon={exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          onClick={onExport}
          disabled={exporting}
          className="shrink-0 self-start sm:self-center"
        >
          {exporting ? 'Téléchargement...' : buttonLabel}
        </Button>
      </div>
    </div>
  );
};
