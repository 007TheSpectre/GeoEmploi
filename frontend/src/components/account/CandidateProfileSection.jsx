import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  updateCandidateProfile,
  addCandidateSkill,
  removeCandidateSkill,
  addCandidateExperience,
  removeCandidateExperience,
} from '../../api/candidateApi';
import { useCandidateProfile } from '../../hooks';
import { CandidateGeneralProfileForm } from './CandidateGeneralProfileForm';
import { CandidateSkillsSection } from './CandidateSkillsSection';
import { CandidateExperiencesSection } from './CandidateExperiencesSection';
import { CandidateExperienceModal } from './CandidateExperienceModal';

export const CandidateProfileSection = ({ token }) => {
  const {
    profile,
    setProfile,
    skills,
    setSkills,
    experiences,
    setExperiences,
    loading,
  } = useCandidateProfile(token);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null);

  const [addingSkill, setAddingSkill] = useState(false);
  const [skillFeedback, setSkillFeedback] = useState(null);

  const [showExpModal, setShowExpModal] = useState(false);
  const [addingExp, setAddingExp] = useState(false);
  const [expFeedback, setExpFeedback] = useState(null);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileFeedback(null);

    try {
      const payload = {
        headline: profile.headline ? profile.headline.trim() || null : null,
        bio: profile.bio ? profile.bio.trim() || null : null,
        phone: profile.phone ? profile.phone.trim() || null : null,
        cv_url: profile.cv_url ? profile.cv_url.trim() || null : null,
        availability: profile.availability || 'immediate',
        desired_salary_min: profile.desired_salary_min ? Number(profile.desired_salary_min) : null,
      };

      const updated = await updateCandidateProfile(token, payload);
      setProfile((prev) => ({
        ...prev,
        ...updated,
        headline: updated.headline || '',
        bio: updated.bio || '',
        phone: updated.phone || '',
        cv_url: updated.cv_url || '',
        desired_salary_min: updated.desired_salary_min ?? '',
      }));
      setProfileFeedback({
        type: 'success',
        message: 'Votre profil professionnel a été mis à jour avec succès.',
      });
    } catch (err) {
      setProfileFeedback({
        type: 'error',
        message: err.message || 'Erreur lors de la mise à jour du profil.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddSkill = async (skillName, level) => {
    setAddingSkill(true);
    setSkillFeedback(null);

    try {
      const created = await addCandidateSkill(token, {
        skill_name: skillName,
        level,
      });
      setSkills((prev) => [...prev.filter((s) => s.id !== created.id), created]);
      setSkillFeedback({ type: 'success', message: 'Compétence ajoutée.' });
    } catch (err) {
      setSkillFeedback({ type: 'error', message: err.message || "Erreur lors de l'ajout." });
    } finally {
      setAddingSkill(false);
    }
  };

  const handleRemoveSkill = async (skillId) => {
    try {
      await removeCandidateSkill(token, skillId);
      setSkills((prev) => prev.filter((s) => s.id !== skillId));
    } catch (err) {
      setSkillFeedback({ type: 'error', message: err.message || 'Erreur lors de la suppression.' });
    }
  };

  const handleAddExperience = async (payload) => {
    setAddingExp(true);
    setExpFeedback(null);

    try {
      const created = await addCandidateExperience(token, payload);
      setExperiences((prev) => [created, ...prev]);
      setShowExpModal(false);
      return true;
    } catch (err) {
      setExpFeedback({ type: 'error', message: err.message || "Erreur lors de l'ajout de l'expérience." });
      return false;
    } finally {
      setAddingExp(false);
    }
  };

  const handleRemoveExperience = async (expId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette expérience ?')) return;

    try {
      await removeCandidateExperience(token, expId);
      setExperiences((prev) => prev.filter((e) => e.id !== expId));
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression.');
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue" />
        <p className="text-sm font-medium">Chargement de votre profil professionnel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <CandidateGeneralProfileForm
        profile={profile}
        setProfile={setProfile}
        saving={savingProfile}
        feedback={profileFeedback}
        onSubmit={handleSaveProfile}
      />

      <CandidateSkillsSection
        skills={skills}
        onAddSkill={handleAddSkill}
        onRemoveSkill={handleRemoveSkill}
        addingSkill={addingSkill}
        skillFeedback={skillFeedback}
      />

      <CandidateExperiencesSection
        experiences={experiences}
        onOpenAddModal={() => setShowExpModal(true)}
        onRemoveExperience={handleRemoveExperience}
      />

      <CandidateExperienceModal
        isOpen={showExpModal}
        onClose={() => setShowExpModal(false)}
        onSubmit={handleAddExperience}
        adding={addingExp}
        feedback={expFeedback}
      />
    </div>
  );
};
