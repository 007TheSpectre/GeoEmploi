import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Eye, EyeOff, Loader2, X, ShieldAlert } from 'lucide-react';
import { Button } from '../common/Button';
import { useFocusTrap } from '../../hooks';

export const DeleteAccountModal = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const modalRef = useFocusTrap(isOpen, {
    onClose: loading ? undefined : onClose,
    initialFocusRef: inputRef,
  });

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Veuillez saisir votre mot de passe pour confirmer la suppression.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onConfirm(password);
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression du compte.');
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl p-6 sm:p-7 shadow-2xl max-w-lg w-full border border-slate-200 space-y-5 animate-fadeIn"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 id="delete-account-title" className="text-lg font-bold text-slate-900">
                Supprimer mon compte
              </h3>
              <span className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded inline-block mt-0.5">
                RGPD Art. 17 — Droit à l'effacement
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-red-50/80 border border-red-200 text-xs text-red-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-red-800 text-sm">
            <AlertTriangle size={17} className="shrink-0 text-red-600" />
            <span>Attention : Cette action est irréversible et définitive.</span>
          </div>
          <p className="leading-relaxed">
            La confirmation entraînera immédiatement l'anonymisation de votre profil, la suppression de toutes vos données personnelles, l'invalidation de vos sessions actives et la clôture de vos offres ou candidatures en cours.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 animate-fadeIn font-medium">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="confirm-delete-password"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Veuillez saisir votre mot de passe pour confirmer :
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="confirm-delete-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe actuel"
                disabled={loading}
                required
                className="w-full px-3.5 py-2.5 pr-11 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Cette étape de sécurité garantit que vous êtes bien à l'origine de cette demande de suppression.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="md"
              disabled={loading || !password.trim()}
              icon={loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
              className="w-full sm:w-auto"
            >
              {loading ? 'Suppression en cours...' : 'Confirmer la suppression définitive'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
