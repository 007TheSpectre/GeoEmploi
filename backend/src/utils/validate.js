import { ApiError } from './errors.js';

const rules = {
  required: (value, param) => {
    if (value === undefined || value === null || value === '') {
      return `${param} est requis`;
    }
    return null;
  },
  string: (value, param, { min = 1, max = 255 } = {}) => {
    if (value === undefined || value === null)
      return null;
    if (typeof value !== 'string')
      return `${param} doit être une chaîne`;
    if (value.length < min)
      return `${param} doit contenir au moins ${min} caractère(s)`;
    if (value.length > max)
      return `${param} doit contenir au plus ${max} caractère(s)`;
    return null;
  },
  email: (value, param) => {
    if (value === undefined || value === null)
      return null;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof value !== 'string' || !re.test(value))
      return `${param} n'est pas un email valide`;
    return null;
  },
  int: (value, param, { min, max } = {}) => {
    if (value === undefined || value === null || value === '')
      return null;
    const num = Number(value);
    if (!Number.isInteger(num))
      return `${param} doit être un entier`;
    if (min !== undefined && num < min)
      return `${param} doit être >= ${min}`;
    if (max !== undefined && num > max)
      return `${param} doit être <= ${max}`;
    return null;
  },
  number: (value, param, { min, max } = {}) => {
    if (value === undefined || value === null || value === '')
      return null;
    const num = Number(value);
    if (Number.isNaN(num))
      return `${param} doit être un nombre`;
    if (min !== undefined && num < min)
      return `${param} doit être >= ${min}`;
    if (max !== undefined && num > max)
      return `${param} doit être <= ${max}`;
    return null;
  },
  oneOf: (value, param, { values } = {}) => {
    if (value === undefined || value === null || value === '')
      return null;
    if (!values.includes(value))
      return `${param} doit être une des valeurs: ${values.join(', ')}`;
    return null;
  },
  boolean: (value, param) => {
    if (value === undefined || value === null)
      return null;
    if (typeof value !== 'boolean')
      return `${param} doit être un booléen`;
    return null;
  },
  date: (value, param) => {
    if (value === undefined || value === null || value === '')
      return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime()))
      return `${param} doit être une date valide`;
    return null;
  },
};

export function validate(body, schema) {
  const errors = {};
  for (const [field, specs] of Object.entries(schema)) {
    const { type, ...opts } = specs;
    const value = body[field];
    if (opts.required) {
      const err = rules.required(value, field);
      if (err)
        errors[field] = err;
    }
    const fn = rules[type];
    if (fn && !errors[field]) {
      const err = fn(value, field, opts);
      if (err)
        errors[field] = err;
    }
  }
  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation échouée', errors);
  }
}

export function validateQuery(queryParams, schema) {
  validate(queryParams, schema);
}
