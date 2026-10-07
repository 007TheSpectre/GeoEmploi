# Choix Techniques Backend — GéoEmploi

Ce document détaille et justifie les choix d'architecture et de technologies effectués pour le développement de l'API Backend de **GéoEmploi**.

---

## 1. Runtime et Framework Principal

### Node.js (v22 LTS)
* **Modèle d'E/S non bloquant (Event-Driven Async)** : Idéal pour les applications web centrées sur les requêtes I/O (requêtes HTTP, requêtes base de données PostgreSQL). Node.js permet d'exécuter un grand nombre de requêtes simultanées avec une empreinte mémoire faible.
* **Langage Unifié (JavaScript ES Modules)** : L'utilisation de JavaScript (ESM) sur le frontend (Vite/React ou Vanilla) et le backend simplifie le partage de modèles de données, de logiques de validation et réduit la charge cognitive de l'équipe de développement.
* **Écosystème Mature (NPM)** : Accès à un écosystème riche et testé par l'industrie pour les fonctionnalités clés (sécurité, base de données, documentation).

### Express.js (v5)
* **Simplicité et Minimalisme** : Express est un framework volontairement léger qui ne nous impose pas d'abstractions complexes ni d'architecture rigide. Il permet de mettre en place rapidement des routes et des middlewares clairs.
* **Gestion des Middlewares** : Permet de modulariser facilement le traitement des requêtes (parsing JSON, gestion des erreurs, vérification des tokens JWT, en-têtes de sécurité, etc.).
* **Fiabilité et Adoption** : C'est le standard de facto du monde Node.js, bénéficiant d'une excellente stabilité, de performances éprouvées et d'une prise en main immédiate par l'équipe.

---

## 2. Documentation et Contrat d'API (Swagger / OpenAPI)

Une API propre nécessite un contrat clair et accessible à la fois pour les développeurs frontend et pour l'intégration continue.

### OpenAPI 3.0 / `swagger-jsdoc`
* **Doc-as-Code** : La documentation des endpoints est rédigée directement dans le code source via des annotations JSDoc (blocs `@openapi`). Cela garantit que la documentation évolue au même rythme que le code et évite la désynchronisation courante avec des fichiers externes isolés.
* **Normalisation (Standard OpenAPI 3.0)** : Garantit la conformité de l'API avec un standard international ouvert, réutilisable pour générer des SDKs ou des tests automatisés.

### Interface Interactive (`swagger-ui-express`)
* **Endpoint `/api-docs`** : L'API embarque une interface utilisateur Swagger interactive accessible directement sur le serveur.
* **Facilité de Test** : Permet aux développeurs frontend de visualiser l'ensemble des routes, leurs paramètres, modèles de requêtes/réponses, et de tester directement les endpoints HTTP sans outil externe (comme Postman or Insomnia).

---

## 3. Base de Données et Accès aux Données

### PostgreSQL et Driver `pg` (Node-Postgres)
* **PostgreSQL** : Système de gestion de base de données relationnelle robuste, parfait pour structurer les entités métier (utilisateurs, offres d'emploi, candidatures) et gérer les données géographiques/spatiales.
* **Driver natif `pg` avec Pool de connexions** :
  * Utilisation directe de SQL natif via un pool de connexions (`pg.Pool`), offrant un contrôle total sur les requêtes et optimisant le temps de réponse.
  * Absence d'ORM lourd : Évite la surcouche d'abstraction complexe et améliore les performances brutes lors des requêtes complexes.

---

## 4. Sécurité et Authentification

* **Authentification JWT (`jsonwebtoken`)** : Système de jetons d'accès stateless. Évite le stockage de sessions côté serveur et facilite la montée en charge.
* **Hachage de Mots de Passe (`argon2`)** : Utilisation du standard moderne recommandé par l'OWASP (gagnant du Password Hashing Competition), plus sécurisé contre les attaques par force brute (GPU/ASIC) que le traditionnel `bcrypt`.
* **Securisation des En-têtes HTTP (`helmet`)** : Middleware configurant automatiquement les en-têtes HTTP sécurisés (X-Content-Type-Options, X-Frame-Options, etc.).
* **Gestion du CORS (`cors`)** : Restriction contrôlée de la politique de partage des ressources entre origines pour protéger l'API contre les requêtes non autorisées.

---

## 5. Architecture du Code

Le backend est structuré selon un pattern **Modulaire / Layered Architecture** sous `src/` :

```text
src/
├── app.js            # Configuration de l'application Express et des middlewares globaux
├── server.js         # Démarrage du serveur HTTP et écoute sur le port
├── config/           # Configurations (Swagger, Base de données, etc.)
├── middleware/       # Middlewares personnalisés (Auth, Validation, Erreurs)
├── modules/          # Découpage par domaine fonctionnel (Auth, Jobs, Employers...)
└── utils/            # Fonctions utilitaires partagées
```

---

## 6. Containerisation et Production

* **Docker & Image Alpine (`node:22-alpine`)** : Réductions des vulnérabilités et de la taille de l'image.
* **Healthcheck Dédié (`/api/health`)** : Endpoint léger permettant à Docker-Compose et aux orchestrateurs de vérifier la santé du service.

---

## 7. Routes API

La documentation interactive complète est disponible sur `/api-docs` (Swagger UI). Vue d'ensemble par domaine :

### Public (sans compte)
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/offers` | Recherche d'offres actives (lat/lng/radius, keyword, contract_type, commune, département) |
| GET | `/api/offers/:id` | Détail d'une offre (incrémente les vues journalières) |
| POST | `/api/geo/geocode` | Géocodage d'adresse via la BAN (retourne WGS84 + Lambert-93) |
| POST | `/api/geo/reverse` | Géocodage inverse (coordonnées WGS84 → adresse) |
| POST | `/api/reports` | Signalement d'une offre (authentification optionnelle) |

### Authentification & compte
| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/api/auth/register` | public | Inscription candidat ou employeur (profil créé en transaction) |
| POST | `/api/auth/login` | public | Connexion → JWT (rôle admin dérivé de la table `admins`) |
| POST | `/api/auth/forgot-password` | public | Demande de réinitialisation (token en base) |
| POST | `/api/auth/reset-password` | public | Réinitialisation du mot de passe |
| GET | `/api/users/me` | auth | Profil connecté (compte + profil métier) |
| DELETE | `/api/users/me` | auth | Suppression RGPD (soft-delete + anonymisation) |

### Demandeur d'emploi
| Méthode | Route | Description |
|---|---|---|
| GET/PUT | `/api/candidate/profile` | Profil candidat (compétences, disponibilité, localisation) |
| CRUD | `/api/candidate/experiences` | Expériences professionnelles |
| CRUD | `/api/candidate/educations` | Formations |
| CRUD | `/api/candidate/skills` | Compétences |
| POST | `/api/applications` | Candidature (une seule par offre, notifie l'employeur) |
| GET | `/api/applications/my-applications` | Suivi des candidatures |

### Employeur
| Méthode | Route | Description |
|---|---|---|
| GET/PUT | `/api/employer/profile` | Profil entreprise |
| POST | `/api/employer/verification` | Demande de vérification d'activité (SIRET) |
| GET/POST | `/api/employer/offers` | Offres (création → `pending_moderation`, employeur vérifié requis) |
| PUT/DELETE | `/api/employer/offers/:id` | Édition / fermeture d'une offre |
| GET | `/api/employer/offers/:id/applications` | Candidatures reçues pour une offre |
| PATCH | `/api/employer/applications/:id/status` | Changement de statut (+ historique + notification) |
| GET | `/api/employer/dashboard` | Tableau de bord (vues, candidatures) |

### Notifications
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/notifications` | Notifications de l'utilisateur connecté |
| PATCH | `/api/notifications/:id/read` | Marquer comme lue |
| PATCH | `/api/notifications/read-all` | Tout marquer comme lu |

### Administration
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/admin/metrics` | Métriques nationales |
| GET | `/api/admin/users` | Liste des utilisateurs (filtres) |
| PATCH | `/api/admin/users/:id/status` | Suspendre / réactiver un compte |
| GET | `/api/admin/offers` | File de modération |
| PATCH | `/api/admin/offers/:id/moderate` | Approuver, rejeter ou fermer une offre |
| GET | `/api/admin/reports` | Liste des signalements |
| PATCH | `/api/admin/reports/:id/status` | Traiter un signalement |
| PATCH | `/api/admin/employers/:id/verification` | Valider / refuser la vérification d'un employeur |

### Tâches planifiées (node-cron)
- **Horaire** : offre active dont `expires_at` est dépassée → statut `expired`.
- **Quotidien (3h)** : offre `expired` depuis plus de 30 jours → statut `closed` (archivage automatique).
