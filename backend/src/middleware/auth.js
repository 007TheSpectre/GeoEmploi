import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/errors.js';
import { query } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_ISSUER = process.env.JWT_ISSUER;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE;
const JWT_ALGORITHM = process.env.JWT_ALGORITHM;

export function signToken(userId, role) {
  return jwt.sign(
    { sub: userId, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, issuer: JWT_ISSUER, audience: JWT_AUDIENCE, algorithm: JWT_ALGORITHM },
  );
}

export async function getAdminRole(userId) {
  const res = await query('SELECT 1 FROM admins WHERE user_id = $1', [userId]);
  return res.rowCount > 0;
}

function readBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return null;
  return header.slice(7);
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET, {
    algorithms: [JWT_ALGORITHM],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

export async function authenticate(req, _res, next) {
  const token = readBearerToken(req);
  if (!token) {
    return next(new ApiError(401, 'Token manquant'));
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (_err) {
    return next(new ApiError(401, 'Token invalide ou expiré'));
  }

  const userRes = await query('SELECT id, role, status FROM users WHERE id = $1', [payload.sub]);
  const user = userRes.rows[0];
  if (!user || user.status === 'deleted') {
    return next(new ApiError(401, 'Token invalide ou expiré'));
  }
  if (user.status === 'suspended') {
    return next(new ApiError(403, 'Compte suspendu'));
  }

  const isAdmin = await getAdminRole(user.id);
  const effectiveRole = isAdmin ? 'admin' : user.role;

  req.user = { id: user.id, role: effectiveRole, status: user.status, isAdmin };
  return next();
}

export async function optionalAuth(req, _res, next) {
  const token = readBearerToken(req);
  if (!token)
    return next();
  try {
    const payload = verifyToken(token);
    const isAdmin = await getAdminRole(payload.sub);
    const effectiveRole = isAdmin ? 'admin' : payload.role;
    req.user = { id: payload.sub, role: effectiveRole, isAdmin };
  } catch (_err) {
  }
  return next();
}

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Accès refusé'));
  }
  return next();
};
