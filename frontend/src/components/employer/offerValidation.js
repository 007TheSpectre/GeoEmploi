export const CONTRACT_OPTIONS = [
  { value: 'CDI', label: 'CDI — Contrat à Durée Indéterminée' },
  { value: 'CDD', label: 'CDD — Contrat à Durée Déterminée' },
  { value: 'interim', label: 'Intérim' },
  { value: 'alternance', label: 'Alternance / Apprentissage' },
  { value: 'stage', label: 'Stage' },
  { value: 'freelance', label: 'Freelance / Indépendant' },
  { value: 'autre', label: 'Autre' },
];

export const INITIAL_FORM_STATE = {
  title: '',
  contract_type: 'CDI',
  description: '',
  salary_min: '',
  salary_max: '',
  experience_years: '',
  broadcast_radius_km: '50',
  expires_at: '',
  tags: '',
  postal_code: '',
  city: '',
  commune_code: '',
  departement_code: '',
  latitude: '',
  longitude: '',
};

export const validateOfferField = (name, value, allValues = {}) => {
  if (name === 'experience_years' && value !== '') {
    const exp = Number(value);
    if (Number.isNaN(exp) || !Number.isInteger(exp) || exp < 0 || exp > 60) {
      return "L'expérience doit être un nombre entier compris entre 0 et 60 ans.";
    }
  }
  if (name === 'broadcast_radius_km' && value !== '') {
    const radius = Number(value);
    if (Number.isNaN(radius) || radius < 1 || radius > 500) {
      return 'Le rayon de diffusion doit être compris entre 1 et 500 km.';
    }
  }
  if (name === 'salary_min' && value !== '') {
    const minVal = Number(value);
    if (minVal < 0)
      return 'Le salaire minimum ne peut pas être négatif.';
    if (minVal > 10000000)
      return 'Le salaire ne peut pas dépasser 10 000 000 €.';
    if (allValues.salary_max && minVal > Number(allValues.salary_max)) {
      return 'Le salaire minimum ne peut pas dépasser le salaire maximum.';
    }
  }
  if (name === 'salary_max' && value !== '') {
    const maxVal = Number(value);
    if (maxVal < 0)
      return 'Le salaire maximum ne peut pas être négatif.';
    if (maxVal > 10000000)
      return 'Le salaire ne peut pas dépasser 10 000 000 €.';
    if (allValues.salary_min && maxVal < Number(allValues.salary_min)) {
      return 'Le salaire maximum doit être supérieur ou égal au salaire minimum.';
    }
  }
  return null;
};

export const validateOfferForm = (values) => {
  const errors = {};
  if (!values.title?.trim())
    errors.title = "Le titre de l'offre est obligatoire.";
  else if (values.title.trim().length > 255) 
    errors.title = "Le titre ne doit pas dépasser 255 caractères.";

  if (!values.contract_type)
    errors.contract_type = "Le type de contrat est obligatoire.";

  if (!values.description?.trim())
    errors.description = "La description de l'offre est obligatoire.";
  else if (values.description.trim().length > 10000)
    errors.description = "La description ne doit pas dépasser 10 000 caractères.";

  const expErr = validateOfferField('experience_years', values.experience_years);
  if (expErr)
    errors.experience_years = expErr;

  const minErr = validateOfferField('salary_min', values.salary_min, values);
  if (minErr)
    errors.salary_min = minErr;

  const maxErr = validateOfferField('salary_max', values.salary_max, values);
  if (maxErr)
    errors.salary_max = maxErr;

  const radiusErr = validateOfferField('broadcast_radius_km', values.broadcast_radius_km);
  if (radiusErr)
    errors.broadcast_radius_km = radiusErr;

  if (values.expires_at) {
    const expDate = new Date(values.expires_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(expDate.getTime()) || expDate < today) {
      errors.expires_at = "La date d'expiration ne peut pas être dans le passé.";
    }
  }

  if (values.tags?.trim()) {
    const tags = values.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tags.some((t) => t.length > 100)) {
      errors.tags = "Chaque mot-clé / tag doit comporter 100 caractères au maximum.";
    }
  }

  if (!values.city?.trim() && !values.postal_code?.trim() && (!values.latitude || !values.longitude)) {
    errors.city = "Veuillez renseigner la commune ou l'arrondissement pour localiser l'offre.";
  }

  if (values.latitude !== '' && (Number(values.latitude) < -90 || Number(values.latitude) > 90)) {
    errors.latitude = "La latitude doit être comprise entre -90 et 90.";
  }
  if (values.longitude !== '' && (Number(values.longitude) < -180 || Number(values.longitude) > 180)) {
    errors.longitude = "La longitude doit être comprise entre -180 et 180.";
  }

  return errors;
};

export const buildOfferPayload = (formData, currentCoords) => {
  const payload = {
    title: formData.title.trim(),
    contract_type: formData.contract_type,
    description: formData.description.trim(),
  };

  if (formData.salary_min)
    payload.salary_min = parseInt(formData.salary_min, 10);
  if (formData.salary_max)
    payload.salary_max = parseInt(formData.salary_max, 10);
  if (formData.experience_years !== '')
    payload.experience_years = parseInt(formData.experience_years, 10);
  if (formData.broadcast_radius_km)
    payload.broadcast_radius_km = parseInt(formData.broadcast_radius_km, 10);
  if (formData.expires_at) {
    payload.expires_at = formData.expires_at.length === 10
      ? new Date(`${formData.expires_at}T23:59:59`).toISOString()
      : formData.expires_at;
  }

  if (formData.city?.trim())
    payload.city = formData.city.trim();
  if (formData.postal_code?.trim())
    payload.postal_code = formData.postal_code.trim();
  if (currentCoords.commune)
    payload.commune_code = currentCoords.commune;
  if (currentCoords.dept)
    payload.departement_code = currentCoords.dept;

  if (currentCoords.lat !== '' && currentCoords.lng !== '') {
    payload.latitude = parseFloat(currentCoords.lat);
    payload.longitude = parseFloat(currentCoords.lng);
  }

  if (formData.tags.trim()) {
    payload.tags = Array.from(
      new Set(formData.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))
    );
  }

  return payload;
};
