import { describe, it, expect } from 'vitest';
import { api, registerAndLogin, verifyEmployer } from './helpers.js';

describe('GET /api/offers (recherche publique sans compte)', () => {
  it('renvoie les offres actives sans authentification', async () => {
    const res = await api('GET', '/api/offers');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const offer of res.body.data) {
      expect(offer.status).toBeUndefined();
      expect(offer).toHaveProperty('title');
      expect(offer).toHaveProperty('latitude');
      expect(offer).toHaveProperty('longitude');
    }
  });

  it('filtre par mot-clé', async () => {
    const res = await api('GET', '/api/offers?keyword=DevOps');
    expect(res.status).toBe(200);
    for (const offer of res.body.data) {
      expect(offer.title + offer.description).toMatch(/devops/i);
    }
  });

  it('filtre par type de contrat', async () => {
    const res = await api('GET', '/api/offers?contract_type=CDI');
    expect(res.status).toBe(200);
    for (const offer of res.body.data) {
      expect(offer.contract_type).toBe('CDI');
    }
  });

  it('rejette un contract_type invalide', async () => {
    const res = await api('GET', '/api/offers?contract_type=INVALID');
    expect(res.status).toBe(400);
  });

  it('filtre par rayon autour d’un point', async () => {
    const res = await api('GET', '/api/offers?lat=48.8566&lng=2.3522&radius=10');
    expect(res.status).toBe(200);
    for (const offer of res.body.data) {
      const dLat = (offer.latitude - 48.8566) * 111;
      const dLng = (offer.longitude - 2.3522) * 111 * Math.cos((48.8566 * Math.PI) / 180);
      expect(Math.sqrt(dLat * dLat + dLng * dLng)).toBeLessThanOrEqual(10);
    }
  });
});

describe('GET /api/offers/:id (détail + vues)', () => {
  it('renvoie le détail d’une offre active et incrémente les vues', async () => {
    const list = await api('GET', '/api/offers');
    const offer = list.body.data[0];

    const detail = await api('GET', `/api/offers/${offer.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body).toHaveProperty('company_name');
    expect(Array.isArray(detail.body.tags)).toBe(true);
  });

  it('renvoie 404 pour une offre inexistante', async () => {
    const res = await api('GET', '/api/offers/999999999');
    expect(res.status).toBe(404);
  });

  it('ne renvoie pas une offre en attente de modération', async () => {
    const employer = await registerAndLogin('employer');
    await verifyEmployer(employer.user.email, 'Password123!');

    const pending = await api('POST', '/api/employer/offers', {
      token: employer.token,
      body: {
        title: 'Bibliothécaire territorial',
        description: 'Ne doit pas être visible publiquement.',
        contract_type: 'CDD',
        latitude: 45.0,
        longitude: 3.0,
      },
    });
    expect(pending.status).toBe(201);
    expect(pending.body.status).toBe('pending_moderation');

    const publicView = await api('GET', `/api/offers/${pending.body.id}`);
    expect(publicView.status).toBe(404);

    await api('DELETE', `/api/employer/offers/${pending.body.id}`, { token: employer.token });
  });
});

