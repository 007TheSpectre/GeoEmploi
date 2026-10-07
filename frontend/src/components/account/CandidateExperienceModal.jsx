import { useState } from 'react';
import { Briefcase } from 'lucide-react';
import { Button } from '../common/Button';
import { useFocusTrap } from '../../hooks';

const INITIAL_EXP_FORM = {
  company_name: '',
  job_title: '',
  started_at: '',
  ended_at: '',
  is_current: false,
  description: '',
};

export const CandidateExperienceModal = ({
  isOpen,
  onClose,
  onSubmit,
  adding,
  feedback,
}) => {
  const [form, setForm] = useState(INITIAL_EXP_FORM);

  const handleClose = () => {
    setForm(INITIAL_EXP_FORM);
    onClose();
  };

  const modalRef = useFocusTrap(isOpen, { onClose: handleClose });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.job_title.trim() || !form.started_at) {
      return;
    }

    const payload = {
      company_name: form.company_name.trim(),
      job_title: form.job_title.trim(),
      started_at: form.started_at,
      ended_at: form.is_current ? null : form.ended_at || null,
      is_current: form.is_current,
      description: form.description ? form.description.trim() : null,
    };

    const success = await onSubmit(payload);
    if (success) {
      setForm(INITIAL_EXP_FORM);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-experience-title"
        className="bg-white rounded-2xl p-6 shadow-2xl max-w-lg w-full border border-slate-200 space-y-4 animate-fadeIn"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 id="modal-experience-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Briefcase size={18} className="text-blue" />
            Nouvelle expérience professionnelle
          </h4>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer la boîte de dialogue"
            className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
          >
            Fermer
          </button>
        </div>

        {feedback && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Intitulé du poste *</label>
            <input
              type="text"
              required
              value={form.job_title}
              onChange={(e) => setForm({ ...form, job_title: e.target.value })}
              placeholder="Ex. Développeur Front-End, Vendeur..."
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Entreprise / Organisme *</label>
            <input
              type="text"
              required
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              placeholder="Ex. SNCF, Société Générale, Mairie..."
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date de début *</label>
              <input
                type="date"
                required
                value={form.started_at}
                onChange={(e) => setForm({ ...form, started_at: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date de fin</label>
              <input
                type="date"
                disabled={form.is_current}
                value={form.ended_at}
                onChange={(e) => setForm({ ...form, ended_at: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue outline-hidden disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_current"
              checked={form.is_current}
              onChange={(e) =>
                setForm({
                  ...form,
                  is_current: e.target.checked,
                  ended_at: e.target.checked ? '' : form.ended_at,
                })
              }
              className="rounded text-blue focus:ring-blue"
            />
            <label htmlFor="is_current" className="text-slate-700 font-medium cursor-pointer">
              J'occupe actuellement ce poste
            </label>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description des missions</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Principales réalisations, technologies employées, compétences mobilisées..."
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue outline-hidden resize-y"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={adding}>
              {adding ? 'Ajout en cours...' : "Ajouter l'expérience"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
