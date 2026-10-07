import { describe, it, expect } from 'vitest';
import { api, registerAndLogin, verifyEmployer, createActiveOffer } from './helpers.js';

async function setupOfferAndCandidate() {
  const employer = await registerAndLogin('employer');
  await verifyEmployer(employer.user.email, 'Password123!');
  const offer = await createActiveOffer(employer.token);

  const candidate = await registerAndLogin('candidate');
  return { employer, candidate, offer };
}

describe('POST /api/applications', () => {
  it('candidater à une offre active', async () => {
    const { candidate, offer } = await setupOfferAndCandidate();

    const res = await api('POST', '/api/applications', {
      token: candidate.token,
      body: { job_id: offer.id, cover_letter: 'Je suis motivé(e).' },
    });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('sent');
  });

  it('refuse une candidature en doublon', async () => {
    const { candidate, offer } = await setupOfferAndCandidate();

    await api('POST', '/api/applications', { token: candidate.token, body: { job_id: offer.id } });
    const second = await api('POST', '/api/applications', {
      token: candidate.token,
      body: { job_id: offer.id },
    });
    expect(second.status).toBe(409);
  });

  it('refuse une candidature sur une offre en attente', async () => {
    const employer = await registerAndLogin('employer');
    await verifyEmployer(employer.user.email, 'Password123!');

    const pending = await api('POST', '/api/employer/offers', {
      token: employer.token,
      body: {
        title: 'Chargé de mission développement durable',
        description: 'Coordination d\'actions environnementales sur le territoire.',
        contract_type: 'CDI',
        latitude: 48.0,
        longitude: 2.0,
      },
    });
    expect(pending.status).toBe(201);

    const candidate = await registerAndLogin('candidate');
    const res = await api('POST', '/api/applications', {
      token: candidate.token,
      body: { job_id: pending.body.id },
    });
    expect(res.status).toBe(409);
  });

  it('refuse sans authentification', async () => {
    const res = await api('POST', '/api/applications', { body: { job_id: 1 } });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/applications/my-applications', () => {
  it('liste les candidatures du candidat avec le détail de l’offre', async () => {
    const { candidate, offer } = await setupOfferAndCandidate();
    await api('POST', '/api/applications', { token: candidate.token, body: { job_id: offer.id } });

    const res = await api('GET', '/api/applications/my-applications', { token: candidate.token });
    expect(res.status).toBe(200);
    expect(res.body.some((a) => a.job_id === offer.id)).toBe(true);
    expect(res.body.find((a) => a.job_id === offer.id)).toHaveProperty('offer_title');
  });
});

describe('Suivi candidature côté employeur', () => {
  it('l’employeur voit la candidature et change son statut', async () => {
    const { employer, candidate, offer } = await setupOfferAndCandidate();
    const app = await api('POST', '/api/applications', {
      token: candidate.token,
      body: { job_id: offer.id },
    });
    expect(app.status).toBe(201);

    const apps = await api('GET', `/api/employer/offers/${offer.id}/applications`, { token: employer.token });
    expect(apps.status).toBe(200);
    expect(apps.body.length).toBeGreaterThan(0);

    const status = await api('PATCH', `/api/employer/applications/${app.body.id}/status`, {
      token: employer.token,
      body: { status: 'shortlisted', note: 'Bon profil' },
    });
    expect(status.status).toBe(200);
    expect(status.body.status).toBe('shortlisted');

    const notifications = await api('GET', '/api/notifications', { token: candidate.token });
    expect(notifications.status).toBe(200);
    expect(notifications.body.data.some((n) => n.type === 'application_status_change')).toBe(true);

    const read = await api('PATCH', `/api/notifications/${notifications.body.data[0].id}/read`, { token: candidate.token });
    expect(read.status).toBe(200);
    expect(read.body.is_read).toBe(true);
  });

  it('l’employeur reçoit une notification à chaque candidature', async () => {
    const { employer, candidate, offer } = await setupOfferAndCandidate();
    await api('POST', '/api/applications', { token: candidate.token, body: { job_id: offer.id } });

    const notifs = await api('GET', '/api/notifications', { token: employer.token });
    expect(notifs.status).toBe(200);
    expect(notifs.body.data.some((n) => n.type === 'new_application')).toBe(true);
  });

  it('refuse le changement de statut par un autre employeur', async () => {
    const { employer, candidate, offer } = await setupOfferAndCandidate();
    const app = await api('POST', '/api/applications', { token: candidate.token, body: { job_id: offer.id } });

    const other = await registerAndLogin('employer');
    const res = await api('PATCH', `/api/employer/applications/${app.body.id}/status`, {
      token: other.token,
      body: { status: 'rejected' },
    });
    expect(res.status).toBe(403);
  });

  it('transmission complète du profil (compétences, expériences, disponibilité) et décision employeur (acceptée, refusée)', async () => {
    const { employer, candidate, offer } = await setupOfferAndCandidate();

    await api('PUT', '/api/candidate/profile', {
      token: candidate.token,
      body: {
        headline: 'Développeur Full-Stack Passionné',
        bio: 'Expérimenté en Node.js et React.',
        phone: '0612345678',
        availability: 'immediate',
        cv_url: 'https://cv.exemple.fr/mon-cv.pdf',
      },
    });

    await api('POST', '/api/candidate/skills', {
      token: candidate.token,
      body: { skill_name: 'PostgreSQL', level: 5 },
    });
    await api('POST', '/api/candidate/experiences', {
      token: candidate.token,
      body: {
        company_name: 'Tech SAS',
        job_title: 'Lead Developer',
        started_at: '2023-01-01',
        is_current: true,
      },
    });

    const appRes = await api('POST', '/api/applications', {
      token: candidate.token,
      body: {
        job_id: offer.id,
        cover_letter: 'Je souhaite rejoindre votre équipe avec mon expertise PostgreSQL.',
      },
    });
    expect(appRes.status).toBe(201);
    expect(appRes.body.cv_url).toBe('https://cv.exemple.fr/mon-cv.pdf');

    const listRes = await api('GET', `/api/employer/offers/${offer.id}/applications`, {
      token: employer.token,
    });
    expect(listRes.status).toBe(200);
    const applicant = listRes.body.find((a) => a.id === appRes.body.id);
    expect(applicant).toBeDefined();
    expect(applicant.headline).toBe('Développeur Full-Stack Passionné');
    expect(applicant.availability).toBe('immediate');
    expect(applicant.phone).toBe('0612345678');
    expect(applicant.cv_url).toBe('https://cv.exemple.fr/mon-cv.pdf');
    expect(applicant.skills.some((s) => s.skill_name === 'PostgreSQL')).toBe(true);
    expect(applicant.experiences.some((e) => e.company_name === 'Tech SAS')).toBe(true);

    const acceptRes = await api('PATCH', `/api/employer/applications/${appRes.body.id}/status`, {
      token: employer.token,
      body: { status: 'accepted', note: 'Excellente candidature retenue' },
    });
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.status).toBe('accepted');

    const myApps = await api('GET', '/api/applications/my-applications', {
      token: candidate.token,
    });
    expect(myApps.status).toBe(200);
    const myApp = myApps.body.find((a) => a.id === appRes.body.id);
    expect(myApp.status).toBe('accepted');
  });
});
