import { Briefcase, Plus, Trash2, Calendar } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const CandidateExperiencesSection = ({
  experiences,
  onOpenAddModal,
  onRemoveExperience,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Briefcase size={20} className="text-blue" />
            Expériences professionnelles ({experiences.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Historique de vos postes et missions en entreprise.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={<Plus size={14} />}
          onClick={onOpenAddModal}
        >
          Ajouter une expérience
        </Button>
      </div>

      {experiences.length === 0 ? (
        <p className="text-xs text-slate-500 italic py-2">
          Aucune expérience renseignée pour l'instant. Cliquez sur « Ajouter une expérience » pour enrichir votre CV.
        </p>
      ) : (
        <div className="space-y-4">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white hover:border-blue/40 transition-all space-y-2 shadow-2xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{exp.job_title}</h4>
                  <p className="text-xs font-semibold text-blue">{exp.company_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {exp.is_current ? (
                    <Badge variant="success" size="sm">Poste actuel</Badge>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(exp.started_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })} —{' '}
                      {exp.ended_at
                        ? new Date(exp.ended_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
                        : "Aujourd'hui"}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveExperience(exp.id)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors cursor-pointer ml-1"
                    title="Supprimer cette expérience"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {exp.description && (
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line pt-1 border-t border-slate-100">
                  {exp.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
