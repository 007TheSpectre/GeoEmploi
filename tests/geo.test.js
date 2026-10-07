import { describe, it, expect } from 'vitest';
import { api, API_URL } from './helpers.js';

describe('POST /api/geo/geocode (géocodage BAN)', () => {
  it('exige une adresse (q)', async () => {
    const res = await api('POST', '/api/geo/geocode', { body: {} });
    expect(res.status).toBe(400);
  });

  it('rejette un q trop court', async () => {
    const res = await api('POST', '/api/geo/geocode', { body: { q: 'a' } });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/geo/reverse (géocodage inverse)', () => {
  it('exige latitude et longitude', async () => {
    const missing = await api('POST', '/api/geo/reverse', { body: { latitude: 48.8 } });
    expect(missing.status).toBe(400);
  });

  it('valide les bornes des coordonnées', async () => {
    const res = await api('POST', '/api/geo/reverse', {
      body: { latitude: 95, longitude: 200 },
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/geo/tiles/:z/:x/:y.png (proxy et cache tuiles WMTS IGN)', () => {
  it('rejette des coordonnées invalides ou négatives', async () => {
    const res = await api('GET', '/api/geo/tiles/-1/0/0.png');
    expect(res.status).toBe(400);
  });

  it('rejette un niveau de zoom trop élevé', async () => {
    const res = await api('GET', '/api/geo/tiles/99/0/0.png');
    expect(res.status).toBe(400);
  });

  it('récupère une tuile valide avec cache (MISS puis HIT)', async () => {
    const firstReq = await fetch(`${API_URL}/api/geo/tiles/6/32/22.png`);
    expect(firstReq.status).toBe(200);
    expect(firstReq.headers.get('content-type')).toContain('image/png');
    const firstCache = firstReq.headers.get('x-cache');
    expect(firstCache).toBeDefined();

    const secondReq = await fetch(`${API_URL}/api/geo/tiles/6/32/22.png`);
    expect(secondReq.status).toBe(200);
    expect(secondReq.headers.get('x-cache')).toMatch(/^HIT_/);
  });
});

