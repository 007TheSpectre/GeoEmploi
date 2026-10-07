import rateLimit from 'express-rate-limit';

function readLimit(name, fallback) {
  const raw = process.env[name];
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function make({ windowMs, limit, message, skip }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: message },
    skip,
  });
}

const MINUTE = 60 * 1000;

export const apiLimiter = make({
  windowMs: MINUTE,
  limit: readLimit('RATE_LIMIT_API', 600),
  message: 'Trop de requêtes : réessayez dans une minute.',
});

export const authLimiter = make({
  windowMs: 15 * MINUTE,
  limit: readLimit('RATE_LIMIT_AUTH', 2000),
  message: 'Trop de tentatives d\'authentification : réessayez plus tard.',
});

export const geoLimiter = make({
  windowMs: MINUTE,
  limit: readLimit('RATE_LIMIT_GEO', 120),
  message: 'Trop de requêtes de géocodage : réessayez dans une minute.',
  skip: (req) => req.path.startsWith('/tiles'),
});

