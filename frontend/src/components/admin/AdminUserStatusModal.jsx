import { CheckCircle2, Ban, X } from 'lucide-react';
import { Button } from '../common/Button';
import { useFocusTrap } from '../../hooks';

export const AdminUserStatusModal = ({
  selectedUser,
  onClose,
  statusReason,
  setStatusReason,
  submitting,
  onConfirm,
}) => {
  const isOpen = Boolean(selectedUser);
  const modalRef = useFocusTrap(isOpen, { onClose: submitting ? undefined : onClose });

  if (!selectedUser) return null;

  const isSuspended = selectedUser.status === 'suspended';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-status-title"
        className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full border border-slate-200 space-y-4 animate-fadeIn"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 id="admin-user-status-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
            {isSuspended ? (
              <>
                <CheckCircle2 size={18} className="text-emerald-600" />
                Réactiver le compte
              </>
            ) : (
              <>
                <Ban size={18} className="text-rose-600" />
                Suspendre le compte utilisateur
              </>
            )}
          </h4>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la boîte de dialogue"
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-600">
          {isSuspended
            ? `Souhaitez-vous réactiver le compte de ${selectedUser.email} ? L'utilisateur retrouvera l'accès complet à ses fonctionnalités.`
            : `Êtes-vous sûr de vouloir suspendre le compte de ${selectedUser.email} ? L'utilisateur ne pourra plus se connecter.`}
        </p>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">
            Motif administratif ({isSuspended ? 'optionnel' : 'recommandé'})
          </label>
          <textarea
            rows={3}
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
            placeholder="Indiquez la raison de cette décision (signalement, non-respect des CGU, etc.)..."
            className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-hidden"
            maxLength={1000}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={submitting}
            onClick={onConfirm}
            className={
              isSuspended
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }
          >
            {submitting
              ? 'Traitement...'
              : isSuspended
              ? 'Confirmer la réactivation'
              : 'Confirmer la suspension'}
          </Button>
        </div>
      </div>
    </div>
  );
};
