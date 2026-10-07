import { describe, it, expect } from 'vitest';
import { api, login, registerAndLogin, verifyEmployer } from './helpers.js';

describe('Profil employeur', () => {
  it('récupère et met à jour son profil', async () => {
    const employer = await registerAndLogin('employer');
    const profile = await api('GET', '/api/employer/profile', { token: employer.token });
    expect(profile.status).toBe(200);
    expect(profile.body.verification_status).toBe('unverified');

    const updated = await api('PUT', '/api/employer/profile', {
      token: employer.token,
      body: { sector: 'Industrie', description: 'Une belle entreprise.' },
    });
    expect(updated.status).toBe(200);
    expect(updated.body.sector).toBe('Industrie');
  });
});

describe('Vérification d’activité', () => {
  it('soumet une vérification avec SIRET puis est approuvé par l’admin', async () => {
    const employer = await registerAndLogin('employer');

    const submit = await api('POST', '/api/employer/verification', {
      token: employer.token,
      body: { siret: String(12345678000000 + Math.floor(Math.random() * 99999)) },
    });
    expect(submit.status).toBe(200);
    expect(submit.body.verification_status).toBe('pending');

    const verify = await verifyEmployer(employer.user.email, 'Password123!');
    expect(verify.employerToken).toBeTruthy();

    const profile = await api('GET', '/api/employer/profile', { token: employer.token });
    expect(profile.body.verification_status).toBe('verified');
  });

  it('exige un SIRET', async () => {
    const employer = await registerAndLogin('employer');
    const res = await api('POST', '/api/employer/verification', { token: employer.token, body: {} });
    expect(res.status).toBe(400);
  });
});

describe('Offres employeur', () => {
  it('refuse la création d’offre à un employeur non vérifié', async () => {
    const employer = await registerAndLogin('employer');
    const res = await api('POST', '/api/employer/offers', {
      token: employer.token,
      body: {
        title: 'Analyste cybersécurité',
        description: 'Surveillance des systèmes d\'information et réponse aux incidents.',
        contract_type: 'CDI',
        latitude: 48.0,
        longitude: 2.0,
      },
    });
    expect(res.status).toBe(403);
  });

  it('crée, liste et ferme une offre en tant qu’employeur vérifié', async () => {
    const employer = await registerAndLogin('employer');
    await verifyEmployer(employer.user.email, 'Password123!');

    const created = await api('POST', '/api/employer/offers', {
      token: employer.token,
      body: {
        title: 'Assistant de gestion administrative',
        description: 'Suivi des dossiers administratifs et appui au service comptable.',
        contract_type: 'CDI',
        salary_min: 30000,
        salary_max: 40000,
        latitude: 48.85,
        longitude: 2.35,
        tags: ['admin', 'gestion'],
      },
    });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('pending_moderation');

    const list = await api('GET', '/api/employer/offers', { token: employer.token });
    expect(list.status).toBe(200);
    expect(list.body.some((o) => o.id === created.body.id)).toBe(true);
    expect(list.body.find((o) => o.id === created.body.id).tags).toContain('gestion');

    const closed = await api('DELETE', `/api/employer/offers/${created.body.id}`, { token: employer.token });
    expect(closed.status).toBe(204);
  });

  it('ne modifie pas une offre qui n’est pas à soi', async () => {
    const a = await registerAndLogin('employer');
    const b = await registerAndLogin('employer');
    await verifyEmployer(a.user.email, 'Password123!');
    await verifyEmployer(b.user.email, 'Password123!');

    const offer = await api('POST', '/api/employer/offers', {
      token: a.token,
      body: {
        title: 'Responsable qualité',
        description: 'Appartient à A. Démarche qualité en industrie.',
        contract_type: 'CDI',
        latitude: 48.0,
        longitude: 2.0,
      },
    });
    expect(offer.status).toBe(201);

    const res = await api('DELETE', `/api/employer/offers/${offer.body.id}`, { token: b.token });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/employer/dashboard', () => {
  it('renvoie les métriques de l’employeur', async () => {
    const employer = await registerAndLogin('employer');
    await verifyEmployer(employer.user.email, 'Password123!');
    await api('POST', '/api/employer/offers', {
      token: employer.token,
      body: {
        title: 'Ingénieur travaux publics',
        description: 'Pilotage de chantiers d\'aménagement pour le tableau de bord.',
        contract_type: 'CDD',
        latitude: 44.0,
        longitude: 1.0,
      },
    });

    const dash = await api('GET', '/api/employer/dashboard', { token: employer.token });
    expect(dash.status).toBe(200);
    expect(dash.body).toHaveProperty('total_views');
    expect(dash.body).toHaveProperty('total_applications');
    expect(Array.isArray(dash.body.offers)).toBe(true);
  });
});
