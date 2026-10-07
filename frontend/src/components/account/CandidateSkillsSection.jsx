import { useState } from 'react';
import { Award, Plus, Trash2, Star, Loader2 } from 'lucide-react';
import { Button } from '../common/Button';

export const CandidateSkillsSection = ({
  skills,
  onAddSkill,
  onRemoveSkill,
  addingSkill,
  skillFeedback,
}) => {
  const [skillName, setSkillName] = useState('');
  const [skillLevel, setSkillLevel] = useState(3);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!skillName.trim()) return;

    await onAddSkill(skillName.trim(), skillLevel);
    setSkillName('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Award size={20} className="text-blue" />
          Compétences professionnelles ({skills.length})
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Mettez en avant vos savoir-faire techniques, logiciels maîtrisés ou aptitudes métier.
        </p>
      </div>

      {skillFeedback && (
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
          {skillFeedback.message}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl"
      >
        <div className="flex-1 space-y-1">
          <label htmlFor="skillName" className="text-xs font-semibold text-slate-700">
            Intitulé de la compétence
          </label>
          <input
            id="skillName"
            type="text"
            value={skillName}
            onChange={(e) => setSkillName(e.target.value)}
            placeholder="Ex. JavaScript, Gestion de projet, Accueil clientèle, Sécurité incendie..."
            className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue outline-hidden"
            maxLength={100}
          />
        </div>

        <div className="space-y-1 shrink-0 sm:w-44">
          <label htmlFor="skillLevel" className="text-xs font-semibold text-slate-700">
            Niveau de maîtrise (1 à 5)
          </label>
          <select
            id="skillLevel"
            value={skillLevel}
            onChange={(e) => setSkillLevel(Number(e.target.value))}
            className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue outline-hidden cursor-pointer"
          >
            <option value={1}>1 - Notions de base</option>
            <option value={2}>2 - Intermédiaire</option>
            <option value={3}>3 - Confirmé / Autonome</option>
            <option value={4}>4 - Avancé</option>
            <option value={5}>5 - Expert</option>
          </select>
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={addingSkill || !skillName.trim()}
          icon={addingSkill ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          className="shrink-0"
        >
          Ajouter
        </Button>
      </form>

      {skills.length === 0 ? (
        <p className="text-xs text-slate-500 italic py-2">
          Aucune compétence ajoutée pour le moment. Ajoutez vos compétences pour valoriser votre profil auprès des recruteurs.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          {skills.map((s) => (
            <div
              key={s.id}
              className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-slate-300 py-1.5 px-3 rounded-xl text-xs text-slate-800 transition-all shadow-2xs"
            >
              <span className="font-semibold">{s.skill_name}</span>
              {s.level && (
                <span className="flex items-center text-amber-500 gap-0.5" title={`Niveau ${s.level}/5`}>
                  {[...Array(s.level)].map((_, i) => (
                    <Star key={i} size={10} className="fill-amber-400 text-amber-400" />
                  ))}
                </span>
              )}
              <button
                type="button"
                onClick={() => onRemoveSkill(s.id)}
                className="text-slate-400 hover:text-red-600 p-0.5 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                title="Supprimer la compétence"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
