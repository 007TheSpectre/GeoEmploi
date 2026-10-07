-- ============================================================
-- JEU DE DONNÉES DE DÉMONSTRATION — GeoEmploi
-- Injecté manuellement par `./scripts/seed.sh` (pas d'auto-seed).
--
-- Reproduit l'ancien seed : un compte admin, un employeur vérifié,
-- un candidat et des offres géolocalisées (dont une en attente de
-- modération pour tester le flux admin).
--
-- Idempotent côté script : `seed.sh` s'arrête si le compte admin
-- existe déjà. Ne s'exécute que sur une base démarrable
-- (schéma présent via `database/init/`).
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- Compte administrateur
-- ------------------------------------------------------------
INSERT INTO users (email, password_hash, role)
VALUES ('admin@geoemploi.fr', '$argon2id$v=19$m=65536,p=4,t=3$8P3Ei8GLpcXP/58Qc8fKdQ$QS0tNb8P/xR95FTLEJLpXpTsiSsL34XBOuXAJwHm6tk', 'employer');

INSERT INTO admins (user_id, full_name)
SELECT id, 'Administrateur GeoEmploi'
FROM users
WHERE email = 'admin@geoemploi.fr';

-- ------------------------------------------------------------
-- Employeur vérifié
-- ------------------------------------------------------------
INSERT INTO users (email, password_hash, role)
VALUES ('employeur@geoemploi.fr', '$argon2id$v=19$m=65536,p=4,t=3$U75jpAYEm50ZEyPuDmf0SA$5uN41E59O548GW27jS3gDUc9Vk/DC7bux085I/ILOY0', 'employer');

INSERT INTO employer_profiles
    (user_id, company_name, siret, sector, description, phone,
     commune_code, departement_code, postal_code,
     latitude, longitude, verification_status)
SELECT id, 'Tech Emploi France', '12345678901234', 'Informatique',
       'Entreprise de services numériques et de recrutement.',
       '01 23 45 67 89', '75056', '75', '75002',
       48.8698, 2.3314, 'verified'
FROM users
WHERE email = 'employeur@geoemploi.fr';

-- ------------------------------------------------------------
-- Candidat
-- ------------------------------------------------------------
INSERT INTO users (email, password_hash, role)
VALUES ('candidat@geoemploi.fr', '$argon2id$v=19$m=65536,p=4,t=3$eHqCZpn2EJtnc43Z8zS4FQ$2pFn6xYfCK1nqhyUlUBDG5IqNwU101VFgAH5X9bapoU', 'candidate');

INSERT INTO candidate_profiles
    (user_id, first_name, last_name, headline, bio, phone, availability,
     search_radius_km, commune_code, departement_code, postal_code,
     latitude, longitude)
SELECT id, 'Camille', 'Durand', 'Développeuse Full-Stack',
       'Développeuse web passionnée, 3 ans d''expérience.',
       '06 12 34 56 78', 'immediate', 50, '75056', '75', '75011',
       48.8566, 2.3522
FROM users
WHERE email = 'candidat@geoemploi.fr';

-- ------------------------------------------------------------
-- Offres (rattachées à l'employeur de démonstration)
-- ------------------------------------------------------------
INSERT INTO job_offers
    (employer_id, title, description, contract_type, salary_min, salary_max,
     commune_code, departement_code, postal_code, latitude, longitude,
     broadcast_radius_km, status, published_at, expires_at)
SELECT
    (SELECT ep.id
     FROM employer_profiles ep
     JOIN users u ON u.id = ep.user_id
     WHERE u.email = 'employeur@geoemploi.fr'),
    v.title, v.description, v.contract_type, v.salary_min, v.salary_max,
    v.commune_code, v.departement_code, v.postal_code, v.latitude, v.longitude,
    50, v.status,
    CASE WHEN v.status = 'active' THEN CURRENT_TIMESTAMP ELSE NULL END,
    CURRENT_TIMESTAMP + INTERVAL '60 days'
FROM (VALUES
    ('Développeur FullStack React & Node.js',
     'Conception et développement d''applications web pour les services citoyens de la Métropole Européenne de Lille.',
     'CDI', 42000, 50000, '59350', '59', '59000', 50.6333, 3.0667, 'active'),
    ('Graphiste & Designer UI/UX',
     'Création d''identités visuelles, supports de communication et maquettes d''interfaces web et mobiles pour le pôle communication.',
     'CDI', 35000, 42000, '59350', '59', '59800', 50.6250, 3.0500, 'active'),
    ('Développeur Full-Stack React/Node',
     'Rejoignez une équipe produit agile. Missions : développement de fonctionnalités web, API REST, amélioration continue.',
     'CDI', 42000, 52000, '75056', '75', '75011', 48.8566, 2.3522, 'active'),
    ('Infirmier de nuit en CDI',
     'Recherche d''un(e) infirmier(ère) pour un service de médecine générale. Horaires de nuit, prime incluse.',
     'CDI', 28000, 34000, '69123', '69', '69003', 45.7640, 4.8357, 'active'),
    ('Ingénieur DevOps',
     'Automatisation CI/CD, infrastructure cloud, conteneurisation. Télétravail partiel possible.',
     'CDD', 45000, 58000, '13055', '13', '13001', 43.2965, 5.3698, 'active'),
    ('Commercial terrain itinérant',
     'Développement d''un portefeuille client sur le Grand Est. Véhicule de fonction fourni.',
     'CDI', 30000, 38000, '59350', '59', '59000', 50.6292, 3.0573, 'active'),
    ('Technicien support informatique',
     'Support niveau 1 et 2, installation de postes, gestion des incidents. Formation assurée.',
     'alternance', 18000, 22000, '33063', '33', '33000', 44.8378, -0.5792, 'active'),
    ('Responsable de magasin (stage possible)',
     'Gestion d''une équipe de 8 personnes, atteinte des objectifs de vente, gestion des stocks.',
     'stage', 20000, 26000, '54395', '54', '54000', 48.6921, 6.1844, 'pending_moderation'),
    ('Développeur Web Symfony',
     'Conception et maintenance d''applications web PHP/Symfony. Environnement stimulant, télétravail hybride.',
     'CDI', 38000, 46000, '31555', '31', '31000', 43.6047, 1.4442, 'active'),
    ('Ingénieur mécanique navale',
     'Études et suivi de chantier naval sur la façade atlantique. Anglais technique apprécié.',
     'CDI', 40000, 50000, '44109', '44', '44000', 47.2184, -1.5536, 'active'),
    ('Assistant RH polyvalent',
     'Gestion administrative du personnel, recrutement et paie. Parfait pour une première expérience en RH.',
     'alternance', 15000, 19000, '67482', '67', '67000', 48.5734, 7.7521, 'active'),
    ('Data Analyst',
     'Exploitation des données clients, tableaux de bord et dataviz. Stack SQL/Python/Power BI.',
     'CDD', 35000, 42000, '35238', '35', '35000', 48.1173, -1.6778, 'active'),
    ('Serveur / serveuse expérimenté',
     'Poste en CDI dans un restaurant gastronomique. Expérience exigée, pourboires importants.',
     'CDI', 21000, 26000, '34172', '34', '34000', 43.6108, 3.8767, 'active'),
    ('Comptable confirmé',
     'Tenue de dossiers clients en cabinet, bilans et liasses fiscales. Logiciels EBP/CIEL.',
     'CDI', 32000, 40000, '06088', '06', '06000', 43.7102, 7.262, 'active'),
    ('Technicien de maintenance alpine',
     'Maintenance des remontées mécaniques et du domaine skiable. Hiver + été.',
     'CDD', 24000, 30000, '38185', '38', '38000', 45.1885, 5.7245, 'active'),
    ('Chef de projet industriel',
     'Pilotage de projets d''industrialisation dans l''agroalimentaire. Déplacements régionaux.',
     'CDI', 45000, 55000, '21231', '21', '21000', 47.322, 5.0415, 'active'),
    ('Développeur mobile Flutter',
     'Développement d''applications iOS/Android en Flutter pour un éditeur logiciel.',
     'freelance', 400, 600, '76540', '76', '76000', 49.4431, 1.0993, 'active'),
    ('Assistant de direction',
     'Assistanat de direction bilingue français/anglais, organisation des agendas et événements.',
     'CDI', 28000, 34000, '37261', '37', '37000', 47.3941, 0.6848, 'active'),
    ('Conducteur de ligne portuaire',
     'Conduite d''engins portuaires et manutention sur le terminal. Formation CACES assurée.',
     'interim', 26000, 32000, '76351', '76', '76600', 49.4944, 0.1079, 'active'),
    ('Éducateur sportif',
     'Animation d''activités sportives et encadrement de groupes en club municipal.',
     'CDD', 22000, 27000, '66136', '66', '66000', 42.6987, 2.8958, 'active'),
    ('Ingénieur systèmes et réseaux',
     'Administration des systèmes Linux et supervision du parc. NOC 24/7, astreintes.',
     'CDI', 42000, 50000, '63113', '63', '63000', 45.7772, 3.087, 'active'),
    ('Conseiller clientèle bancaire',
     'Accueil et conseil des particuliers en agence. Profil commercial recherché.',
     'CDI', 26000, 32000, '57463', '57', '57000', 49.1193, 6.1757, 'active')
) AS v(title, description, contract_type, salary_min, salary_max,
       commune_code, departement_code, postal_code, latitude, longitude, status);

-- ------------------------------------------------------------
-- Tags des offres
-- ------------------------------------------------------------
INSERT INTO job_offer_tags (job_id, tag)
SELECT o.id, t.tag
FROM job_offers o
JOIN employer_profiles ep ON ep.id = o.employer_id
JOIN users u ON u.id = ep.user_id AND u.email = 'employeur@geoemploi.fr'
JOIN (VALUES
    ('Développeur FullStack React & Node.js', 'react'),
    ('Développeur FullStack React & Node.js', 'node'),
    ('Développeur FullStack React & Node.js', 'fullstack'),
    ('Développeur FullStack React & Node.js', 'javascript'),
    ('Graphiste & Designer UI/UX', 'design'),
    ('Graphiste & Designer UI/UX', 'graphisme'),
    ('Graphiste & Designer UI/UX', 'ui/ux'),
    ('Graphiste & Designer UI/UX', 'figma'),
    ('Développeur Full-Stack React/Node', 'react'),
    ('Développeur Full-Stack React/Node', 'node'),
    ('Développeur Full-Stack React/Node', 'javascript'),
    ('Infirmier de nuit en CDI', 'sante'),
    ('Infirmier de nuit en CDI', 'nuit'),
    ('Ingénieur DevOps', 'devops'),
    ('Ingénieur DevOps', 'kubernetes'),
    ('Ingénieur DevOps', 'cloud'),
    ('Commercial terrain itinérant', 'commercial'),
    ('Commercial terrain itinérant', 'itineraire'),
    ('Technicien support informatique', 'support'),
    ('Technicien support informatique', 'it'),
    ('Responsable de magasin (stage possible)', 'commerce'),
    ('Responsable de magasin (stage possible)', 'management'),
    ('Développeur Web Symfony', 'php'),
    ('Développeur Web Symfony', 'symfony'),
    ('Développeur Web Symfony', 'web'),
    ('Ingénieur mécanique navale', 'mecanique'),
    ('Ingénieur mécanique navale', 'naval'),
    ('Ingénieur mécanique navale', 'ingenierie'),
    ('Assistant RH polyvalent', 'rh'),
    ('Assistant RH polyvalent', 'administration'),
    ('Assistant RH polyvalent', 'paie'),
    ('Data Analyst', 'data'),
    ('Data Analyst', 'sql'),
    ('Data Analyst', 'python'),
    ('Serveur / serveuse expérimenté', 'restauration'),
    ('Serveur / serveuse expérimenté', 'service'),
    ('Comptable confirmé', 'comptabilite'),
    ('Comptable confirmé', 'fiscal'),
    ('Technicien de maintenance alpine', 'maintenance'),
    ('Technicien de maintenance alpine', 'montagne'),
    ('Chef de projet industriel', 'projet'),
    ('Chef de projet industriel', 'industrie'),
    ('Développeur mobile Flutter', 'mobile'),
    ('Développeur mobile Flutter', 'flutter'),
    ('Développeur mobile Flutter', 'dart'),
    ('Assistant de direction', 'assistanat'),
    ('Assistant de direction', 'direction'),
    ('Assistant de direction', 'bilingue'),
    ('Conducteur de ligne portuaire', 'logistique'),
    ('Conducteur de ligne portuaire', 'port'),
    ('Conducteur de ligne portuaire', 'caces'),
    ('Éducateur sportif', 'sport'),
    ('Éducateur sportif', 'animation'),
    ('Ingénieur systèmes et réseaux', 'linux'),
    ('Ingénieur systèmes et réseaux', 'reseaux'),
    ('Ingénieur systèmes et réseaux', 'devops'),
    ('Conseiller clientèle bancaire', 'banque'),
    ('Conseiller clientèle bancaire', 'conseil'),
    ('Conseiller clientèle bancaire', 'commercial')
) AS t(title, tag) ON t.title = o.title;

COMMIT;
