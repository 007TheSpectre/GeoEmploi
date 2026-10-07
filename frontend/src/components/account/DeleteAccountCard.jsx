import { Trash2, AlertOctagon } from 'lucide-react';
import { Button } from '../common/Button';

export const DeleteAccountCard = ({
  onOpenModal,
  className = '',
}) => {
  return (
    <div className={`bg-white border border-red-200/80 rounded-xl p-6 shadow-xs hover:border-red-300 transition-colors ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0 mt-0.5">
            <AlertOctagon size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Suppression du compte</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                RGPD Art. 17
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Conformément au RGPD (Droit à l'oubli), vous pouvez supprimer définitivement votre compte. Vos données personnelles et activités seront immédiatement anonymisées ou purgées. Votre mot de passe sera requis pour confirmer cette opération irréversible.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="danger"
          size="md"
          icon={<Trash2 size={16} />}
          onClick={onOpenModal}
          className="shrink-0 self-start sm:self-center"
        >
          Supprimer mon compte
        </Button>
      </div>
    </div>
  );
};
