> **Epitech · `G-SVR-500` (« survivor »)** — projet d'équipe mené avec
> [cray06](https://github.com/cray06),
> [TheSpectre07](https://github.com/TheSpectre07),
> [Romanecauvez](https://github.com/Romanecauvez) et
> [Enzo-senechal](https://github.com/Enzo-senechal).
>
> **Mon rôle :** backend, base de données et déploiement.
>
> Ce dépôt est ma copie personnelle du rendu, publiée comme projet de portfolio.
> Le dépôt d'origine est privé.

---

# GeoEmploi

Application web de mise en relation entre demandeurs d'emploi et employeurs, avec des offres d'emploi géolocalisées sur une carte interactive. Projet EPITECH pour le « Ministère du Job et Bonheur ».

## Fonctionnalités

- **Consultation libre** de la carte et des offres, sans compte.
- **Demandeur d'emploi** : profil professionnel, recherche géolocalisée, candidature sécurisée (compte obligatoire), suivi des candidatures.
- **Employeur** : compte vérifié, publication d'offres géolocalisées, gestion des candidatures, tableau de bord (vues, candidatures reçues).
- **Administration** : modération des offres, gestion des comptes, tableau de bord de métriques nationales.
- **Archivage automatique** des offres expirées depuis plus de 30 jours.
- **Notification** à l'employeur à chaque nouvelle candidature.
- Conformité **RGPD** : mention d'information sur la localisation, suppression de compte, pas de conservation au-delà de la durée d'utilisation active.

## Stack technique

| Rôle | Technologie |
|------|-------------|
| Frontend | React (Vite), Tailwind CSS |
| Client HTTP | `fetch` natif |
| Cartographie | Leaflet (react-leaflet) + OpenStreetMap + API Adresse |
| Backend | Node.js + Express.js |
| Base de données | PostgreSQL |
| Accès BDD | SQL pur (driver `pg` / node-postgres) |
| Authentification | JWT (`jsonwebtoken`) |
| Hachage | `argon2` |
| Tâches planifiées | `node-cron` |
| Doc API | Swagger (`swagger-ui-express` + `swagger-jsdoc`) |
| DevOps | Docker Compose & Git |

## Architecture

Le projet est orchestré via `docker-compose.yaml` avec un ordre de démarrage strict :

```
database (postgres:17) --> backend (Express) --> test-setup (fixtures e2e) --> tests (Vitest, exit 0) --> cleanup (purge) --> frontend (nginx)
```

Les conteneurs `test-setup`, `tests` et `cleanup` sont éphémères : `test-setup` injecte les fixtures nécessaires aux tests (compte admin + une offre active), `tests` exécute la suite d'API et `cleanup` purge ces données. Le frontend ne démarre que si toute la chaîne réussit. Aucune donnée de démonstration n'est injectée : la base est vierge à la mise en service (schéma seul). Détails dans [`docs/infrastructure.md`](docs/infrastructure.md).

### Ports exposés

| Service    | Port hôte |
|------------|-----------|
| `database` | 5432      |
| `backend`  | 3000      |
| `frontend` | 8080      |

## Prérequis

- Docker Engine >= 24
- Docker Compose v2

## Démarrage rapide

```bash
cp .env.example .env   # puis renseigner les valeurs
./scripts/start.sh -d  # build + démarrage en détaché
```

L'application est alors disponible sur <http://localhost:8080>.

### Documentation de l'API

L'API embarque une documentation interactive (Swagger UI) sur <http://localhost:3000/api-docs> : chaque route y est testable, avec ses paramètres et ses schémas de requête/réponse.

### Base de données vierge

Aucune donnée de démonstration n'est injectée au démarrage : la base ne contient que le schéma (`database/init/`). Pour obtenir un compte administrateur, s'inscrire puis le promouvoir via `./scripts/make_admin.sh <email>` (voir `docs/backend.md` pour les routes API).

Pour disposer d'un jeu de démonstration (admin, employeur vérifié, candidat et offres géolocalisées), injecter le fichier `database/seed-demo.sql` :

```bash
./scripts/seed.sh
```

## Scripts

Depuis la racine du projet :

| Commande                | Description                                                  |
|-------------------------|--------------------------------------------------------------|
| `./scripts/start.sh`    | Build et démarre tous les services                           |
| `./scripts/stop.sh`     | Arrête les conteneurs                                        |
| `./scripts/restart.sh`  | Reset BDD (volumes) + rebuild + redémarrage                  |
| `./scripts/clean.sh`    | Supprime conteneurs, volumes et images locales               |
| `./scripts/seed.sh`     | Injecte le jeu de démonstration (`database/seed-demo.sql`)   |
| `docker compose logs -f backend` | Suivre les logs d'un service                         |

Les scripts acceptent les arguments de `docker compose` (ex. `./scripts/start.sh -d`).

## Développement en local

```bash
# Backend (http://localhost:3000)
cd backend
npm install
npm run dev

# Frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Lint du frontend : `cd frontend && npm run lint`.

## Variables d'environnement

Copier `.env.example` vers `.env` :

| Variable            | Description                              |
|---------------------|------------------------------------------|
| `POSTGRES_DB`       | Nom de la base de données                |
| `POSTGRES_USER`     | Utilisateur PostgreSQL                   |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL                  |
| `DATABASE_URL`      | Connection string complète               |
| `JWT_SECRET`        | Clé de signature des tokens JWT          |
| `JWT_EXPIRES_IN`    | Durée de validité des tokens (ex. `7d`)  |
| `CORS_ORIGIN`       | Origine autorisée pour les requêtes CORS |

## Structure du projet

```
backend/       API Express (config/, middleware/, modules/, utils/)
database/      Scripts SQL d'init (exécutés au premier démarrage)
docs/          Documentation technique (infrastructure, conventions)
frontend/      Application React/Vite (servie par nginx en production)
scripts/       Scripts Docker (start, stop, restart, clean)
tests/         Tests d'intégration de l'API (Vitest)
```

## Documentation

- [`docs/choix_techniques.md`](docs/choix_techniques.md) — synthèse des choix techniques (support de présentation)
- [`docs/tests.md`](docs/tests.md) — guide complet des tests d'intégration et E2E (60 tests Vitest)
- [`docs/infrastructure.md`](docs/infrastructure.md) — architecture Docker
- [`docs/backend.md`](docs/backend.md) — choix techniques et liste des routes API
- [`docs/note_deploiement.md`](docs/note_deploiement.md) — note de déploiement et cadrage d'infrastructure (Direction)
- [`docs/commit_convention.md`](docs/commit_convention.md) — conventions de commit

