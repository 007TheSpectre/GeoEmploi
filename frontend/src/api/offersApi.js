import { apiFetch } from './apiClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const fetchActiveOffers = async (params = {}) => {
  const query = new URLSearchParams();
  query.set('limit', String(params.limit || 100));
  Object.entries(params).forEach(([key, value]) => {
    if (key !== 'limit' && value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  });

  const res = await fetch(`${API_BASE_URL}/offers?${query.toString()}`);
  if (!res.ok)
    throw new Error('Erreur lors du chargement des offres');

  const body = await res.json();
  return body.data || [];
};

export const fetchEmployerOffers = async (token) => {
  const res = await apiFetch(`${API_BASE_URL}/employer/offers`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erreur lors de la récupération de vos offres');
  }
  return await res.json();
};

export const fetchEmployerDashboard = async (token) => {
  const res = await apiFetch(`${API_BASE_URL}/employer/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erreur lors du chargement du tableau de bord');
  }
  return await res.json();
};

export const createEmployerOffer = async (offerData, token) => {
  const res = await apiFetch(`${API_BASE_URL}/employer/offers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(offerData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Erreur lors de la création de l\'offre d\'emploi');
    err.details = data.details;
    throw err;
  }
  return data;
};

export const deleteEmployerOffer = async (id, token) => {
  const res = await apiFetch(`${API_BASE_URL}/employer/offers/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erreur lors de la suppression de l\'offre');
  }
  return true;
};

export const updateEmployerOffer = async (id, offerData, token) => {
  const res = await apiFetch(`${API_BASE_URL}/employer/offers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(offerData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Erreur lors de la mise à jour de l\'offre');
    err.details = data.details;
    throw err;
  }
  return data;
};

export const fetchSavedOffersApi = async (token) => {
  const res = await apiFetch(`${API_BASE_URL}/candidate/saved-offers`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Erreur lors du chargement des offres favorites');
  }
  const body = await res.json();
  return body.data || [];
};

export const saveOfferApi = async (jobId, token) => {
  const res = await apiFetch(`${API_BASE_URL}/candidate/saved-offers/${jobId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Erreur lors de l\'enregistrement de l\'offre');
  }
  return await res.json();
};

export const unsaveOfferApi = async (jobId, token) => {
  const res = await apiFetch(`${API_BASE_URL}/candidate/saved-offers/${jobId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok && res.status !== 204) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Erreur lors du retrait des favoris');
  }
  return true;
};

