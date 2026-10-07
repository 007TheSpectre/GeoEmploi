import { User, CheckCircle2, AlertCircle, Loader2, Phone, FileText } from 'lucide-react';
import { Button } from '../common/Button';

const BIO_MAX_LENGTH = 1000;

const AVAILABILITY_OPTIONS = [
  { id: 'immediate', label: 'Immédiate', desc: "Prêt à commencer dès aujourd'hui" },
  { id: 'within_1_month', label: 'Sous 1 mois', desc: 'Préavis court / Disponible rapidement' },
  { id: 'within_3_months', label: 'Sous 3 mois', desc: 'Préavis standard en cours' },
  { id: 'not_available', label: 'Non disponible', desc: 'En poste / Veille uniquement' },
];

export const CandidateGeneralProfileForm = ({
  profile,
  setProfile,
  saving,
  feedback,
  onSubmit,
}) => {
  const bioValue = profile?.bio || '';
  const bioLength = bioValue.length;
  const isNearLimit = bioLength >= 900;
  const isAtLimit = bioLength >= BIO_MAX_LENGTH;

  return (
    <form onSubmit={onSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <User size={20} className="text-blue" />
            Profil Professionnel & Disponibilité
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ces informations sont automatiquement transmises aux recruteurs lors de vos candidatures.
          </p>
        </div>
        <Button
          type="submit"
          variant="primary"
          disabled={saving}
          icon={saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
      </div>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-xl border text-sm flex items-start gap-2.5 animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{feedback.message}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <fieldset className="space-y-1.5 md:col-span-2 border-0 p-0 m-0">
          <legend className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
            Disponibilité actuelle
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" role="radiogroup" aria-label="Disponibilité actuelle">
            {AVAILABILITY_OPTIONS.map((opt) => {
              const isSelected = profile.availability === opt.id;
              const inputId = `availability-${opt.id}`;
              const descId = `availability-desc-${opt.id}`;

              return (
                <label
                  key={opt.id}
                  htmlFor={inputId}
                  className={`relative flex flex-col p-3 border rounded-xl cursor-pointer transition-all text-left select-none focus-within:ring-2 focus-within:ring-[#1B3A6B] focus-within:ring-offset-2 ${
                    isSelected
                      ? 'border-[#1B3A6B] bg-[#1B3A6B]/5 shadow-xs'
                      : 'border-slate-300 hover:border-slate-400 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    id={inputId}
                    name="availability"
                    value={opt.id}
                    checked={isSelected}
                    aria-describedby={descId}
                    onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
                    className="sr-only peer"
                  />
                  <span className={`text-xs font-bold ${isSelected ? 'text-[#1B3A6B]' : 'text-slate-900'}`}>
                    {opt.label}
                  </span>
                  <span id={descId} className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    {opt.desc}
                  </span>
                  <div
                    className={`absolute inset-0 rounded-xl border-2 pointer-events-none transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-[#1B3A6B] peer-focus-visible:ring-offset-2 ${
                      isSelected ? 'border-[#1B3A6B]' : 'border-transparent'
                    }`}
                  />
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <label htmlFor="headline" className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
            Intitulé du poste recherché / Titre professionnel
          </label>
          <input
            id="headline"
            type="text"
            maxLength={255}
            value={profile.headline || ''}
            onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
            placeholder="Ex. Développeur Web Full-Stack, Électricien qualifié..."
            className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue focus:border-blue outline-hidden transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="phone" className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
            Numéro de téléphone de contact
          </label>
          <div className="relative">
            <Phone size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            <input
              id="phone"
              type="tel"
              maxLength={20}
              value={profile.phone || ''}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="Ex. 06 12 34 56 78"
              className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue focus:border-blue outline-hidden transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label htmlFor="cv_url" className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
            Lien vers votre CV en ligne / Portfolio (URL publique)
          </label>
          <div className="relative">
            <FileText size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            <input
              id="cv_url"
              type="url"
              maxLength={255}
              value={profile.cv_url || ''}
              onChange={(e) => setProfile({ ...profile, cv_url: e.target.value })}
              placeholder="https://drive.google.com/... ou lien de votre CV hébergé"
              className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue focus:border-blue outline-hidden transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <div className="flex items-center justify-between">
            <label htmlFor="bio" className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
              Présentation succincte / Bio professionnelle
            </label>
            <span
              id="bio-counter"
              aria-live="polite"
              className={`text-xs tabular-nums font-medium ${
                isAtLimit ? 'text-rose-600 font-bold' : isNearLimit ? 'text-amber-600 font-semibold' : 'text-slate-400'
              }`}
            >
              {bioLength} / {BIO_MAX_LENGTH} caractères
            </span>
          </div>
          <textarea
            id="bio"
            rows={4}
            maxLength={BIO_MAX_LENGTH}
            aria-describedby="bio-counter bio-help"
            value={bioValue}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="Décrivez votre parcours, vos motivations et vos points forts..."
            className={`w-full text-sm border rounded-xl p-3 text-slate-900 focus:ring-2 outline-hidden transition-all placeholder:text-slate-400 resize-y ${
              isAtLimit
                ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500'
                : 'border-slate-300 focus:ring-blue focus:border-blue'
            }`}
          />
          <p id="bio-help" className="text-[11px] text-slate-500">
            Une courte description (quelques lignes) pour mettre en valeur vos compétences et votre projet professionnel.
          </p>
        </div>
      </div>
    </form>
  );
};

