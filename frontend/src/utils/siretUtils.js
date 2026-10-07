/**
 * Algorithme de Luhn pour valider le format d'un SIRET (14 chiffres)
 */
export const isValidSiret = (siretStr) => {
  const cleaned = siretStr.replace(/\s+/g, '');
  if (!/^\d{14}$/.test(cleaned)) {
    return { valid: false, message: 'Le numéro SIRET doit comporter exactement 14 chiffres.' };
  }

  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(cleaned.charAt(i), 10);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9)
        digit -= 9;
    }
    sum += digit;
  }

  if (sum % 10 === 0) {
    return { valid: true, message: 'Numéro SIRET valide (format conforme au répertoire SIRENE).' };
  } else {
    return { valid: false, message: 'Numéro SIRET invalide (clé de contrôle incorrecte).' };
  }
};
