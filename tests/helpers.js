export const API_URL = process.env.API_URL || 'http://localhost:3000';

export const ADMIN = { email: 'admin@test.local', password: 'Admin123!' };

export async function api(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token)
    headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, body: json };
}

export async function register(role, overrides = {}) {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const base = {
    email: `${role}_${suffix}@test.local`,
    password: 'Password123!',
    role,
  };
  if (role === 'candidate') {
    base.first_name = 'Test';
    base.last_name = 'User';
  } else {
    base.company_name = `Entreprise ${suffix}`;
  }
  return api('POST', '/api/auth/register', { body: { ...base, ...overrides } });
}

export async function login(email, password) {
  return api('POST', '/api/auth/login', { body: { email, password } });
}

export async function registerAndLogin(role, overrides = {}) {
  const reg = await register(role, overrides);
  if (reg.status !== 201)
    throw new Error(`register failed: ${JSON.stringify(reg.body)}`);
  return reg.body;
}

export async function registerUser(role, overrides = {}) {
  const reg = await register(role, overrides);
  if (reg.status !== 201)
    throw new Error(`register failed: ${JSON.stringify(reg.body)}`);
  return reg.body.user;
}

export async function adminToken() {
  const res = await login(ADMIN.email, ADMIN.password);
  if (res.status !== 200)
    throw new Error(`admin login failed: ${JSON.stringify(res.body)}`);
  return res.body.token;
}

export async function verifyEmployer(employerEmail, employerPassword) {
  const token = (await login(employerEmail, employerPassword)).body.token;
  const me = await api('GET', '/api/users/me', { token });
  const profile = me.body.profile;

  if (profile.verification_status !== 'verified') {
    if (profile.verification_status !== 'pending') {
      const siret = String(12345678000000 + Math.floor(Math.random() * 99999));
      const submit = await api('POST', '/api/employer/verification', {
        token,
        body: { siret },
      });
      if (submit.status !== 200)
        throw new Error(`submit verification failed: ${JSON.stringify(submit.body)}`);
    }

    const admin = await adminToken();
    const res = await api('PATCH', `/api/admin/employers/${profile.id}/verification`, {
      token: admin,
      body: { action: 'approve' },
    });
    if (res.status !== 200)
      throw new Error(`approve verification failed: ${JSON.stringify(res.body)}`);
  }

  return { profileId: profile.id, employerToken: token };
}

const OFFER_FIXTURES = [
  {
    title: 'Développeur Full-Stack React/Node',
    description: 'Développement de fonctionnalités web et d\'API REST pour une équipe produit agile.',
    contract_type: 'CDI',
    salary_min: 42000,
    salary_max: 52000,
    commune_code: '75056',
    departement_code: '75',
    postal_code: '75011',
    latitude: 48.8566,
    longitude: 2.3522,
    tags: ['react', 'node'],
  },
  {
    title: 'Infirmier en service de médecine',
    description: 'Soins en service de médecine générale, travail en équipe pluridisciplinaire.',
    contract_type: 'CDD',
    salary_min: 28000,
    salary_max: 34000,
    commune_code: '69123',
    departement_code: '69',
    postal_code: '69003',
    latitude: 45.764,
    longitude: 4.8357,
    tags: ['sante', 'soin'],
  },
  {
    title: 'Ingénieur DevOps Cloud',
    description: 'Automatisation CI/CD et gestion d\'infrastructure cloud conteneurisée.',
    contract_type: 'CDI',
    salary_min: 45000,
    salary_max: 58000,
    commune_code: '13055',
    departement_code: '13',
    postal_code: '13001',
    latitude: 43.2965,
    longitude: 5.3698,
    tags: ['devops', 'cloud'],
  },
  {
    title: 'Technicien support informatique',
    description: 'Support niveau 1 et 2, installation de postes et gestion des incidents.',
    contract_type: 'alternance',
    salary_min: 18000,
    salary_max: 22000,
    commune_code: '33063',
    departement_code: '33',
    postal_code: '33000',
    latitude: 44.8378,
    longitude: -0.5792,
    tags: ['support', 'informatique'],
  },
  {
    title: 'Commercial terrain',
    description: 'Développement d\'un portefeuille client sur le secteur, véhicule de fonction.',
    contract_type: 'CDI',
    salary_min: 30000,
    salary_max: 38000,
    commune_code: '59350',
    departement_code: '59',
    postal_code: '59000',
    latitude: 50.6292,
    longitude: 3.0573,
    tags: ['commercial'],
  },
  {
    title: 'Comptable confirmé en cabinet',
    description: 'Tenue de dossiers clients, bilans et liasses fiscales en cabinet comptable.',
    contract_type: 'CDI',
    salary_min: 32000,
    salary_max: 40000,
    commune_code: '44109',
    departement_code: '44',
    postal_code: '44000',
    latitude: 47.2184,
    longitude: -1.5536,
    tags: ['comptabilite'],
  },
];

let offerFixtureIndex = 0;

export async function createActiveOffer(employerToken) {
  const fixture = OFFER_FIXTURES[offerFixtureIndex % OFFER_FIXTURES.length];
  offerFixtureIndex += 1;

  const offer = await api('POST', '/api/employer/offers', {
    token: employerToken,
    body: {
      title: fixture.title,
      description: fixture.description,
      contract_type: fixture.contract_type,
      salary_min: fixture.salary_min,
      salary_max: fixture.salary_max,
      commune_code: fixture.commune_code,
      departement_code: fixture.departement_code,
      postal_code: fixture.postal_code,
      latitude: fixture.latitude,
      longitude: fixture.longitude,
      tags: fixture.tags,
      broadcast_radius_km: 50,
    },
  });
  if (offer.status !== 201)
    throw new Error(`create offer failed: ${JSON.stringify(offer.body)}`);

  const admin = await adminToken();
  const moderated = await api('PATCH', `/api/admin/offers/${offer.body.id}/moderate`, {
    token: admin,
    body: { action: 'approve' },
  });
  if (moderated.status !== 200)
    throw new Error(`moderate failed: ${JSON.stringify(moderated.body)}`);

  return offer.body;
}
