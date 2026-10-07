import { describe, it, expect } from 'vitest';

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('GET /api/health', () => {
  it('should return 200 with status ok', async () => {
    const res = await fetch(`${API_URL}/api/health`);

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('timestamp');
  });
});
