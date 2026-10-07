import { apiFetch } from './apiClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const applyToJobApi = async (token, { job_id, cover_letter, cv_url }) => {
  const res = await apiFetch(`${API_BASE_URL}/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      job_id: Number(job_id),
      cover_letter: cover_letter ? cover_letter.trim() : undefined,
      cv_url: cv_url ? cv_url.trim() : undefined,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Impossible d\'envoyer votre candidature.');
  }

  return data;
};

export const fetchMyApplicationsApi = async (token) => {
  const res = await apiFetch(`${API_BASE_URL}/applications/my-applications`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ([]));
  if (!res.ok) {
    throw new Error(data.error || 'Erreur lors de la récupération de vos candidatures.');
  }

  return Array.isArray(data) ? data : [];
};

export const fetchOfferApplicationsApi = async (token, offerId) => {
  const res = await apiFetch(`${API_BASE_URL}/employer/offers/${offerId}/applications`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ([]));
  if (!res.ok) {
    throw new Error(data.error || 'Impossible de charger les candidatures pour cette offre.');
  }

  return Array.isArray(data) ? data : [];
};
export const updateApplicationStatusApi = async (token, applicationId, { status, note }) => {
  const res = await apiFetch(`${API_BASE_URL}/employer/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      status,
      note: note ? note.trim() : undefined,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Erreur lors de la mise à jour du statut de la candidature.');
  }

  return data;
};
