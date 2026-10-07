import { XCircle } from 'lucide-react';
import { Button } from '../common/Button';

export const EmployerApplicationRejectBanner = ({
  rejectingApp,
  rejectReason,
  setRejectReason,
  onCancel,
  onConfirm,
  updating,
}) => {
  if (!rejectingApp)
    return null;

  return (
    <div className="p-4 bg-rose-50 border-b border-rose-200 space-y-3 animate-fadeIn shrink-0">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
          <XCircle size={15} className="text-rose-600" />
          Refuser la candidature de {rejectingApp.first_name} {rejectingApp.last_name}
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
        >
          Annuler
        </button>
      </div>

      <textarea
        rows={2}
        value={rejectReason}
        onChange={(e) => setRejectReason(e.target.value)}
        placeholder="Indiquez un motif ou un retour constructif à transmettre au candidat (optionnel)..."
        className="w-full text-xs bg-white border border-rose-200 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-rose-400 outline-hidden"
        maxLength={1000}
      />

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="bg-rose-600 hover:bg-rose-700 text-white border-none"
          onClick={onConfirm}
          disabled={updating}
        >
          {updating ? 'Traitement...' : 'Confirmer le refus'}
        </Button>
      </div>
    </div>
  );
};
