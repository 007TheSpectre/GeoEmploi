import { describe, it, expect } from 'vitest';
import { api, login, register, registerUser, registerAndLogin, adminToken, verifyEmployer, createActiveOffer } from './helpers.js';

describe('GET /api/admin/metrics', () => {
  it('renvoie les métriques nationales pour un admin', async () => {
    const token = await adminToken();
    const res = await api('GET', '/api/admin/metrics', { token });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('job_offers');
    expect(res.body).toHaveProperty('users');
    expect(res.body).toHaveProperty('applications');
    expect(res.body).toHaveProperty('pending_reports');
  });

  it('refuse l’accès à un non-admin', async () => {
    const candidate = await registerAndLogin('candidate');
    const res = await api('GET', '/api/admin/metrics', { token: candidate.token });
    expect(res.status).toBe(403);
  });
});

describe('Gestion des utilisateurs', () => {
  it('liste les utilisateurs avec filtres', async () => {
    const token = await adminToken();
    const res = await api('GET', '/api/admin/users?role=candidate', { token });
    expect(res.status).toBe(200);
    expect(res.body.pagination).toBeDefined();
    for (const user of res.body.data) {
      expect(user.role).toBe('candidate');
    }
  });

  it('suspend puis réactive un compte', async () => {
    const user = await registerUser('candidate');
    const token = await adminToken();

    const suspend = await api('PATCH', `/api/admin/users/${user.id}/status`, {
      token,
      body: { status: 'suspended', reason: 'Comportement inapproprié' },
    });
    expect(suspend.status).toBe(200);
    expect(suspend.body.status).toBe('suspended');

    const relogin = await login(user.email, 'Password123!');
    expect(relogin.status).toBe(403);

    const activate = await api('PATCH', `/api/admin/users/${user.id}/status`, {
      token,
      body: { status: 'active' },
    });
    expect(activate.status).toBe(200);
    expect(activate.body.status).toBe('active');
  });

  it('recherche un utilisateur par nom ou raison sociale', async () => {
    const employer = await registerAndLogin('employer', { company_name: 'SuperEntrepriseRecherche' });
    const token = await adminToken();

    const res = await api('GET', '/api/admin/users?search=SuperEntrepriseRecherche', { token });
    expect(res.status).toBe(200);
    expect(res.body.data.some((u) => u.company_name === 'SuperEntrepriseRecherche')).toBe(true);
  });
});

describe('Modération des offres', () => {
  it('approuve une offre en attente via l’admin', async () => {
    const employer = await registerAndLogin('employer');
    await verifyEmployer(employer.user.email, 'Password123!');

    const pending = await api('POST', '/api/employer/offers', {
      token: employer.token,
      body: {
        title: 'Développeur front-end',
        description: 'Création d\'interfaces web accessibles pour le service numérique.',
        contract_type: 'CDI',
        latitude: 48.0,
        longitude: 2.0,
      },
    });
    expect(pending.body.status).toBe('pending_moderation');

    const token = await adminToken();
    const queue = await api('GET', '/api/admin/offers?status=pending_moderation', { token });
    expect(queue.status).toBe(200);
    expect(queue.body.data.some((o) => o.id === pending.body.id)).toBe(true);

    const listed = queue.body.data.find((o) => o.id === pending.body.id);
    expect(listed.lambert93_x).toBeCloseTo(625422, -2);
    expect(listed.lambert93_y).toBeCloseTo(6767096, -2);

    const approve = await api('PATCH', `/api/admin/offers/${pending.body.id}/moderate`, {
      token,
      body: { action: 'approve' },
    });
    expect(approve.status).toBe(200);
    expect(approve.body.status).toBe('active');
    expect(approve.body.published_at).toBeTruthy();
  });

  it('rejette une offre avec motif', async () => {
    const employer = await registerAndLogin('employer');
    await verifyEmployer(employer.user.email, 'Password123!');

    const pending = await api('POST', '/api/employer/offers', {
      token: employer.token,
      body: {
        title: 'Agent d\'accueil municipal',
        description: 'Accueil du public et renseignements administratifs.',
        contract_type: 'CDI',
        latitude: 48.0,
        longitude: 2.0,
      },
    });

    const token = await adminToken();
    const reject = await api('PATCH', `/api/admin/offers/${pending.body.id}/moderate`, {
      token,
      body: { action: 'reject', reason: 'Annonce non conforme' },
    });
    expect(reject.status).toBe(200);
    expect(reject.body.status).toBe('rejected');
    expect(reject.body.rejected_reason).toBe('Annonce non conforme');

    const publicView = await api('GET', `/api/offers/${pending.body.id}`);
    expect(publicView.status).toBe(404);
  });
});

describe('Signalements', () => {
  it('signale une offre puis l’admin la traite', async () => {
    const employer = await registerAndLogin('employer');
    await verifyEmployer(employer.user.email, 'Password123!');
    const offer = await createActiveOffer(employer.token);

    const report = await api('POST', '/api/reports', {
      body: { offer_id: offer.id, reason: 'fraud', details: 'Annonce suspecte' },
    });
    expect(report.status).toBe(201);
    expect(report.body.status).toBe('pending');

    const token = await adminToken();
    const list = await api('GET', '/api/admin/reports?status=pending', { token });
    expect(list.status).toBe(200);
    expect(list.body.data.some((r) => r.id === report.body.id)).toBe(true);

    const resolve = await api('PATCH', `/api/admin/reports/${report.body.id}/status`, {
      token,
      body: { status: 'resolved' },
    });
    expect(resolve.status).toBe(200);
    expect(resolve.body.status).toBe('resolved');
  });

  it('rejette un signalement sans raison valide', async () => {
    const employer = await registerAndLogin('employer');
    await verifyEmployer(employer.user.email, 'Password123!');
    const offer = await createActiveOffer(employer.token);

    const res = await api('POST', '/api/reports', {
      body: { offer_id: offer.id, reason: 'nimportequoi' },
    });
    expect(res.status).toBe(400);
  });
});
