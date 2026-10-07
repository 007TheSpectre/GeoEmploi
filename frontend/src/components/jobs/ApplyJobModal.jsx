import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Building2, MapPin, Send, CheckCircle2,
  AlertCircle, Loader2, FileText, UserCheck, Sparkles
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { applyToJobApi } from '../../api/applicationsApi';
import { useCandidateProfile, useFocusTrap } from '../../hooks';

export const ApplyJobModal = ({
  isOpen,
  onClose,
  offer,
  token,
  user,
  onApplicationSuccess,
}) => {
  const navigate = useNavigate();
  const [coverLetter, setCoverLetter] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const modalRef = useFocusTrap(isOpen, {
    onClose: submitting ? undefined : onClose,
  });

  const { profile, skills, loading: loadingProfile } = useCandidateProfile(token, {
    enabled: isOpen && Boolean(token),
    loadExperiences: false,
  });

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsSuccess(false);
      setCoverLetter('');
      setCvUrl(profile?.cv_url || '');
    }
  }, [isOpen, profile?.cv_url]);

  if (!isOpen || !offer) return null;
  const userRole = user?.role?.toLowerCase();
  if (userRole === 'employer' || userRole === 'admin') return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await applyToJobApi(token, {
        job_id: offer.id,
        cover_letter: coverLetter,
        cv_url: cvUrl,
      });

      setIsSuccess(true);
      if (onApplicationSuccess) {
        onApplicationSuccess(offer.id);
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de l\'envoi de votre candidature.');
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailabilityLabel = (avail) => {
    switch (avail) {
      case 'immediate':
        return 'Immédiate';
      case 'within_1_month':
        return 'Sous 1 mois';
      case 'within_3_months':
        return 'Sous 3 mois';
      case 'not_available':
        return 'Non disponible';
      default:
        return 'Disponible';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-fadeIn my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-job-modal-title"
      >
        <div className="px-6 py-4 bg-gradient-to-r from-blue to-blue-hover text-white flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold tracking-wider uppercase text-blue-100 flex items-center gap-1.5">
              <Send size={13} /> Candidature directe
            </span>
            <h3 id="apply-job-modal-title" className="text-lg font-bold leading-snug truncate max-w-md">
              {offer.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fermer la boîte de dialogue"
          >
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h4 className="text-xl font-bold text-slate-900">Candidature transmise avec succès !</h4>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Votre profil professionnel et votre message ont été directement envoyés à <strong>{offer.company_name}</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1 text-left max-w-md mx-auto">
              <p className="font-semibold text-slate-800">Que se passe-t-il ensuite ?</p>
              <p>• L'employeur a reçu une notification et examinera votre candidature.</p>
              <p>• Vous pouvez suivre en temps réel le statut d'avancement de votre dossier depuis votre espace candidat.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Continuer à chercher
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  onClose();
                  navigate('/account?tab=applications');
                }}
              >
                Suivre mes candidatures
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Building2 size={14} className="text-blue" />
                  {offer.company_name}
                </span>
                <span className="text-slate-600 flex items-center gap-1">
                  <MapPin size={13} />
                  {[offer.city, offer.postal_code].filter(Boolean).join(' ') || offer.departement_code || 'France'}
                </span>
              </div>
              <Badge variant="gov" size="sm">{offer.contract_type}</Badge>
            </div>

            <div className="border border-blue/20 bg-blue-50/50 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue flex items-center gap-1.5 uppercase tracking-wide">
                  <UserCheck size={15} /> Profil transmis à l'employeur
                </span>
                <span className="text-[11px] text-blue font-medium bg-white px-2 py-0.5 rounded-md border border-blue/20">
                  {getAvailabilityLabel(profile?.availability)}
                </span>
              </div>

              {loadingProfile ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                  <Loader2 size={13} className="animate-spin text-blue" />
                  Chargement de vos informations de profil...
                </div>
              ) : (
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="font-semibold text-slate-900">
                    {profile?.first_name || user?.first_name || 'Candidat'} {profile?.last_name || user?.last_name || ''}
                    <span className="font-normal text-slate-500 ml-2">({user?.email})</span>
                  </div>

                  {profile?.headline && (
                    <p className="text-slate-600 italic">« {profile.headline} »</p>
                  )}

                  {skills.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-1">
                      <span className="text-[11px] text-slate-500 font-medium">Compétences :</span>
                      {skills.slice(0, 5).map((s) => (
                        <span key={s.id} className="bg-white text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded text-[11px]">
                          {s.skill_name}
                        </span>
                      ))}
                      {skills.length > 5 && (
                        <span className="text-[11px] text-slate-500">+{skills.length - 5}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Impossible d'envoyer la candidature</p>
                  <p>{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="coverLetter" className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                Message d'accompagnement / Lettre de motivation
              </label>
              <textarea
                id="coverLetter"
                rows={5}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Présentez brièvement votre motivation, vos compétences clés pour ce poste et vos disponibilités..."
                className="w-full text-sm border border-slate-300 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-blue focus:border-blue placeholder:text-slate-400 transition-all outline-hidden resize-y"
                maxLength={5000}
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-slate-500">
                  <Sparkles size={12} className="text-blue" />
                  Conseil : personnalisez votre message pour attirer l'attention du recruteur.
                </span>
                <span>{coverLetter.length} / 5000</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cvUrl" className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                Lien vers votre Curriculum Vitae (CV) ou Portfolio en ligne
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <FileText size={15} />
                </div>
                <input
                  id="cvUrl"
                  type="url"
                  value={cvUrl}
                  onChange={(e) => setCvUrl(e.target.value)}
                  placeholder="https://mon-portfolio.fr/cv.pdf ou lien Google Drive / LinkedIn"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue focus:border-blue placeholder:text-slate-400 transition-all outline-hidden"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Ce lien sera accessible directement par le recruteur pour consulter votre CV complet.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                icon={submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              >
                {submitting ? 'Transmission en cours...' : 'Envoyer ma candidature'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
