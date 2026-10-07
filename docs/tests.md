# Inscription (`POST /api/auth/register`)
1. **`inscrit un candidat avec profil` :** Crée un compte candidat avec `first_name` et `last_name` ; vérifie le code 201, la présence d'un token JWT et `role: "candidate"`.
2. **`inscrit un employeur avec profil` :** Crée un compte employeur avec raison sociale `company_name` ; vérifie le code 201 et `role: "employer"`.
3. **`rejette un email invalide` :** Tente l'inscription avec `email: "pas-un-email"` ; vérifie le code 400 (Bad Request).
4. **`rejette un mot de passe trop court` :** Envoie un mot de passe de moins de 8 caractères ; vérifie le rejet avec le code 400.
5. **`rejette un doublon de email` :** Tente d'inscrire deux fois le même email ; vérifie que la seconde tentative renvoie un code 400 pour violation d'unicité.

#### Connexion (`POST /api/auth/login`)
6. **`connecte et renvoie un token + rôle` :** Vérifie que des identifiants valides retournent un code 200, un JWT et les informations de l'utilisateur.
7. **`rejette un mauvais mot de passe` :** Tente une authentification avec un mot de passe erroné ; vérifie le retour 401 Unauthorized.
8. **`connecte l’admin seed avec le rôle admin` :** Valide la connexion du compte administrateur technique (`admin@test.local` / `Admin123!`) avec le rôle `admin`.

#### Profil Utilisateur Connecté (`GET /api/users/me`)
9. **`renvoie le profil de l’utilisateur connecté` :** Vérifie que la route retourne les informations du compte connecté et les détails du profil.
10. **`refuse sans token` :** Vérifie qu'un appel sans en-tête `Authorization` est rejeté en 401.

#### Droit à l'Oubli RGPD (`DELETE /api/users/me` — Art. 17)
11. **`supprime et anonymise le compte` :** Appelle la suppression avec le token de session ; vérifie le code HTTP 204 (No Content) et vérifie qu'une tentative ultérieure de connexion échoue immédiatement en 401.
12. **`rejette un mauvais mot de passe lors de la suppression` :** Vérifie qu'une confirmation de suppression avec un mot de passe erroné est refusée (401).

#### Droit à la Portabilité des Données (`GET /api/users/me/export` — Art. 20)
13. **`exporte les données du compte candidat au format JSON` :** Vérifie la présence des blocs structurés `metadata` (`role: "candidate"`), `account` (email), `profile`, et `activities`.
14. **`exporte les données du compte employeur au format JSON` :** Vérifie l'export des données de l'entreprise, y compris ses coordonnées WGS84 (`latitude`, `longitude`) et ses coordonnées projetées **Lambert-93** (`lambert93_x`, `lambert93_y`).
15. **`exporte les données du compte administrateur au format JSON` :** Vérifie l'export structuré pour un compte de rôle `admin`.
16. **`refuse sans token` :** Vérifie le rejet en 401 pour tout accès non authentifié à l'export.
17. **`inclut les coordonnées Lambert-93 dans les offres publiées exportées` :** Vérifie que l'activité `published_offers` de l'employeur contient les coordonnées légales en projection métrique française Lambert-93 (EPSG:2154) avec valeurs numériques non nulles.

#### Consentement de Géolocalisation (`PATCH /api/users/me/preferences`)
18. **`active puis désactive la géolocalisation avec succès` :** Teste le basculement dynamique du consentement (`geolocation_enabled: true` puis `false`) et vérifie la persistance immédiate de la valeur sur `GET /api/users/me`.
19. **`refuse une valeur non booléenne` :** Tente d'envoyer une chaîne au lieu d'un booléen (`geolocation_enabled: "oui"`) ; vérifie le rejet avec le code 400.

---

### 5.3. Recherche et Consultation d'Offres — [tests/offers.test.js](file:///home/gabriel/Documents/Third_year/survivor/G-SVR-500-LIL-5-1-survivor-5/tests/offers.test.js) (8 tests)

Valide le moteur de recherche public d'offres d'emploi, les calculs spatiaux et l'étanchéité des offres non approuvées.

#### Recherche Publique (`GET /api/offers`)
1. **`renvoie les offres actives sans authentification` :** Vérifie que la recherche est ouverte à tous (200), paginée, et que les offres retournées contiennent titre et coordonnées GPS, tout en masquant le champ interne `status`.
2. **`filtre par mot-clé` :** Recherche avec `?keyword=DevOps` et vérifie que chaque offre retournée contient le mot-clé dans son titre ou sa description.
3. **`filtre par type de contrat` :** Recherche avec `?contract_type=CDI` et valide que 100 % des résultats correspondent au filtre.
4. **`rejette un contract_type invalide` :** Envoie `?contract_type=INVALID` ; vérifie le code 400.
5. **`filtre par rayon autour d’un point` :** Requête spatiale (`?lat=48.8566&lng=2.3522&radius=10`) ; calcule la distance euclidienne/haversine pour chaque résultat et garantit qu'aucune offre ne dépasse le rayon de 10 km.

#### Détail d'une Offre (`GET /api/offers/:id`)
6. **`renvoie le détail d’une offre active et incrémente les vues` :** Vérifie le code 200, la présence du nom de l'entreprise (`company_name`) et de la liste des tags.
7. **`renvoie 404 pour une offre inexistante` :** Requête sur l'identifiant `999999999` ; vérifie le statut 404 Not Found.
8. **`ne renvoie pas une offre en attente de modération` :** Crée une offre (statut `pending_moderation`) et vérifie qu'une tentative de consultation publique anonyme renvoie 404 tant que l'offre n'a pas été modérée et approuvée par un administrateur.

---

### 5.4. Espace Recruteur / Employeur — [tests/employer.test.js](file:///home/gabriel/Documents/Third_year/survivor/G-SVR-500-LIL-5-1-survivor-5/tests/employer.test.js) (7 tests)

Vérifie la gestion du profil recruteur, la procédure d'accréditation SIRET, la publication d'annonces et l'isolation des données entre entreprises concurrentes.

#### Profil Employeur
1. **`récupère et met à jour son profil` :** Vérifie l'état initial `verification_status: "unverified"`, puis met à jour le secteur d'activité et la description via `PUT /api/employer/profile`.

#### Vérification d'Activité SIRET
2. **`soumet une vérification avec SIRET puis est approuvé par l’admin` :** Soumet un numéro SIRET à 14 chiffres via `POST /api/employer/verification` (statut `pending`), puis simule l'approbation administrative ; vérifie que le profil passe en statut `verified`.
3. **`exige un SIRET` :** Envoie un corps de requête vide ; vérifie le code 400.

#### Gestion des Offres
4. **`refuse la création d’offre à un employeur non vérifié` :** Vérifie qu'un recruteur non vérifié se voit refuser la publication d'une offre avec une erreur 403 Forbidden.
5. **`crée, liste et ferme une offre en tant qu’employeur vérifié` :** Vérifie la création d'une offre (qui démarre en `pending_moderation`), son apparition dans la liste des offres de l'employeur avec ses tags, puis sa clôture via `DELETE /api/employer/offers/:id` (204).
6. **`ne modifie pas une offre qui n’est pas à soi` :** Crée une offre avec l'employeur A ; tente de la supprimer avec le token de l'employeur B ; vérifie que l'opération est bloquée en 404 (isolation stricte par entreprise).

#### Tableau de Bord
7. **`renvoie les métriques de l’employeur` :** Interroge `GET /api/employer/dashboard` et vérifie la présence du total de vues accumulées (`total_views`).

---

### 5.5. Candidatures & Notifications — [tests/applications.test.js](file:///home/gabriel/Documents/Third_year/survivor/G-SVR-500-LIL-5-1-survivor-5/tests/applications.test.js) (9 tests)

Valide le flux complet de mise en relation entre candidats et recruteurs, la transmission sécurisée des dossiers et le système de notifications.

#### Dépôt de Candidature (`POST /api/applications`)
1. **`candidater à une offre active` :** Envoie une candidature avec lettre de motivation ; vérifie le code 201 et le statut initial `sent`.
2. **`refuse une candidature en doublon` :** Tente de postuler une seconde fois à la même offre ; vérifie le rejet avec le code 409 Conflict.
3. **`refuse une candidature sur une offre en attente` :** Tente de postuler sur une offre au statut `pending_moderation` ; vérifie le rejet avec le code 409.
4. **`refuse sans authentification` :** Vérifie le rejet en 401 si aucun jeton candidat n'est fourni.

#### Suivi Candidat (`GET /api/applications/my-applications`)
5. **`liste les candidatures du candidat avec le détail de l’offre` :** Vérifie que le candidat retrouve l'ensemble de ses candidatures avec les métadonnées de l'offre (titre de l'offre `offer_title`).

#### Traitement par le Recruteur & Notifications
6. **`l’employeur voit la candidature et change son statut` :**
   * L'employeur consulte les candidatures reçues (`GET /api/employer/offers/:id/applications`).
   * Il modifie le statut en `shortlisted` avec une note d'évaluation.
   * Vérifie qu'une notification de type `application_status_change` est automatiquement injectée dans la boîte de notifications du candidat.
   * Vérifie que le candidat peut marquer la notification comme lue (`is_read: true`).
7. **`l’employeur reçoit une notification à chaque candidature` :** Vérifie que le recruteur reçoit instantanément une notification `new_application` dès qu'un candidat postule à son offre.
8. **`refuse le changement de statut par un autre employeur` :** Vérifie qu'un employeur concurrent essayant de modifier le statut d'une candidature qui ne lui appartient pas reçoit une erreur 403 Forbidden.
9. **`transmission complète du profil (compétences, expériences, disponibilité) et décision employeur (acceptée, refusée)` :**
   * Le candidat enrichit son profil (titre, bio, disponibilité `immediate`, téléphone, lien CV), ajoute une compétence (`PostgreSQL`, niveau 5) et une expérience professionnelle (`Tech SAS`).
   * Il dépose sa candidature.
   * L'employeur consulte le dossier complet et vérifie que toutes les compétences, expériences et disponibilités sont fidèlement restituées.
   * L'employeur accepte la candidature (`status: "accepted"`).
   * Le candidat consulte son espace personnel et constate que sa candidature est bien marquée `accepted`.

---

### 5.6. Administration & Modération — [tests/admin.test.js](file:///home/gabriel/Documents/Third_year/survivor/G-SVR-500-LIL-5-1-survivor-5/tests/admin.test.js) (9 tests)

Vérifie les prérogatives des comptes administrateurs : supervision nationale, modération des offres, suspension d'utilisateurs et traitement des signalements.

#### Métriques Système (`GET /api/admin/metrics`)
1. **`renvoie les métriques nationales pour un admin` :** Vérifie la présence des indicateurs consolidés : `job_offers`, `users`, `applications`, et `pending_reports`.
2. **`refuse l’accès à un non-admin` :** Vérifie qu'un candidat tentant d'accéder aux métriques d'administration est bloqué avec une erreur 403 Forbidden.

#### Modération des Utilisateurs
3. **`liste les utilisateurs avec filtres` :** Filtre la liste des utilisateurs par rôle (`?role=candidate`) et vérifie la conformité de chaque élément retourné.
4. **`suspend puis réactive un compte` :**
   * L'administrateur suspend un utilisateur (`status: "suspended"`) avec motif obligatoire.
   * Vérifie que l'utilisateur suspendu se voit refuser l'accès à la connexion avec un code 403.
   * L'administrateur réactive le compte (`status: "active"`).
   * L'accès est de nouveau autorisé.
5. **`recherche un utilisateur par nom ou raison sociale` :** Recherche avec `?search=SuperEntrepriseRecherche` et valide le filtrage textuel.

#### Modération des Annonces
6. **`approuve une offre en attente via l’admin` :**
   * L'administrateur consulte la file d'attente (`GET /api/admin/offers?status=pending_moderation`).
   * Vérifie l'exactitude des coordonnées géographiques projetées **Lambert-93** calculées automatiquement (`lambert93_x`, `lambert93_y`).
   * L'administrateur valide l'offre (`action: "approve"`).
   * L'offre passe au statut `active` et reçoit un horodatage `published_at`.
7. **`rejette une offre avec motif` :**
   * L'administrateur rejette une annonce non conforme (`action: "reject"`, motif `Annonce non conforme`).
   * L'offre passe en `rejected` avec conservation du motif dans `rejected_reason`.
   * Vérifie que l'offre devient immédiatement inaccessible au public (404).

#### Signalements de Fraude (`/api/reports`)
8. **`signale une offre puis l’admin la traite` :**
   * Un utilisateur signale une offre suspecte (`POST /api/reports`, motif `fraud`).
   * L'administrateur retrouve le signalement dans sa file de traitement (`GET /api/admin/reports?status=pending`).
   * L'administrateur résout le signalement (`status: "resolved"`).
9. **`rejette un signalement sans raison valide` :** Envoie un motif de signalement non répertorié dans la liste autorisée ; vérifie le code 400.

---

### 5.7. Géoservices & Cache Tuiles — [tests/geo.test.js](file:///home/gabriel/Documents/Third_year/survivor/G-SVR-500-LIL-5-1-survivor-5/tests/geo.test.js) (7 tests)

Couvre l'intégration avec l'API Base Adresse Nationale (BAN) et le proxy haute performance de tuiles cartographiques de l'IGN.

#### Géocodage BAN (`POST /api/geo/geocode`)
1. **`exige une adresse (q)` :** Corps vide sans paramètre de recherche `q` ; vérifie le code 400.
2. **`rejette un q trop court` :** Recherche avec `q: "a"` (moins de 3 caractères) ; vérifie le code 400.

#### Géocodage Inverse (`POST /api/geo/reverse`)
3. **`exige latitude et longitude` :** Omission de la longitude ; vérifie le rejet avec le code 400.
4. **`valide les bornes des coordonnées` :** Coordonnées impossibles (`latitude: 95`, `longitude: 200`) ; vérifie le code 400.

#### Proxy & Cache Tuiles WMTS IGN (`GET /api/geo/tiles/:z/:x/:y.png`)
5. **`rejette des coordonnées invalides ou négatives` :** Requête avec `z: -1` ; vérifie le code 400.
6. **`rejette un niveau de zoom trop élevé` :** Requête avec `z: 99` ; vérifie le rejet avec le code 400.
7. **`récupère une tuile valide avec cache (MISS puis HIT)` :**
   * Premier appel sur une tuile IGN : retourne un code 200, un `Content-Type: image/png` et un en-tête `x-cache`.
   * Second appel identique : vérifie que la tuile est servie instantanément depuis le cache en mémoire ou disque avec l'en-tête `x-cache: HIT_*`.

---

## 6. Synthèse Matricielle de la Couverture

| Domaine | Fichier | Tests | Rôles Testés | Principaux Codes HTTP Vérifiés | Points Remarquables |
|:---|:---|:---:|:---|:---|:---|
| **Disponibilité** | [health.test.js](file:///home/gabriel/Documents/Third_year/survivor/G-SVR-500-LIL-5-1-survivor-5/tests/health.test.js) | 1 | Public | `200` | Sonde de vie et connectivité DB |
| **Sécurité & RGPD** | [auth.test.js](file:///home/gabriel/Documents/Third_year/survivor/G-SVR-500-LIL-5-1-survivor-5/tests/auth.test.js) | 19 | Candidat, Recruteur, Admin, Anonyme | `200`, `201`, `204`, `400`, `401` | Hachage Argon2id, Art. 17 (droit à l'oubli), Art. 20 (portabilité JSON structurée), Coordonnées Lambert-93 |
| **Offres Publiques** | [offers.test.js](file:///home/gabriel/Documents/Third_year/survivor/G-SVR-500-LIL-5-1-survivor-5/tests/offers.test.js) | 8 | Public, Recruteur | `200`, `201`, `400`, `404` | Filtrage géographique par rayon (km), masquage du statut interne, compteurs de vues |
| **Espace Entreprise** | [employer.test.js](file:///home/gabriel/Documents/Third_year/survivor/G-SVR-500-LIL-5-1-survivor-5/tests/employer.test.js) | 7 | Recruteur, Admin | `200`, `201`, `204`, `400`, `403`, `404` | Vérification légale SIRET, blocage d'offres non vérifiées, herméticité inter-entreprises |
| **Recrutement** | [applications.test.js](file:///home/gabriel/Documents/Third_year/survivor/G-SVR-500-LIL-5-1-survivor-5/tests/applications.test.js) | 9 | Candidat, Recruteur | `200`, `201`, `401`, `403`, `409` | Anti-doublon, transmission compétences/expériences/disponibilité, notifications bidirectionnelles |
| **Supervision** | [admin.test.js](file:///home/gabriel/Documents/Third_year/survivor/G-SVR-500-LIL-5-1-survivor-5/tests/admin.test.js) | 9 | Administrateur, Candidat, Recruteur | `200`, `201`, `400`, `403`, `404` | Métriques nationales, suspension d'utilisateurs, modération d'annonces, traitement des signalements |
| **Services Carto** | [geo.test.js](file:///home/gabriel/Documents/Third_year/survivor/G-SVR-500-LIL-5-1-survivor-5/tests/geo.test.js) | 7 | Public | `200`, `400` | Validation d'adresses BAN, validation de bornes GPS, stratégie de cache WMTS IGN (MISS -> HIT) |
| **Total** | **7 fichiers** | **60 tests** | **Tous rôles** | — | **Couverture E2E exhaustive** |

---

## 7. Guide de Dépannage et Résolution d'Incidents

### 7.1. L'erreur `admin login failed: {"error":"Email ou mot de passe incorrect"}`
* **Cause :** La table `users` n'a pas été préparée avec le compte administrateur technique `admin@test.local`.
* **Solution :** Exécuter le script de configuration initiale :
  ```bash
  docker compose exec -T database psql -U geoemploi -d geoemploi < database/test-setup.sql
  ```

### 7.2. L'erreur `expected 0 to be greater than 0` sur les offres publiques
* **Cause :** Aucune offre active n'est présente en base pour les tests de consultation.
* **Solution :** Vérifier que [database/test-setup.sql](file:///home/gabriel/Documents/Third_year/survivor/G-SVR-500-LIL-5-1-survivor-5/database/test-setup.sql) a bien inséré l'offre technique active `Développeur Full-Stack React/Node` rattachée au profil de test.

### 7.3. Ajouter un nouveau test dans la suite
1. Localiser le fichier thématique correspondant dans `tests/` (ou créer un nouveau fichier `tests/<domaine>.test.js`).
2. Importer systématiquement les helpers :
   ```javascript
   import { describe, it, expect } from 'vitest';
   import { api, registerAndLogin } from './helpers.js';
   ```
3. Utiliser des comptes créés dynamiquement via `registerAndLogin('candidate')` ou `registerAndLogin('employer')` pour éviter tout conflit de concurrence.
4. Lancer `npm test` pour valider l'exécution locale avant tout commit.
