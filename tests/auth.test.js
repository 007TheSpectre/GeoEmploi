import { describe, it, expect } from 'vitest';
import { api, register, registerUser, login, verifyEmployer, createActiveOffer } from './helpers.js';

describe('POST /api/auth/register', () => {
  it('inscrit un candidat avec profil', async () => {
    const res = await register('candidate', {
      first_name: 'Camille',
      last_name: 'Durand',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('candidate');
  });

  it('inscrit un employeur avec profil', async () => {
    const res = await register('employer', { company_name: 'Ma Boite' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('employer');
  });

  it('rejette un email invalide', async () => {
    const res = await register('candidate', { email: 'pas-un-email' });
    expect(res.status).toBe(400);
  });

  it('rejette un mot de passe trop court', async () => {
    const res = await register('candidate', { password: 'short' });
    expect(res.status).toBe(400);
  });

  it('rejette un doublon de email', async () => {
    const reg = await register('candidate');
    expect(reg.status).toBe(201);
    const second = await api('POST', '/api/auth/register', {
      body: {
        email: reg.body.user.email,
        password: 'Password123!',
        role: 'candidate',
        first_name: 'Autre',
        last_name: 'Personne',
      },
    });
    expect(second.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('connecte et renvoie un token + rôle', async () => {
    const user = await registerUser('candidate');
    const res = await login(user.email, 'Password123!');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('candidate');
  });

  it('rejette un mauvais mot de passe', async () => {
    const user = await registerUser('candidate');
    const res = await login(user.email, 'Mauvais!123');
    expect(res.status).toBe(401);
  });

  it('connecte l’admin seed avec le rôle admin', async () => {
    const res = await login('admin@test.local', 'Admin123!');
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');
    expect(res.body.token).toBeTruthy();
  });
});

describe('GET /api/users/me', () => {
  it('renvoie le profil de l’utilisateur connecté', async () => {
    const user = await registerUser('candidate');
    const token = (await login(user.email, 'Password123!')).body.token;
    const res = await api('GET', '/api/users/me', { token });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.profile).toHaveProperty('first_name');
  });

  it('refuse sans token', async () => {
    const res = await api('GET', '/api/users/me');
    expect(res.status).toBe(401);
  });
});


describe('DELETE /api/users/me (RGPD)', () => {
  it('supprime et anonymise le compte', async () => {
    const user = await registerUser('candidate');
    const token = (await login(user.email, 'Password123!')).body.token;

    const del = await api('DELETE', '/api/users/me', { token });
    expect(del.status).toBe(204);

    const relogin = await login(user.email, 'Password123!');
    expect(relogin.status).toBe(401);
  });

  it('rejette un mauvais mot de passe lors de la suppression', async () => {
    const user = await registerUser('candidate');
    const token = (await login(user.email, 'Password123!')).body.token;

    const del = await api('DELETE', '/api/users/me', {
      token,
      body: { password: 'MauvaisPassword!' },
    });
    expect(del.status).toBe(401);
  });
});

describe('GET /api/users/me/export (RGPD Art. 20)', () => {
  it('exporte les données du compte candidat au format JSON', async () => {
    const user = await registerUser('candidate');
    const token = (await login(user.email, 'Password123!')).body.token;
    const res = await api('GET', '/api/users/me/export', { token });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('metadata');
    expect(res.body.metadata.role).toBe('candidate');
    expect(res.body).toHaveProperty('account');
    expect(res.body.account.email).toBe(user.email);
    expect(res.body).toHaveProperty('profile');
    expect(res.body).toHaveProperty('activities');
  });

  it('exporte les données du compte employeur au format JSON', async () => {
    const user = await registerUser('employer', {
      company_name: 'Tech Corp',
      latitude: 48.853,
      longitude: 2.3499,
    });
    const token = (await login(user.email, 'Password123!')).body.token;
    const res = await api('GET', '/api/users/me/export', { token });
    expect(res.status).toBe(200);
    expect(res.body.metadata.role).toBe('employer');
    expect(res.body.account.email).toBe(user.email);
    expect(res.body.profile.company_name).toBe('Tech Corp');
    expect(res.body).toHaveProperty('activities');
    expect(res.body.profile).toHaveProperty('latitude', 48.853);
    expect(res.body.profile).toHaveProperty('longitude', 2.3499);
    expect(res.body.profile.lambert93_x).toBe(652297);
    expect(res.body.profile.lambert93_y).toBe(6861636);
  });

  it('exporte les données du compte administrateur au format JSON', async () => {
    const token = (await login('admin@test.local', 'Admin123!')).body.token;
    const res = await api('GET', '/api/users/me/export', { token });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('metadata');
    expect(res.body.metadata.role).toBe('admin');
    expect(res.body).toHaveProperty('account');
    expect(res.body.account.email).toBe('admin@test.local');
    expect(res.body).toHaveProperty('profile');
    expect(res.body).toHaveProperty('activities');
  });

  it('refuse sans token', async () => {
    const res = await api('GET', '/api/users/me/export');
    expect(res.status).toBe(401);
  });

  it('inclut les coordonnées Lambert-93 dans les offres publiées exportées', async () => {
    const employer = await registerUser('employer', { company_name: 'Export Coord Corp' });
    const token = (await login(employer.email, 'Password123!')).body.token;
    await verifyEmployer(employer.email, 'Password123!');
    const offer = await createActiveOffer(token);

    const res = await api('GET', '/api/users/me/export', { token });
    expect(res.status).toBe(200);

    const published = res.body.activities.published_offers;
    expect(Array.isArray(published)).toBe(true);
    const exported = published.find((o) => o.id === offer.id);
    expect(exported).toBeDefined();
    expect(exported).toHaveProperty('latitude');
    expect(exported).toHaveProperty('longitude');
    expect(exported).toHaveProperty('lambert93_x');
    expect(exported).toHaveProperty('lambert93_y');
    expect(typeof exported.lambert93_x).toBe('number');
    expect(typeof exported.lambert93_y).toBe('number');
  });
});

describe('PATCH /api/users/me/preferences (RGPD géolocalisation)', () => {
  it('active puis désactive la géolocalisation avec succès', async () => {
    const user = await registerUser('candidate');
    const token = (await login(user.email, 'Password123!')).body.token;

    const enableRes = await api('PATCH', '/api/users/me/preferences', {
      token,
      body: { geolocation_enabled: true },
    });
    expect(enableRes.status).toBe(200);
    expect(enableRes.body.geolocation_enabled).toBe(true);

    const me1 = await api('GET', '/api/users/me', { token });
    expect(me1.body.user.geolocation_enabled).toBe(true);

    const disableRes = await api('PATCH', '/api/users/me/preferences', {
      token,
      body: { geolocation_enabled: false },
    });
    expect(disableRes.status).toBe(200);
    expect(disableRes.body.geolocation_enabled).toBe(false);

    const me2 = await api('GET', '/api/users/me', { token });
    expect(me2.body.user.geolocation_enabled).toBe(false);
  });

  it('refuse une valeur non booléenne', async () => {
    const user = await registerUser('candidate');
    const token = (await login(user.email, 'Password123!')).body.token;
    const res = await api('PATCH', '/api/users/me/preferences', {
      token,
      body: { geolocation_enabled: 'oui' },
    });
    expect(res.status).toBe(400);
  });
});

