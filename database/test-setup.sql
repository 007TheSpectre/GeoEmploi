BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS geolocation_enabled BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chk_job_offers_status' AND table_name = 'job_offers'
  ) THEN
    ALTER TABLE job_offers DROP CONSTRAINT chk_job_offers_status;
    ALTER TABLE job_offers ADD CONSTRAINT chk_job_offers_status CHECK (status IN ('draft', 'pending_moderation', 'active', 'rejected', 'expired', 'closed', 'archived'));
  END IF;
END $$;

INSERT INTO users (email, password_hash, role)
VALUES ('admin@test.local', '$argon2id$v=19$m=65536,p=4,t=3$C2w920RurHZDZpnBTrf5bQ$fpW34O53p20cO+fYqDFs4l77HO7+TcQX6NDComcApQU', 'employer')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO admins (user_id, full_name)
SELECT id, 'Administrateur e2e'
FROM users
WHERE email = 'admin@test.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO employer_profiles (user_id, company_name, siret, sector, description, verification_status)
SELECT id, 'Entreprise e2e', '99999999999999', 'Informatique', 'Compte technique utilisé par les tests e2e.', 'verified'
FROM users
WHERE email = 'admin@test.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO job_offers (employer_id, title, description, contract_type, commune_code, departement_code, postal_code, latitude, longitude, broadcast_radius_km, status, published_at, expires_at)
SELECT ep.id, 'Développeur Full-Stack React/Node', 'Offre technique créée pour les tests e2e.', 'CDI', '75056', '75', '75011', 48.8566, 2.3522, 50, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '60 days'
FROM employer_profiles ep
JOIN users u ON u.id = ep.user_id
WHERE u.email = 'admin@test.local'
  AND NOT EXISTS (
    SELECT 1 FROM job_offers jo
    WHERE jo.employer_id = ep.id AND jo.title = 'Développeur Full-Stack React/Node'
  );

COMMIT;
