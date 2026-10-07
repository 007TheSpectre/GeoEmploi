import { apiFetch } from './apiClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const checkSiretApi = async (siret) => {
  const cleaned = siret.replace(/[\s\-\.]/g, '');
  const res = await fetch(`${API_BASE_URL}/auth/siret/${cleaned}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Erreur lors de la vérification du SIRET');
  }

  return data;
};

export const registerUserApi = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Échec de l\'inscription');
  }

  return data;
};

export const loginUserApi = async (credentials) => {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Échec de la connexion');
  }

  return data;
};

export const fetchUserStatsApi = async (token) => {
  const res = await apiFetch(`${API_BASE_URL}/users/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Impossible de récupérer les statistiques');
  }

  return data;
};

export const exportUserDataApi = async (token) => {
  const res = await apiFetch(`${API_BASE_URL}/users/me/export`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Impossible d'exporter les données");
  }

  return await res.blob();
};

export const downloadUserExport = async (token, userEmail) => {
  const blob = await exportUserDataApi(token);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanEmail = (userEmail || 'compte').replace(/[^a-zA-Z0-9@._-]/g, '_');
  a.download = `donnees-geoemploi-${cleanEmail}-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const updateUserPreferencesApi = async (token, preferences) => {
  const res = await apiFetch(`${API_BASE_URL}/users/me/preferences`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(preferences),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Erreur lors de la mise à jour des préférences');
  }

  return data;
};

export const deleteUserAccountApi = async (token, password) => {
  const res = await apiFetch(`${API_BASE_URL}/users/me`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erreur lors de la suppression du compte');
  }

  return true;
};

