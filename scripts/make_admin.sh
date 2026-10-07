#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: $0 <email_utilisateur>"
  echo "Exemple: $0 admin@geoemploi.fr"
  exit 1
fi

EMAIL=$1
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Passage du compte '$EMAIL' en administrateur..."

SQL_QUERY="
DO \$\$
DECLARE
    v_user_id INT;
BEGIN
    SELECT id INTO v_user_id FROM users WHERE email = '$EMAIL';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur avec email % non trouvé', '$EMAIL';
    END IF;
    
    IF EXISTS (SELECT 1 FROM admins WHERE user_id = v_user_id) THEN
        RAISE NOTICE 'L''utilisateur est déjà administrateur.';
    ELSE
        INSERT INTO admins (user_id, full_name) VALUES (v_user_id, 'Administrateur ajouté via script');
        RAISE NOTICE 'Utilisateur ajouté avec succès en tant qu''administrateur.';
    END IF;
END \$\$;
"

cd "$PROJECT_DIR"
docker compose exec -T database psql -U geoemploi -d geoemploi -c "$SQL_QUERY"

if [ $? -eq 0 ]; then
  echo "Opération terminée avec succès."
else
  echo "Erreur lors de l'exécution de la requête. Assurez-vous que le conteneur 'database' tourne."
  exit 1
fi
