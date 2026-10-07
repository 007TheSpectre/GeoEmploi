import { apiFetch } from './apiClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const fetchAdminOffers = async (token, params = {}) => {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'ALL')
    query.set('status', params.status);
  if (params.page)
    query.set('page', String(params.page));
  if (params.limit)
    query.set('limit', String(params.limit));

  const res = await apiFetch(`${API_BASE_URL}/admin/offers?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erreur lors du chargement des offres');
  }

  return await res.json();
};

export const moderateOfferApi = async (token, offerId, { action, reason }) => {
  const res = await apiFetch(`${API_BASE_URL}/admin/offers/${offerId}/moderate`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, reason }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Erreur lors de la modération de l\'offre');
  }

  return data;
};

export const fetchAdminMetrics = async (token) => {
  const res = await apiFetch(`${API_BASE_URL}/admin/metrics`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erreur lors du chargement des statistiques');
  }

  return await res.json();
};

export const fetchAdminUsers = async (token, params = {}) => {
  const query = new URLSearchParams();
  if (params.role && params.role !== 'ALL')
    query.set('role', params.role);
  if (params.status && params.status !== 'ALL')
    query.set('status', params.status);
  if (params.search)
    query.set('search', params.search);
  if (params.page)
    query.set('page', String(params.page));
  if (params.limit)
    query.set('limit', String(params.limit));

  const res = await apiFetch(`${API_BASE_URL}/admin/users?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Erreur lors du chargement des utilisateurs');
  }

  return data;
};

export const updateUserStatusApi = async (token, userId, { status, reason }) => {
  const res = await apiFetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, reason }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Erreur lors de la mise à jour du statut utilisateur');
  }

  return data;
};

export const moderateEmployerVerificationApi = async (token, employerId, { status, reason }) => {
  const res = await apiFetch(`${API_BASE_URL}/admin/employers/${employerId}/verification`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, reason }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Erreur lors de la modération de la vérification employeur');
  }

  return data;
};

