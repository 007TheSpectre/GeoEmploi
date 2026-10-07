# GeoEmploi — Architecture Globale, Inventaire des Fichiers & Guide Utilisateur

Ce document constitue la référence exhaustive du projet **GeoEmploi**, plateforme de mise en relation entre demandeurs d'emploi et recruteurs basée sur la géolocalisation et le respect du RGPD. Il détaille l'architecture logicielle, l'ensemble des fichiers du backend et du frontend avec leurs responsabilités exactes, le schéma de base de données, ainsi qu'un guide utilisateur complet par rôle (Candidat, Employeur, Administrateur).

---

## Sommaire

1. [Architecture Globale & Infrastructure](#1-architecture-globale--infrastructure)
   - [Contexte et Objectifs](#contexte-et-objectifs)
   - [Stack Technologique](#stack-technologique)
   - [Orchestration Docker & Déploiement](#orchestration-docker--déploiement)
   - [Système de Coordonnées Géographiques (WGS84 & Lambert-93)](#système-de-coordonnées-géographiques)
   - [Sécurité & Conformité RGPD](#sécurité--conformité-rgpd)
2. [Base de Données & Schéma Relationnel](#2-base-de-données--schéma-relationnel)
3. [Inventaire Complet du Backend (`backend/`)](#3-inventaire-complet-du-backend)
   - [Point d'entrée & Application Express](#point-dentrée--application-express)
   - [Configuration (`config/`)](#configuration-config)
   - [Middlewares (`middleware/`)](#middlewares-middleware)
   - [Utilitaires (`utils/`)](#utilitaires-utils)
   - [Modules Métier (`modules/`)](#modules-métier-modules)
4. [Inventaire Complet du Frontend (`frontend/`)](#4-inventaire-complet-du-frontend)
   - [Point d'entrée & Routage](#point-dentrée--routage)
   - [Pages Applicatives (`pages/`)](#pages-applicatives-pages)
   - [Couche d'Accès aux Données API (`api/`)](#couche-daccès-aux-données-api-api)
   - [Gestion d'État & Contextes (`context/`)](#gestion-détat--contextes-context)
   - [Hooks Personnalisés (`hooks/`)](#hooks-personnalisés-hooks)
   - [Composants de l'Interface (`components/`)](#composants-de-linterface-components)
   - [Utilitaires Frontend (`utils/`)](#utilitaires-frontend-utils)
5. [Scripts d'Automatisation & Maintenance (`scripts/`)](#5-scripts-dautomatisation--maintenance)
6. [Guide Utilisateur Complet](#6-guide-utilisateur-complet)
   - [Guide Demandeur d'Emploi / Candidat](#guide-demandeur-demploi--candidat)
   - [Guide Recruteur / Employeur](#guide-recruteur--employeur)
   - [Guide Administrateur de Plateforme](#guide-administrateur-de-plateforme)

---

## 1. Architecture Globale & Infrastructure

### Contexte et Objectifs
GeoEmploi est un démonstrateur public de mise en relation entre demandeurs d'emploi et recruteurs. Ses principes fondateurs sont :
- **Accès public universel** : Consultation libre de la carte des offres sans inscription préalable.
- **Recherche par proximité géographique** : Filtrage par rayon kilométrique (formule haversine SQL), département, commune et code postal.
- **Dualité de projection géographique** : Stockage et calculs WGS84 (EPSG:4326) pour Leaflet et projection légale française Lambert-93 (EPSG:2154) pour l'interopérabilité des données publiques.
- **Respect strict du RGPD** : Droit à l'effacement avec mot de passe (Art. 17), droit à la portabilité JSON (Art. 20), consentement explicite à la géolocalisation avec purge immédiate des coordonnées (Art. 6), et anonymisation systématique des données des comptes supprimés.

### Stack Technologique

| Domaine | Technologie | Utilisation principale |
|---|---|---|
| **Frontend** | React 19 + Vite | SPA rapide, composants modulaires, rendu réactif |
| **Styles** | Tailwind CSS v4 + DSFR | Design épuré, charte graphique de l'État (bleu Marianne, vert émeraude) |
| **Cartographie** | Leaflet + React-Leaflet | Rendu des tuiles OpenStreetMap, marqueurs dynamiques, cercles de diffusion |
| **Backend** | Node.js (v20+) + Express.js | API RESTful modulaire, async/await, middlewares |
| **Base de données** | PostgreSQL 17 | Données relationnelles, contraintes strictes CHECK et FK ON DELETE |
| **Driver SQL** | `pg` (node-postgres) | Requêtes SQL pures paramétrées contre les injections SQL |
| **Authentification** | JWT (`jsonwebtoken`) | Jetons signés (Bearer) stockés localement |
| **Hachage** | `argon2` | Hachage résistant aux attaques GPU/mémoire pour les mots de passe |
| **Géocodage** | API Adresse (BAN) | Autocomplétion et géocodage d'adresses françaises |
| **Documentation** | Swagger / OpenAPI 3.0 | Documentation interactive sur `/api-docs` |
| **Conteneurs** | Docker Compose | Environnement reproductible multi-services |

### Orchestration Docker & Déploiement

Le fichier `docker-compose.yaml` orchestre 3 services pérennes :
1. `database` (PostgreSQL 17, port 5432) : Volume persistant `pgdata`, scripts d'initialisation dans `database/init/001-schema.sql`.
2. `backend` (Node.js Express, port 3000) : Dépend de la base de données via un `healthcheck` (pg_isready).
3. `frontend` (Nginx, port 8080) : Sert l'application web packagée et proxyfie les requêtes `/api` vers le backend.

### Système de Coordonnées Géographiques

- **WGS84 (EPSG:4326)** : Coordonnées standard (latitude/longitude en degrés décimaux) utilisées pour l'affichage cartographique Leaflet et les calculs de distance haversine en SQL.
- **Lambert-93 (EPSG:2154)** : Projection conforme conique légale en France métropolitaine (coordonnées métriques X et Y).
- **Conversion** : Assurée côté backend dans `backend/src/modules/geo/lambert93.js` selon l'algorithme officiel de l'IGN. Tout profil candidat ou employeur recevant des coordonnées WGS84 voit ses coordonnées Lambert-93 automatiquement recalculées et persistées.

### Sécurité & Conformité RGPD

- **Mots de passe** : Hachés avec l'algorithme **Argon2id** (coût mémoire élevé, résistant aux attaques par force brute).
- **Recherche SQL sans injection** : 100 % des requêtes utilisent les variables de liaison `$1, $2, ...`.
- **Limitation de débit (Rate Limiting)** : `express-rate-limit` paramétré spécifiquement pour l'authentification (`authLimiter`), les tuiles géographiques (`geoLimiter`) et les requêtes générales (`apiLimiter`).
- **En-têtes de sécurité** : `helmet` activé pour protéger contre le détournement de clic (clickjacking) et les failles XSS.
- **Droit à l'oubli (RGPD Art. 17)** : L'utilisateur peut supprimer son compte à tout moment. Cette action requiert obligatoirement son mot de passe actuel. Les profils sont anonymisés, les candidatures expurgées des lettres et CV, les offres en cours clôturées, et les sessions révoquées.
- **Droit à la portabilité (RGPD Art. 20)** : Téléchargement instantané d'un export structuré JSON contenant le compte, le profil avec coordonnées WGS84 et Lambert-93, l'historique complet des candidatures, offres et notifications.
- **Droit de retrait de la géolocalisation** : La désactivation de la géolocalisation purge immédiatement les coordonnées GPS de la base de données.

---

## 2. Base de Données & Schéma Relationnel

Le schéma PostgreSQL (`database/init/001-schema.sql`) comporte 13 tables relationnelles dotées de contraintes strictes d'intégrité :

```
 users (id, email, password_hash, role, status, geolocation_enabled, last_login_at, ...)
   ├── admins (id, user_id, full_name)
   ├── candidate_profiles (id, user_id, first_name, last_name, availability, lat, lon, lambert93_x, lambert93_y, ...)
   │     ├── candidate_skills (id, candidate_id, skill_name, level)
   │     ├── candidate_experiences (id, candidate_id, company_name, job_title, started_at, ended_at, is_current)
   │     ├── candidate_educations (id, candidate_id, institution, degree, field_of_study, started_at, ended_at)
   │     ├── saved_job_offers (id, candidate_id, job_id)
   │     └── applications (id, job_id, candidate_id, cover_letter, cv_url, status)
   │           └── application_status_history (id, application_id, old_status, new_status, changed_by)
   ├── employer_profiles (id, user_id, company_name, siret, sector, lat, lon, lambert93_x, lambert93_y, verification_status)
   │     └── job_offers (id, employer_id, title, description, contract_type, lat, lon, lambert93_x, lambert93_y, broadcast_radius_km, status)
   │           ├── job_offer_tags (id, job_id, tag)
   │           ├── job_offer_views (id, job_id, view_date, count)
   │           └── reports (id, offer_id, reporter_id, reason, details, status, resolved_by)
   ├── notifications (id, user_id, type, title, body, link, is_read)
   ├── tokens (id, user_id, type, token_hash, expires_at, used_at)
   └── moderation_logs (id, admin_id, job_id, user_id, action, reason)
```

---

## 3. Inventaire Complet du Backend (`backend/`)

### Point d'entrée & Application Express

- **`backend/src/server.js`**
  - Point d'entrée principal du processus Node.js.
  - Démarre le serveur HTTP Express sur le port configuré (`PORT`, défaut `3000`).
  - Démarre la tâche planifiée d'archivage des offres expirées (`startArchivalJob`).

- **`backend/src/app.js`**
  - Assemblage de l'application Express : middlewares globaux (`helmet`, `cors`, `express.json`).
  - Configuration du proxy de confiance (`trust proxy 1`).
  - Montage de l'interface Swagger UI sur `/api-docs`.
  - Application des limiteurs de débit (`authLimiter`, `geoLimiter`, `apiLimiter`).
  - Route de santé `/api/health` et route d'accueil `/api/`.
  - Montage des routeurs modulaires sous `/api/*` (`auth`, `users`, `geo`, `offers`, `candidate`, `employer`, `applications`, `notifications`, `reports`, `admin`).
  - Gestionnaires d'erreurs 404 (`notFoundHandler`) et d'erreurs globales (`errorHandler`).

### Configuration (`config/`)

- **`backend/src/config/db.js`**
  - Instance du pool de connexions PostgreSQL (`pg.Pool`).
  - Fonction utilitaire `query(text, params)` pour requêtes simples.
  - Fonction utilitaire `withTransaction(fn)` pour exécuter une transaction SQL atomique (`BEGIN` / `COMMIT` / `ROLLBACK`).

- **`backend/src/config/rateLimit.js`**
  - Définition des limiteurs de requêtes Express :
    - `authLimiter` : limite les tentatives d'authentification pour contrer le bruteforce.
    - `geoLimiter` : limite les requêtes de tuiles et de géolocalisation.
    - `apiLimiter` : plafond global de protection par adresse IP.

- **`backend/src/config/swagger.js`**
  - Définition des métadonnées OpenAPI 3.0 (titre, version, serveurs, composants de sécurité Bearer JWT).
  - Scanner automatique des annotations JSDoc dans les fichiers de routes pour générer la spécification.

### Middlewares (`middleware/`)

- **`backend/src/middleware/auth.js`**
  - `signToken(userId, role)` : génération et signature de jetons JWT.
  - `getAdminRole(userId)` : vérifie en base si l'utilisateur possède une entrée active dans la table `admins`.
  - `authenticate(req, res, next)` : vérifie la présence et la validité du token Bearer, extrait l'utilisateur, vérifie son statut (bloque si `deleted` ou `suspended`) et injecte `req.user`.
  - `optionalAuth(req, res, next)` : extrait l'utilisateur si un token valide est présent, sans bloquer la requête en cas d'absence (utilisé pour les recherches publiques d'offres).
  - `requireRole(...roles)` : restreint l'accès aux utilisateurs ayant l'un des rôles demandés.

### Utilitaires (`utils/`)

- **`backend/src/utils/errors.js`**
  - Classe personnalisée `ApiError` étendant `Error` avec code HTTP et message adapté.
  - `asyncHandler(fn)` : wrapper pour attraper automatiquement les promesses rejetées et les passer à `next(err)`.
  - `notFoundHandler(req, res, next)` : intercepte les routes inconnues (404).
  - `errorHandler(err, req, res, next)` : normalise le format de réponse JSON d'erreur `{ error: message }` et masque les détails internes en production.

- **`backend/src/utils/validate.js`**
  - Validateur déclaratif de charge utile de requêtes (types : `string`, `int`, `number`, `email`, `boolean`, `oneOf`, min, max, regex).
  - Lève un `ApiError(400)` explicatif dès la première anomalie constatée.

### Modules Métier (`modules/`)

#### 1. Authentification (`modules/auth/`)
- **`routes.js`** :
  - `POST /api/auth/register` : Inscription d'un nouveau compte candidat ou employeur.
  - `POST /api/auth/login` : Connexion (vérification Argon2, génération JWT).
  - `GET /api/auth/siret/:siret` : Vérification du numéro SIRET (algorithme de Luhn + annuaire d'entreprises).
  - `POST /api/auth/forgot-password` & `POST /api/auth/reset-password` : Réinitialisation de mot de passe par jeton à usage unique.
- **`controllers.js`** : Logique métier des inscriptions, connexions et réinitialisations de mot de passe.
- **`siretService.js`** : Vérification cryptographique de la clé de contrôle de Luhn sur les 14 chiffres du SIRET et récupération des métadonnées de l'entreprise.

#### 2. Utilisateurs & RGPD (`modules/users/`)
- **`routes.js`** :
  - `GET /api/users/me` : Données du compte connecté et profil associé.
  - `PATCH /api/users/me/preferences` : Préférences utilisateur (activation/désactivation géolocalisation).
  - `GET /api/users/me/export` : Portabilité des données personnelles (RGPD Art. 20, export JSON).
  - `GET /api/users/me/stats` : Statistiques d'activité personnelle.
  - `DELETE /api/users/me` : Suppression de compte et droit à l'effacement (RGPD Art. 17).
- **`controllers.js`** :
  - `getMe` : Récupère l'utilisateur, son profil spécifique (candidat/employeur/admin) et ses métriques.
  - `updatePreferences` : Active ou désactive la géolocalisation. Si désactivée, supprime instantanément les coordonnées GPS du profil.
  - `exportUserData` : Assemble un fichier JSON complet normalisé (métadonnées, profil WGS84 et Lambert-93, candidatures, offres, alertes).
  - `deleteMe` : Exige le mot de passe actuel, le valide avec Argon2, anonymise toutes les informations nominatives, purge les offres sauvegardées, ferme les offres actives, révoque les jetons et supprime les accès administrateur.

#### 3. Demandeur d'emploi (`modules/candidate/`)
- **`routes.js`** & **`controllers.js`** :
  - `GET /api/candidate/profile` & `PUT /api/candidate/profile` : Gestion du profil professionnel (titre, bio, téléphone, disponibilité, salaire souhaité, rayon de recherche).
  - `POST`, `PUT`, `DELETE /api/candidate/experiences` : Gestion du parcours professionnel et des entreprises passées.
  - `POST`, `PUT`, `DELETE /api/candidate/educations` : Gestion des diplômes et formations.
  - `POST`, `DELETE /api/candidate/skills` : Gestion des compétences et niveaux d'expertise.
  - `GET`, `POST`, `DELETE /api/candidate/saved-offers` : Gestion des offres d'emploi sauvegardées (favoris).
  - `GET /api/candidate/applications` : Liste des candidatures transmises par le candidat avec statut en direct.

#### 4. Recruteur / Employeur (`modules/employer/`)
- **`routes.js`** & **`controllers.js`** :
  - `GET`, `PUT /api/employer/profile` : Gestion des informations de l'organisme ou de l'entreprise (nom, secteur, SIRET, description, téléphone, localisation).
  - `GET /api/employer/offers` : Liste des offres publiées par l'employeur avec indicateurs de consultation et candidatures reçues.
  - `GET /api/employer/applications` : Consultation des candidatures reçues sur l'ensemble de ses offres.

#### 5. Offres d'Emploi (`modules/offers/`)
- **`routes.js`** & **`controllers.js`** :
  - `GET /api/offers` : Recherche et filtrage public d'offres (requête spatiale haversine par coordonnées, filtres contrat, département, salaire, mot-clé).
  - `GET /api/offers/:id` : Consultation du détail d'une offre (incrémente automatiquement le compteur de vues journalier).
  - `POST /api/offers` : Création d'une offre d'emploi géolocalisée (état initial `active` ou modéré).
  - `PUT /api/offers/:id` : Modification d'une offre existante.
  - `DELETE /api/offers/:id` : Clôture ou suppression d'une offre.

#### 6. Candidatures (`modules/applications/`)
- **`routes.js`** & **`controllers.js`** :
  - `POST /api/applications` : Envoi d'une candidature par un candidat (lettre de motivation, lien CV). Notifie immédiatement l'employeur.
  - `GET /api/applications/:id` : Consultation d'une candidature spécifique.
  - `PATCH /api/applications/:id/status` : Mise à jour du statut par l'employeur (`sent` -> `viewed` -> `shortlisted` -> `interview` -> `offer_made` / `rejected`). Enregistre l'historique dans `application_status_history` et notifie le candidat.

#### 7. Géolocalisation & Cartographie (`modules/geo/`)
- **`routes.js`** & **`controllers.js`** :
  - `GET /api/geo/tiles/:z/:x/:y.png` : Relais et proxy de tuiles cartographiques avec cache mémoire.
  - `GET /api/geo/search` : Recherche d'adresses et de communes via la BAN (Base Adresse Nationale).
  - `GET /api/geo/reverse` : Géocodage inverse (coordonnées GPS -> nom de commune / département).
- **`lambert93.js`** : Fonctions mathématiques de conversion WGS84 vers projection Lambert-93 conforme IGN.
- **`location.js`** : Résolution et validation des coordonnées géographiques lors de l'enregistrement des entités.
- **`ban.js`** : Client HTTP vers l'API Adresse gouvernementale (`api-adresse.data.gouv.fr`).
- **`tileCache.js`** : Cache mémoire LRU pour stocker les tuiles cartographiques et réduire la latence réseau.

#### 8. Notifications (`modules/notifications/`)
- **`routes.js`** & **`controllers.js`** :
  - `GET /api/notifications` : Liste des notifications in-app de l'utilisateur connecté.
  - `PATCH /api/notifications/:id/read` & `PATCH /api/notifications/read-all` : Marquage comme lu.

#### 9. Signalements (`modules/reports/`)
- **`routes.js`** & **`controllers.js`** :
  - `POST /api/reports` : Signalement citoyen d'une offre (fraude, offre expirée, contenu inapproprié). Accessible aux utilisateurs connectés.

#### 10. Administration (`modules/admin/`)
- **`routes.js`** & **`controllers.js`** :
  - `GET /api/admin/metrics` : Statistiques de la plateforme (comptes, offres actives, candidatures, signalements en attente).
  - `GET /api/admin/offers` : Liste exhaustive des offres pour modération.
  - `PATCH /api/admin/offers/:id/moderate` : Action de modération (approuver, rejeter avec motif, fermer).
  - `GET /api/admin/users` : Annuaire et recherche des utilisateurs inscrits.
  - `PATCH /api/admin/users/:id/status` : Suspension ou réactivation d'un compte avec motif d'audit.
  - `GET /api/admin/reports` & `PATCH /api/admin/reports/:id` : Traitement des signalements citoyens.

#### 11. Tâches Planifiées (`modules/cron/`)
- **`archive.js`** : Tâche cron quotidienne automatisant le passage au statut `archived` des offres expirées ou clôturées depuis plus de 30 jours.

---

## 4. Inventaire Complet du Frontend (`frontend/`)

### Point d'entrée & Routage

- **`frontend/src/main.jsx`**
  - Point de montage React dans le DOM (`#root`).
  - Encapsule l'application dans `AuthProvider` (session JWT) et `FavoritesContext` (offres sauvegardées).

- **`frontend/src/App.jsx`**
  - Définition du routage applicatif React Router (`BrowserRouter`, `Routes`, `Route`).
  - Intégration de la `Navbar` supérieure et du `Footer` avec mentions légales obligatoires.
  - Routes déclarées :
    - `/` et `/jobs` : Page principale de recherche d'emplois et cartographie interactive.
    - `/account` : Espace personnel « Mon Compte » (candidat, employeur, admin).
    - `/admin` : Panneau d'administration réservé aux administrateurs.
    - `/login` : Connexion sécurisée.
    - `/register` : Inscription avec sélection de profil (candidat ou entreprise).
    - `/faq` et `/transparence` : FAQ et explications sur la transparence algorithmique.
    - `/cgu` et `/terms` : Conditions Générales d'Utilisation et engagements RGPD.
    - `*` : Page 404 introuvable.

- **`frontend/src/index.css` & `frontend/src/App.css`**
  - Importation de Tailwind CSS.
  - Variables de couleurs de la charte de l'État (bleu `#000091`, bleu hover `#1212ff`, teintes slate et émeraude).
  - Styles personnalisés pour Leaflet (marqueurs circulaires, popups fluides).

### Pages Applicatives (`pages/`)

- **`JobsPage.jsx`**
  - Coeur de l'expérience utilisateur : disposition bifaciale avec carte Leaflet plein écran ou divisée, et panneau latéral de résultats.
  - Synchronise les filtres (mot-clé, contrat, rayon géographique, salaire) avec la carte et la liste.
  - Ouvre les modales de candidature (`ApplyJobModal`) et de signalement (`ReportJobModal`).

- **`AccountPage.jsx`**
  - Page unifiée de gestion de compte s'adaptant au rôle de l'utilisateur :
    - **Candidat** : Navigation par onglets (Profil pro, Candidatures soumises, Offres sauvegardées, Confidentialité & RGPD).
    - **Employeur** : Tableau de bord de recrutement (`EmployerDashboard`), informations de l'entreprise, résumé d'activité.
    - **Admin** : Résumé des privilèges, lien vers le panneau d'administration, réglages RGPD.
  - Héberge les composants transverses : `AccountPrivacySettings` (interrupteur géoloc), `DataPortabilityCard` (téléchargement JSON), `DeleteAccountCard` et `DeleteAccountModal` (suppression avec mot de passe).

- **`AdminPage.jsx`**
  - Espace de supervision globale de la plateforme :
    - Cartes d'indicateurs clés (utilisateurs, candidats, employeurs vérifiés, offres actives, signalements).
    - Onglet modération des offres (`AdminOffersList`).
    - Onglet gestion des utilisateurs (`AdminUsersList`) avec possibilité de suspendre/réactiver.

- **`LoginPage.jsx`**
  - Formulaire de connexion sécurisé avec vérification des identifiants via `loginUserApi`.
  - Prise en charge des notifications de redirection (ex. confirmation de suppression de compte).

- **`RegisterPage.jsx`**
  - Formulaire d'inscription guidé avec sélection de profil (Demandeur d'emploi vs Entreprise/Recruteur).
  - Pour les entreprises : vérification du numéro SIRET en direct avec validation de Luhn.

- **`FaqPage.jsx`**
  - Foire aux questions classée par catégories (Général, Candidats, Recruteurs, RGPD).
  - Présentation de la transparence algorithmique (critères de tri purement spatiaux et chronologiques, absence de scoring discriminant).

- **`CguPage.jsx`**
  - Cadre juridique et légal complet, rappel des droits RGPD, politique de cookies et de localisation.

- **`NotFoundPage.jsx`**
  - Page d'erreur 404 conviviale avec bouton de retour à la carte des emplois.

### Couche d'Accès aux Données API (`api/`)

- **`api/authApi.js`** : Appels réseau liés à l'authentification (`loginUserApi`, `registerUserApi`, `checkSiretApi`, `fetchUserStatsApi`, `exportUserDataApi`, `updateUserPreferencesApi`, `deleteUserAccountApi`).
- **`api/offersApi.js`** : Recherche et consultation d'offres (`fetchOffersApi`, `fetchOfferByIdApi`, `createOfferApi`, `updateOfferApi`, `deleteOfferApi`).
- **`api/candidateApi.js`** : Profil candidat, expériences, diplômes, compétences et favoris.
- **`api/employerApi.js`** : Profil entreprise, offres de l'employeur, candidatures reçues.
- **`api/applicationsApi.js`** : Soumission de candidature et mise à jour de statut.
- **`api/adminApi.js`** : Métriques globales, modération d'offres, gestion des statuts utilisateurs et signalements.
- **`api/geoApi.js`** : Autocomplétion d'adresses et géocodage inverse via l'API BAN.

### Gestion d'État & Contextes (`context/`)

- **`context/AuthContext.jsx`**
  - Gère l'état global de l'utilisateur connecté (`user`, `token`, `isAuthenticated`).
  - Persiste la session dans le `localStorage` (`geoemploi_user`, `geoemploi_token`).
  - Expose `loginState` et `logoutState`.

- **`context/FavoritesContext.jsx`**
  - Gère la liste des offres d'emploi mises en favoris par le candidat.
  - Synchronise les favoris avec le backend si l'utilisateur est connecté, ou en local le cas échéant.

### Hooks Personnalisés (`hooks/`)

- **`useAsync.js`** : Encapsule l'exécution de fonctions asynchrones avec états automatiques `loading`, `error` et `data`.
- **`useDebounce.js`** : Retarde l'exécution d'une fonction (idéal pour la barre de recherche et l'autocomplétion).
- **`useBodyScrollLock.js`** : Bloque le défilement du corps de la page lorsqu'une modale est ouverte pour une ergonomie optimale.
- **`useDataExport.js`** : Gère l'état d'exportation et le téléchargement du fichier JSON RGPD avec retours visuels.
- **`useCandidateProfile.js`** : Centralise le chargement et la mise à jour des différentes sections du profil candidat.

### Composants de l'Interface (`components/`)

#### 1. Navigation & Layout (`components/navigation/` & `layout/`)
- **`Navbar.jsx`** : Barre de navigation adaptative (liens, bouton d'export rapide, bouton de déconnexion, menu mobile).
- **`NavGroup.jsx`** & **`NavItem.jsx`** : Éléments de navigation stylisés avec icônes.
- **`SearchBar.jsx`** : Champ de recherche avec autocomplétion d'adresses et de communes.
- **`Logo.jsx`** : Logo vectoriel officiel de GeoEmploi.
- **`GovBanner.jsx`** : Bannière officielle de la République Française avec devise et mentions légales.

#### 2. Cartographie & Recherche d'Offres (`components/jobs/`)
- **`JobsMap.jsx`** : Composant Leaflet interactif affichant les offres sous forme de marqueurs géolocalisés, cercle de rayon de recherche et centrage automatique.
- **`JobsListPanel.jsx`** : Liste déroulante des offres trouvées avec cartes résumées et sélection synchronisée avec la carte.
- **`JobsHeader.jsx`** : Barre de filtres (type de contrat, curseur de distance kilométrique, tri).
- **`ApplyJobModal.jsx`** : Boîte de dialogue permettant au candidat de postuler à une offre en saisissant sa lettre de motivation et en joignant son CV.
- **`ReportJobModal.jsx`** : Boîte de dialogue citoyenne pour signaler une offre suspecte à la modération.

#### 3. Espace Compte (`components/account/`)
- **`AccountHeader.jsx`** : En-tête de compte affichant les coordonnées, le rôle, et les actions rapides (export, déconnexion, suppression directe).
- **`DeleteAccountCard.jsx`** : Carte d'information dédiée au droit à l'effacement (RGPD Art. 17).
- **`DeleteAccountModal.jsx`** : Modale critique de confirmation demandant la ressaisie obligatoire du mot de passe avec indicateurs de sécurité.
- **`AccountPrivacySettings.jsx`** : Interrupteur permettant d'activer ou désactiver la géolocalisation automatique avec rappel de la purge des coordonnées.
- **`AccountSectionCard.jsx`** & **`AccountInfoRow.jsx`** : Cartes et lignes de présentation d'informations du profil.
- **`AccountActivityItem.jsx`** : Indicateur numérique d'activité.
- **`AccountFavoritesSection.jsx`** : Liste et gestion des offres enregistrées en favoris.
- **`CandidateProfileSection.jsx`** : Vue d'ensemble du profil professionnel du candidat.
- **`CandidateGeneralProfileForm.jsx`** : Formulaire d'édition des critères généraux du candidat.
- **`CandidateExperiencesSection.jsx`** & **`CandidateExperienceModal.jsx`** : Gestion des expériences professionnelles.
- **`CandidateSkillsSection.jsx`** : Gestion des compétences techniques et niveaux.
- **`CandidateApplicationsSection.jsx`** : Suivi détaillé des candidatures transmises et de leurs changements d'état.

#### 4. Espace Recruteur (`components/employer/`)
- **`EmployerDashboard.jsx`** : Tableau de bord principal du recruteur (métriques de candidatures, boutons d'action).
- **`EmployerOfferCard.jsx`** : Carte de gestion d'une offre (statut, vues, candidatures, boutons modifier/clôturer).
- **`JobOfferModal.jsx`** : Formulaire complet de publication d'une offre géolocalisée (titre, contrat, salaire, description, adresse, rayon).
- **`JobOfferLocationSection.jsx`** : Sélection et vérification cartographique de l'adresse de l'offre d'emploi.
- **`EmployerApplicationsModal.jsx`** : Consultation des candidats ayant postulé à une offre, téléchargement de leur CV et sélection du statut du candidat.
- **`EmployerApplicationCard.jsx`** : Fiche individuelle d'un candidat avec actions pour accepter, convoquer en entretien ou refuser.
- **`EmployerApplicationRejectBanner.jsx`** : Bannière de refus permettant de motiver la décision.
- **`KpiCard.jsx`** : Carte synthétique affichant un indicateur clé (offres actives, candidatures reçues).
- **`offerValidation.js`** : Règles de validation côté client du formulaire de publication d'offre.

#### 5. Administration (`components/admin/`)
- **`AdminHeader.jsx`** : En-tête du panneau d'administration.
- **`AdminStatCard.jsx`** : Indicateurs nationaux globaux.
- **`AdminOffersList.jsx`** : Liste filtrable des offres soumises à modération.
- **`AdminOfferDetailModal.jsx`** : Examen approfondi d'une offre avec boutons d'approbation ou de rejet motivé.
- **`AdminOfferStatusBadge.jsx`** : Badge visuel du statut d'une offre.
- **`AdminUsersList.jsx`** & **`AdminUserTableRow.jsx`** : Table de consultation des utilisateurs inscrits.
- **`AdminUserStatusModal.jsx`** : Modale permettant de suspendre un utilisateur avec saisie obligatoire d'un motif d'audit.

#### 6. Composants Communs (`components/common/`)
- **`Button.jsx`** : Bouton accessible conforme au DSFR avec variantes (`primary`, `secondary`, `outline`, `ghost`, `danger`), gestion d'icônes et états de chargement.
- **`Input.jsx`** & **`PasswordInput.jsx`** : Champs de saisie avec étiquettes, messages d'erreur et bascule d'affichage du mot de passe.
- **`Select.jsx`** : Liste déroulante stylisée.
- **`Alert.jsx`** : Bannières d'alerte (`info`, `success`, `warning`, `error`) dismissibles.
- **`Badge.jsx`** : Badges d'état et d'étiquettes.
- **`DataPortabilityCard.jsx`** : Carte générique de téléchargement de données RGPD Art. 20.

#### 7. Consentement & CGU (`components/geo/`, `faq/`, `cgu/`)
- **`GeolocationConsentNotice.jsx`** : Bannière informative conforme CNIL demandant le consentement préalable à la localisation.
- **`FaqAccordionItem.jsx`** & **`FaqCategoryFilter.jsx`** : Accordéons interactifs de la FAQ.
- **`TransparencyCard.jsx`** : Fiche expliquant le fonctionnement de l'algorithme.
- **`CguArticle.jsx`** : Articles juridiques stylisés pour les CGU.

---

## 5. Scripts d'Automatisation & Maintenance (`scripts/`)

- **`scripts/start.sh`** : Lance l'ensemble des conteneurs via Docker Compose (`docker compose up --build`). Accepte les options standard (ex: `-d` pour le mode détaché).
- **`scripts/stop.sh`** : Arrête proprement les conteneurs sans détruire les données.
- **`scripts/restart.sh`** : Réinitialise les volumes et relance une installation propre.
- **`scripts/clean.sh`** : Nettoie tous les conteneurs, volumes et images Docker du projet.
- **`scripts/seed.sh`** : Injecte le jeu de données de test et de démonstration (`database/seed-demo.sql`).
- **`scripts/make_admin.sh <email>`** : Attribue les privilèges d'administrateur de plateforme à un utilisateur existant.
- **`scripts/archive_data_30days.py`** : Script Python automatisé archivant les offres fermées ou expirées depuis plus de 30 jours.
- **`scripts/purge_data_90days.py`** : Script de purge définitive des données archivées au-delà de la durée légale de rétention (90 jours).
- **`scripts/regeocode-offers.py`** : Script de maintenance recalculant les coordonnées WGS84 et Lambert-93 des offres existantes à partir de l'API Adresse.

---

## 6. Guide Utilisateur Complet

### Guide Demandeur d'Emploi / Candidat

#### 1. Consultation des offres sur la carte
- Rendez-vous sur la page d'accueil ou cliquez sur **Carte des emplois**.
- Utilisez la barre de recherche pour renseigner votre commune ou département.
- Ajustez le curseur de rayon kilométrique (ex: 20 km, 50 km) et sélectionnez vos types de contrats souhaités (CDI, CDD, Alternance...).
- Cliquez sur un marqueur de la carte pour consulter les détails de l'offre (salaire, description, profil recherché).

#### 2. Création et gestion de son profil
- Cliquez sur **Me connecter** puis sur **Créer un compte**.
- Sélectionnez le profil **Candidat** et renseignez vos nom, prénom, email et mot de passe (8 caractères minimum).
- Une fois connecté, accédez à **Mon Compte** :
  - **Mon Profil Professionnel** : Précisez votre titre métier, votre disponibilité (immédiate, sous 1 mois...), vos prétentions salariales et téléchargez votre CV.
  - **Expériences & Formations** : Ajoutez vos précédentes expériences et vos diplômes.
  - **Compétences** : Renseignez vos savoir-faire avec leur niveau d'expertise.

#### 3. Postuler et suivre ses candidatures
- Sur la fiche d'une offre qui vous intéresse, cliquez sur **Postuler à cette offre**.
- Personnalisez votre lettre de motivation et vérifiez le lien de votre CV.
- Validez l'envoi : l'employeur est instantanément notifié de votre candidature.
- Consultez l'onglet **Mes Candidatures** dans votre espace pour suivre en temps réel l'évolution de votre dossier (*Envoyée*, *Consultée*, *Entretien*, *Retenue*).

#### 4. Confidentialité, Données & Suppression
- Dans l'onglet **Confidentialité & RGPD** de votre compte :
  - Vous pouvez activer ou désactiver la géolocalisation automatique d'un simple clic. La désactivation efface immédiatement vos coordonnées GPS.
  - Téléchargez l'intégralité de votre dossier numérique (format JSON normalisé) via **Exporter mes données**.
  - Pour supprimer votre compte : cliquez sur **Supprimer le compte** (dans l'en-tête ou dans la zone de danger). Une boîte de dialogue s'affiche pour vous demander de saisir votre **mot de passe actuel**. Dès validation, votre compte est anonymisé et vos données personnelles sont définitivement supprimées.

---

### Guide Recruteur / Employeur

#### 1. Inscription et vérification d'entreprise
- Cliquez sur **Me connecter** puis sur **Créer un compte**.
- Sélectionnez le profil **Entreprise / Recruteur**.
- Renseignez le nom de votre organisme et son numéro **SIRET** (14 chiffres). La validité du SIRET est vérifiée en temps réel selon l'algorithme officiel de Luhn.
- Indiquez les coordonnées et l'adresse de votre siège social.

#### 2. Publication d'une offre d'emploi
- Depuis votre espace **Mon Compte**, cliquez sur **Publier une offre d'emploi**.
- Renseignez les critères indispensables :
  - Intitulé du poste et description détaillée des missions.
  - Type de contrat (CDI, CDD, Stage, Alternance, Intérim).
  - Fourchette de rémunération brute annuelle.
  - Adresse exacte de prise de poste : la commune et les coordonnées WGS84 et Lambert-93 sont automatiquement calculées.
  - Rayon de diffusion kilométrique souhaité.
- Dès validation, l'offre apparaît immédiatement sur la carte des candidats.

#### 3. Traitement des candidatures reçues
- Votre tableau de bord affiche le nombre de candidatures reçues en temps réel.
- Cliquez sur une offre pour ouvrir la liste des candidats ayant postulé.
- Consultez la lettre de motivation et le CV de chaque postulant.
- Faites évoluer l'état de la candidature (*Candidature consultée*, *Convoqué en entretien*, *Offre proposée*, *Candidature non retenue*). En cas de refus, vous pouvez indiquer un motif respectueux et constructif. Le candidat est automatiquement notifié du changement.

#### 4. Suppression du compte employeur
- Rendez-vous sur votre espace **Mon Compte**.
- Cliquez sur **Supprimer mon compte** dans la section de confidentialité ou dans l'en-tête.
- Saisissez votre mot de passe pour confirmer.
- Conséquences immédiates : vos offres d'emploi en cours sont clôturées, les données de l'entreprise sont anonymisées et vos accès sont définitivement révoqués.

---

### Guide Administrateur de Plateforme

#### 1. Accès et élévation de privilèges
- Pour des raisons de sécurité, un compte administrateur est créé en attribuant le rôle à un utilisateur existant via le terminal :
  ```bash
  ./scripts/make_admin.sh admin@domaine.fr
  ```
- Une fois connecté, un lien **Administration** apparaît dans la barre de navigation supérieure ainsi que sur la page de compte.

#### 2. Supervision et Métriques Nationales
- Le tableau de bord d'administration présente les indicateurs clés consolidés :
  - Nombre total d'utilisateurs inscrits (répartition candidats vs employeurs).
  - Nombre d'offres actuellement en ligne.
  - Volume total de candidatures transmises.
  - Nombre de signalements citoyens en attente d'instruction.

#### 3. Modération des Offres d'Emploi
- Accédez à l'onglet **Offres d'emploi**.
- Vous pouvez inspecter le détail de chaque offre (description, coordonnées géographiques, entreprise émettrice).
- Si une offre contrevient aux règles de la plateforme (contenu trompeur, offre discriminatoire, etc.), l'administrateur peut la rejeter ou la fermer en saisissant obligatoirement le motif d'exclusion. Cette action est historisée dans les journaux d'audit (`moderation_logs`).

#### 4. Modération des Utilisateurs & Signalements
- Dans l'onglet **Utilisateurs**, recherchez un compte par email, nom ou entreprise.
- En cas de manquement grave ou de signalement avéré, cliquez sur **Gérer le statut** pour suspendre temporairement ou définitivement le compte avec notification motivée à l'intéressé.
- Traitez les signalements citoyens en classant le ticket comme *Résolu* ou *Rejeté*.
