const SIRENE_TOKEN = process.env.SIRENE_TOKEN;
const SIRENE_BASE  = 'https://api.insee.fr/entreprises/sirene/V3.11';
const GOUV_BASE    = 'https://recherche-entreprises.api.gouv.fr';

/**
 * Nettoie un SIRET brut (retire espaces / tirets) et valide le format.
 * @param {string} raw
 * @returns {{ cleaned: string, error: string|null }}
 */
export function normalizeSiret(raw) {
  const cleaned = String(raw).replace(/[\s\-\.]/g, '');
  if (!/^\d{14}$/.test(cleaned)) {
    return { cleaned, error: 'Le numéro SIRET doit comporter exactement 14 chiffres.' };
  }
  return { cleaned, error: null };
}

/**
 * Vérifie la clé de contrôle SIRET via l'algorithme de Luhn.
 * @param {string} siret  14 chiffres nettoyés
 * @returns {boolean}
 */
export function luhnCheck(siret) {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let d = parseInt(siret[i], 10);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9)
        d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/**
 * Construit un objet établissement normalisé à partir d'une réponse INSEE.
 * @param {object} etab  etablissement de la réponse SIRENE V3
 */
function fromInsee(etab) {
  const u = etab.uniteLegale || {};
  const adresse = etab.adresseEtablissement || {};

  const denominationSociale = u.denominationUniteLegale || [u.prenom1UniteLegale, u.nomUniteLegale].filter(Boolean).join(' ') || null;
  const voie = [adresse.numeroVoieEtablissement, adresse.typeVoieEtablissement, adresse.libelleVoieEtablissement,].filter(Boolean).join(' ') || null;

  return {
    siret: etab.siret,
    siren: etab.siren,
    company_name: denominationSociale,
    sector: u.activitePrincipaleUniteLegale || null,         
    sector_label: u.nomenclatureActivitePrincipaleUniteLegale || null,
    postal_code: adresse.codePostalEtablissement || null,
    commune: adresse.libelleCommuneEtablissement || null,
    commune_code: adresse.codeCommuneEtablissement || null,
    active: etab.etatAdministratifEtablissement === 'A',
    legal_form: u.categorieJuridiqueUniteLegale || null,
    creation_date: etab.dateCreationEtablissement || null,
    employee_range: etab.trancheEffectifsEtablissement || null,
    source: 'insee',
  };
}

/**
 * Construit un objet établissement normalisé à partir de l'API data.gouv.fr.
 * @param {object} result  résultat de recherche-entreprises
 */
function fromDataGouv(result) {
  const etab = (result.matching_etablissements || [])[0] || {};
  return {
    siret: etab.siret || null,
    siren: result.siren || null,
    company_name: result.nom_complet || result.nom_raison_sociale || null,
    sector: result.activite_principale || null,
    sector_label: result.libelle_activite_principale || null,
    postal_code: etab.code_postal || null,
    commune: etab.libelle_commune || null,
    commune_code: etab.commune || null,
    active: result.etat_administratif === 'A',
    legal_form: result.nature_juridique || null,
    creation_date: result.date_creation || null,
    employee_range: result.tranche_effectif_salarie || null,
    source: 'data.gouv',
  };
}

async function fetchFromInsee(siret) {
  const url = `${SIRENE_BASE}/siret/${siret}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${SIRENE_TOKEN}`,
      Accept: 'application/json',
    },
  });

  if (res.status === 404)
    return null;           
  if (res.status === 403)
    throw new Error('INSEE: token invalide ou quota dépassé');
  if (!res.ok)
    throw new Error(`INSEE: erreur ${res.status}`);

  const data = await res.json();
  return fromInsee(data.etablissement);
}

async function fetchFromDataGouv(siret) {
  const url = `${GOUV_BASE}/search?q=${siret}&page=1&per_page=1`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!res.ok)
    throw new Error(`data.gouv.fr: erreur ${res.status}`);

  const data = await res.json();
  const result = (data.results || [])[0];
  if (!result)
    return null;
  const etab = (result.matching_etablissements || []).find((e) => e.siret === siret);
  if (!etab)
    return null;

  return fromDataGouv({ ...result, matching_etablissements: [etab] });
}

/**
 * Vérifie un numéro SIRET et retourne les informations de l'établissement.
 *
 * @param {string} rawSiret  numéro brut (espaces tolérés)
 * @returns {Promise<{ valid: boolean, luhn: boolean, etablissement: object|null, error: string|null }>}
 */
export async function verifySiret(rawSiret) {
  const { cleaned, error: formatError } = normalizeSiret(rawSiret);

  if (formatError) {
    return { valid: false, luhn: false, etablissement: null, error: formatError };
  }

  const luhn = luhnCheck(cleaned);
  if (!luhn) {
    return {
      valid: false,
      luhn: false,
      etablissement: null,
      error: 'Numéro SIRET invalide (clé de contrôle incorrecte).',
    };
  }

  try {
    let etablissement = null;

    if (SIRENE_TOKEN) {
      etablissement = await fetchFromInsee(cleaned);
    }

    if (!etablissement) {
      etablissement = await fetchFromDataGouv(cleaned);
    }

    if (!etablissement) {
      return {
        valid: false,
        luhn: true,
        etablissement: null,
        error: 'Aucun établissement trouvé pour ce numéro SIRET dans le répertoire SIRENE.',
      };
    }

    if (!etablissement.active) {
      return {
        valid: false,
        luhn: true,
        etablissement,
        error: 'Cet établissement est fermé (état administratif : inactif).',
      };
    }

    return { valid: true, luhn: true, etablissement, error: null };
  } catch (err) {
    return {
      valid: true,
      luhn: true,
      etablissement: null,
      error: null,
      warning: `Vérification SIRENE indisponible temporairement (${err.message}). Format SIRET correct.`,
    };
  }
}
