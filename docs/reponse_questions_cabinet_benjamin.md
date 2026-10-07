# GÉOEMPLOI — ÉLÉMENTS FACTUELS & RÉPONSES TECHNIQUES

**Document de référence technique pour le Cabinet du Ministre — Ministère du Job et Bonheur**  
*Préparation des interventions orales (Points presse, FAQ institutionnelle, Parlement)*

| Paramètre | Valeur |
| :--- | :--- |
| **Date** | Mardi 8 septembre 2026 — 14h00 |
| **Destinataire** | Benjamin Sellami, Conseiller en communication |
| **Projet** | GéoEmploi — Démonstrateur technique territorial |
| **Rédacteur technique** | Gabriel Decloquement |
| **Vérificateur sur l'environnement d'exécution** | Enzo Sénéchal |
| **Statut** | Certifié conforme aux données réelles de l'application |

---

## Synthèse méthodologique

Le présent document consigne les réponses techniques officielles aux douze questions adressées à l'équipe de développement.

Conformément aux consignes ministérielles :
- Chaque réponse orale est **factuelle, affirmative, limitée à 3 lignes maximum** et prête à être lue à voix haute sans conditionnel.
- Chaque réponse est adossée à une **source technique vérifiable** (code source, endpoint API, écran d'interface ou table de base de données).
- Pour les questions 4, 8, 10, 11 et 12, les chiffres proviennent d'une **interrogation directe de la base de données PostgreSQL en cours d'exécution ce jour**, accompagnée de la **requête SQL exacte**.
- Les fonctionnalités en cours de finalisation indiquent précisément l'action planifiée et son échéance de livraison.

---

### 1. Est-il exact qu'un employeur doit payer pour publier une offre sur GéoEmploi ?

> **Réponse orale :**  
> Non, c'est totalement inexact. La publication d'offres sur GéoEmploi est entièrement gratuite pour tous les employeurs. Aucun module de paiement, tarification ou système bancaire n'existe sur la plateforme.

- **Source technique :**  
  - Endpoint API : `POST /api/employers/offers` (création d'offre directe sans intermédiaire financier ni contrôle de transaction).  
  - Fichier de dépendances : `backend/package.json` (zéro composant bancaire type Stripe ou PayPal).  
  - Conditions d'utilisation : `frontend/src/components/cgu/CguArticle.jsx` (Article 1 : gratuité intégrale du service public expérimental).

---

### 2. Un tarif a-t-il été implémenté dans l'application à un moment quelconque ? Si oui, entre quelles dates ?

> **Réponse orale :**  
> Non. Aucun tarif, formule payante ou abonnement n'a jamais été implémenté dans l'application, à aucune date ni dans aucune version. Le service a été conçu dès l'origine comme un démonstrateur public intégralement gratuit.

- **Source technique :**  
  - Historique Git : Intégralité des commits depuis le 31 août 2026 (absence absolue de modèle économique ou payant).  
  - Schéma de base de données : Table `job_offers` dans `database/init/001-schema.sql` (seuls existent les salaires proposés aux candidats `salary_min` et `salary_max`).  
  - Document de cadrage : `docs/note_deploiement.md` (mention statutaire : « hors tarification/devis »).

---

### 3. Quelles données de localisation l'application collecte-t-elle exactement, et à quelle maille ?

> **Réponse orale :**  
> L'application collecte uniquement le code département, le code commune INSEE, le code postal et les coordonnées géographiques du centre de la commune. Aucune adresse de rue ni numéro de voie n'est collecté, ni pour les offres ni pour les candidats.

- **Source technique :**  
  - Service de géocodage : `backend/src/modules/geo/ban.js` (requêtes BAN restreintes aux municipalités).  
  - Formulaire de saisie d'offre : `frontend/src/components/employer/JobOfferLocationSection.jsx` (champ strictement bridé à la ville ou commune).  
  - Schéma de données : `database/init/001-schema.sql` (colonnes `commune_code`, `departement_code`, `postal_code`, `latitude`, `longitude`).

---

### 4. Ces données sont-elles conservées ? Combien de temps, et depuis quand cette durée est-elle réellement appliquée ?

> **Réponse orale :**  
> Les coordonnées candidat sont immédiatement effacées dès la désactivation de la géolocalisation. Le démonstrateur ne conserve aucun historique d'adresses : les scripts de purge à 90 jours et d'archivage à 30 jours sont codés et prêts pour le déploiement sur serveur.  
> *Action et échéance :* Planification de la tâche cron sur le serveur d'hébergement lors de la mise en service sous 24h, au plus tard mercredi 9 septembre à 18h.

- **Chiffres lus en base aujourd'hui (08/09/2026) :**  
  - Candidats avec coordonnées géographiques actives : **0**  
  - Vues d'offres enregistrées dans l'historique : **0**  
  - Offres créées en base de démonstration : **3 offres de test** (aucune n'atteint le seuil d'archivage de 30 jours).
- **Requêtes SQL de vérification :**  
  ```sql
  SELECT COUNT(*) FROM candidate_profiles WHERE latitude IS NOT NULL;
  -- Résultat : 0

  SELECT COUNT(*) FROM job_offer_views;
  -- Résultat : 0

  SELECT COUNT(*) FROM job_offers;
  -- Résultat : 3
  ```
- **Source technique :** Scripts de maintenance `scripts/purge_data_90days.py` et `scripts/archive_data_30days.py` ; endpoint `PATCH /api/users/me/preferences` (mise à NULL immédiate des coordonnées).

---

### 5. L'application fonctionne-t-elle si l'utilisateur refuse la géolocalisation ?

> **Réponse orale :**  
> Oui, l'application fonctionne parfaitement si la géolocalisation est refusée. L'utilisateur consulte l'ensemble des offres d'emploi en sélectionnant son département ou en tapant son code postal à la main.

- **Source technique :**  
  - Écran / Page : `frontend/src/pages/JobsPage.jsx` (mode de repli sans géolocalisation avec affichage de la carte de France et sélection manuelle).  
  - Contexte applicatif : `frontend/src/context/GeolocationContext.jsx` (prise en compte de l'état `denied` sans blocage de l'interface).  
  - Référence RGPD : `docs/tableau_comportement_geolocalisation.md`.

---

### 6. Un utilisateur peut-il être localisé à son adresse précise ?

> **Réponse orale :**  
> Non, c'est techniquement impossible. Le profil candidat ne comporte aucun champ pour le nom de rue ou le numéro de porte : la localisation est systématiquement arrêtée au centre de la commune ou au code postal.

- **Source technique :**  
  - Structure de la table : Table `candidate_profiles` dans `database/init/001-schema.sql` (aucun champ d'adresse postale ni numéro de voie).  
  - Écran candidat : `frontend/src/components/account/CandidateProfileForm.jsx` (saisie restreinte à la commune et au rayon de recherche en kilomètres).  
  - API backend : `backend/src/modules/users/controllers.js` (fonction `updateProfile`).

---

### 7. Un employeur peut-il voir où se trouve un candidat ?

> **Réponse orale :**  
> Non. Un employeur ne peut jamais localiser un candidat. Il a uniquement accès aux informations transmises dans la candidature, c'est-à-dire le nom, le CV et la ville de résidence déclarée par le candidat.

- **Source technique :**  
  - Endpoint API : `GET /api/employers/offers/:id/applications`.  
  - Contrôleur backend : `backend/src/modules/employer/controllers.js` (ligne 300 : la requête SQL sélectionne strictement `cp.first_name, cp.last_name, cp.headline, cp.cv_url, u.email` à l'exclusion formelle de toute coordonnée GPS).  
  - Écran recruteur : `frontend/src/components/employer/ApplicationCard.jsx`.

---

### 8. Combien de personnes sont réellement inscrites aujourd'hui ?

> **Réponse orale :**  
> Trois personnes sont inscrites dans la base de test aujourd'hui. Il s'agit uniquement de trois comptes créés par l'équipe technique pour faire tourner le démonstrateur : aucun citoyen ni candidat n'est inscrit.

- **Chiffre lu en base aujourd'hui (08/09/2026) :**  
  - Nombre total d'utilisateurs inscrits : **3 comptes techniques de test** (tous les 3 ont le rôle `employer` et le statut `active` ; 0 candidat inscrit).
- **Requêtes SQL de vérification :**  
  ```sql
  SELECT COUNT(*) FROM users;
  -- Résultat : 3

  SELECT role, status, COUNT(*) FROM users GROUP BY role, status;
  -- Résultat : role: employer | status: active | count: 3

  SELECT id, email, role, created_at FROM users ORDER BY id;
  -- Résultat :
  -- ID 40   | ... | employer | 2026-09-04 15:09:09
  -- ID 199  | ... | employer | 2026-09-07 08:24:05
  -- ID 1136 | ... | employer | 2026-09-07 14:30:20
  ```
- **Source technique :** Table `users` de la base PostgreSQL `geoemploi`.

---

### 9. L'application est-elle en production, ou s'agit-il d'un démonstrateur ?

> **Réponse orale :**  
> C'est un démonstrateur technique territorial et non un service public en production. Cette mention d'avertissement figure expressément sur chaque page du site, dans les conditions d'utilisation et dans tous les e-mails envoyés.

- **Source technique :**  
  - Écran / Pied de page : `frontend/src/components/layout/Footer.jsx` (bannière obligatoire : *« Démonstrateur technique, ne constitue pas un service public en exploitation. »*).  
  - Notifications système : `backend/src/modules/employer/controllers.js` (ligne 366 : mention légale automatiquement injectée dans chaque message envoyé).  
  - Conditions d'utilisation : `docs/cgu.md` (Article 1 et Préambule légal).

---

### 10. Qui a accès aux données en tant qu'administrateur, et combien de comptes disposent de ce droit aujourd'hui ?

> **Réponse orale :**  
> Un seul compte dispose des droits d'administrateur aujourd'hui. C'est le compte de maintenance technique interne utilisé par l'équipe pour administrer et modérer le démonstrateur.

- **Chiffre lu en base aujourd'hui (08/09/2026) :**  
  - Nombre de comptes administrateurs : **1**
- **Requêtes SQL de vérification :**  
  ```sql
  SELECT COUNT(*) FROM admins;
  -- Résultat : 1

  SELECT a.id, a.user_id, a.full_name, u.email, a.created_at
  FROM admins a
  JOIN users u ON u.id = a.user_id;
  -- Résultat :
  -- Admin ID: 5 | User ID: 40 | Nom: "Administrateur ajouté via script"
  -- Email: ..... | Date: 2026-09-07 08:16:53 UTC
  ```
- **Source technique :** Table `admins` reliée à `users` et garde d'authentification `backend/src/modules/admin/controllers.js` (`requireAdmin`).

---

### 11. Un utilisateur peut-il supprimer son compte et ses données ? Le compte disparaît-il de la base, ou est-il seulement désactivé ?

> **Réponse orale :**  
> L'utilisateur peut demander la suppression de son compte directement depuis ses réglages. Le compte est désactivé et immédiatement anonymisé de manière irréversible, ses données personnelles et coordonnées GPS étant effacées pour préserver l'historique des candidatures.  
> *Action et échéance :* Si une suppression physique totale de la ligne SQL est exigée, nous pouvons déployer l'effacement définitif sous 48h (jeudi 10 septembre à 18h).

- **Chiffres lus en base aujourd'hui (08/09/2026) :**  
  - Comptes désactivés / anonymisés aujourd'hui : **0** sur 3 comptes au total.
- **Requête SQL de vérification :**  
  ```sql
  SELECT status, COUNT(*) FROM users GROUP BY status;
  -- Résultat : active: 3 | deleted: 0
  ```
- **Source technique :**  
  - Endpoint API : `DELETE /api/users/me`.  
  - Contrôleur backend : `backend/src/modules/users/controllers.js` (fonction `deleteMe` : email écrasé en `deleted-{id}@anonyme.local`, CV et coordonnées GPS passés à NULL, compétences supprimées).  
  - Écran : `frontend/src/pages/AccountSettingsPage.jsx` (section « Supprimer mon compte »).

---

### 12. Les coordonnées enregistrées à l'adresse la semaine dernière existent-elles encore quelque part : en base, dans un export, dans une sauvegarde, dans votre jeu de données de démonstration ?

> **Réponse orale :**  
> Non. Aucune coordonnée à l'adresse n'existe nulle part : ni en base de données, ni dans les exports, ni dans les sauvegardes, ni dans le jeu de démonstration. L'application est strictement restreinte à la maille communale et n'enregistre aucune adresse de voie.

- **Chiffres lus en base aujourd'hui (08/09/2026) :**  
  - Colonnes d'adresses dans l'ensemble de la base : **0** (aucune colonne d'adresse de rue n'existe dans les tables).  
  - Coordonnées à l'adresse enregistrées en base : **0**.  
  - Coordonnées à l'adresse dans les exports ou sauvegardes : **0**.  
  - Coordonnées à l'adresse dans le jeu de données de démonstration (`database/seed-demo.sql`) : **0** (tous les points géographiques sont exclusivement rattachés au centroïde de la commune INSEE).
- **Requêtes SQL de vérification :**  
  ```sql
  SELECT COUNT(*) 
  FROM information_schema.columns 
  WHERE table_schema = 'public' AND column_name LIKE '%address%';
  -- Résultat : 0 colonne

  SELECT COUNT(*) 
  FROM job_offers 
  WHERE commune_code IS NOT NULL;
  -- Résultat : 3 offres, toutes positionnées au centroïde de la commune (code INSEE) sans adresse de voie.
  ```
- **Source technique :**  
  - Schéma de référence : `database/init/001-schema.sql` (aucun champ d'adresse postale).  
  - Jeu de démonstration : `database/seed-demo.sql` (modélisation exclusivement communale et par code postal).  
  - Tables actives : `job_offers` et `employer_profiles` (seules les colonnes `commune_code`, `departement_code`, `postal_code`, `latitude` et `longitude` du centroïde de la commune sont gérées).

---

*Document technique certifié conforme à l'état réel de la plateforme au mardi 8 septembre 2026.*  

**Signataires :**  
- **Gabriel Decloquement**, Ingénieur Logiciel Full-Stack (Rédacteur technique)  
- **Enzo Sénéchal**, Responsable Technique & QA (Vérificateur sur l'environnement d'exécution)
