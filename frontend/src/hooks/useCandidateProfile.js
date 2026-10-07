import { useState, useEffect, useCallback } from 'react';
import {
  fetchCandidateProfile,
  fetchCandidateSkills,
  fetchCandidateExperiences,
} from '../api/candidateApi';

const DEFAULT_PROFILE = {
  headline: '',
  bio: '',
  phone: '',
  cv_url: '',
  availability: 'immediate',
  desired_salary_min: '',
};

const normalizeProfile = (prof) => {
  if (!prof)
    return DEFAULT_PROFILE;
  return {
    ...DEFAULT_PROFILE,
    ...prof,
    headline: prof.headline || '',
    bio: prof.bio || '',
    phone: prof.phone || '',
    cv_url: prof.cv_url || '',
    availability: prof.availability || 'immediate',
    desired_salary_min: prof.desired_salary_min ?? '',
  };
};

export const useCandidateProfile = (token, { enabled = true, loadExperiences = true } = {}) => {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [skills, setSkills] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(Boolean(token && enabled));
  const [error, setError] = useState(null);

  const fetchAllData = useCallback(async () => {
    if (!token) {
      return { prof: null, sks: [], exps: [] };
    }

    const promises = [
      fetchCandidateProfile(token).catch(() => null),
      fetchCandidateSkills(token).catch(() => []),
    ];

    if (loadExperiences) {
      promises.push(fetchCandidateExperiences(token).catch(() => []));
    }

    const [prof, sks, exps] = await Promise.all(promises);
    return { prof, sks, exps: exps || [] };
  }, [token, loadExperiences]);

  const reloadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { prof, sks, exps } = await fetchAllData();
      if (prof) {
        setProfile((prev) => ({ ...prev, ...normalizeProfile(prof) }));
      }
      setSkills(Array.isArray(sks) ? sks : []);
      if (loadExperiences) {
        setExperiences(Array.isArray(exps) ? exps : []);
      }
      setLoading(false);
    } catch (err) {
      setError(err?.message || 'Erreur lors du rechargement du profil.');
      setLoading(false);
    }
  }, [fetchAllData, loadExperiences]);

  useEffect(() => {
    if (!enabled || !token) return;

    let ignore = false;

    Promise.resolve().then(async () => {
      if (ignore) {
        return;
      }
      try {
        const { prof, sks, exps } = await fetchAllData();
        if (!ignore) {
          if (prof) {
            setProfile((prev) => ({ ...prev, ...normalizeProfile(prof) }));
          }
          setSkills(Array.isArray(sks) ? sks : []);
          if (loadExperiences) {
            setExperiences(Array.isArray(exps) ? exps : []);
          }
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err?.message || 'Erreur lors de la récupération des données.');
          setLoading(false);
        }
      }
    });

    return () => {
      ignore = true;
    };
  }, [enabled, token, fetchAllData, loadExperiences]);

  return {
    profile,
    setProfile,
    skills,
    setSkills,
    experiences,
    setExperiences,
    loading,
    error,
    reloadProfile,
  };
};
