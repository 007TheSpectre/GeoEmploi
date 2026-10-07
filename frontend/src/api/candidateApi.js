import { apiFetch } from './apiClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const fetchCandidateProfile = async (token) => {
  const res = await apiFetch(`${API_BASE_URL}/candidate/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Erreur lors du chargement du profil candidat.');
  }

  return data;
};

export const updateCandidateProfile = async (token, profileData) => {
  const res = await apiFetch(`${API_BASE_URL}/candidate/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Erreur lors de la mise à jour du profil.');
  }

  return data;
};

export const fetchCandidateSkills = async (token) => {
  const res = await apiFetch(`${API_BASE_URL}/candidate/skills`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ([]));
  if (!res.ok) {
    throw new Error(data.error || 'Erreur lors du chargement des compétences.');
  }

  return Array.isArray(data) ? data : [];
};

export const addCandidateSkill = async (token, { skill_name, level }) => {
  const res = await apiFetch(`${API_BASE_URL}/candidate/skills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      skill_name: skill_name.trim(),
      level: level ? Number(level) : undefined,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Erreur lors de l\'ajout de la compétence.');
  }

  return data;
};

export const removeCandidateSkill = async (token, skillId) => {
  const res = await apiFetch(`${API_BASE_URL}/candidate/skills/${skillId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erreur lors de la suppression de la compétence.');
  }

  return true;
};

export const fetchCandidateExperiences = async (token) => {
  const res = await apiFetch(`${API_BASE_URL}/candidate/experiences`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ([]));
  if (!res.ok) {
    throw new Error(data.error || 'Erreur lors du chargement des expériences.');
  }

  return Array.isArray(data) ? data : [];
};

export const addCandidateExperience = async (token, experienceData) => {
  const res = await apiFetch(`${API_BASE_URL}/candidate/experiences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(experienceData),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Erreur lors de l\'ajout de l\'expérience.');
  }

  return data;
};

export const removeCandidateExperience = async (token, experienceId) => {
  const res = await apiFetch(`${API_BASE_URL}/candidate/experiences/${experienceId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erreur lors de la suppression de l\'expérience.');
  }

  return true;
};
