# Infrastructure

## Pré-requis

- Docker Engine >= 24
- Docker Compose v2
- Un fichier `.env` à la racine du projet (voir `.env.example`)

## Architecture des services

Le projet est orchestré via `docker-compose.yaml`. Les services démarrent dans un ordre strict, chacun attendant que sa dépendance soit prête avant de se lancer.

```
database  -->  backend  -->  test-setup  -->  tests  -->  cleanup  -->  frontend
 (healthy)    (healthy)     (exit 0)       (exit 0)     (exit 0)
```

`test-setup`, `tests` et `cleanup` sont des conteneurs éphémères : le premier injecte les fixtures des tests e2e (compte admin + une offre active), le second exécute la suite d'API, le dernier purge les données créées par les tests. La base est donc vierge (schéma seul) quand le frontend démarre : aucun seed de démonstration n'existe.

### Ports exposés

| Service      | Port hôte | Port conteneur | Protocole |
|--------------|-----------|----------------|-----------|
| `database`   | 5432      | 5432           | TCP       |
| `backend`    | 3000      | 3000           | HTTP      |
| `frontend`   | 8080      | 80             | HTTP      |
| `test-setup` | aucun     | aucun          | -         |
| `tests`      | aucun     | aucun          | -         |
| `cleanup`    | aucun     | aucun          | -         |

### Détail des services

**database** -- `postgres:17-alpine`

Image officielle PostgreSQL. Les fichiers SQL dans `database/init/` sont exécutés automatiquement au premier démarrage (volume `postgres_data` vide). Le healthcheck utilise `pg_isready` pour signaler que la base est prête à accepter des connexions.

**backend** -- build depuis `backend/Dockerfile`

API Express.js. Ne démarre que lorsque `database` est `healthy`. Son propre healthcheck appelle `GET /api/health` en interne pour vérifier que le serveur HTTP répond. Les variables d'environnement (`DATABASE_URL`, `JWT_SECRET`, etc.) sont injectées depuis le `.env`. Aucune donnée n'est injectée au démarrage.

**test-setup** -- image `postgres:17-alpine`

Conteneur éphémère qui exécute `database/test-setup.sql` via `psql` dès que `database` est `healthy`. Il crée les fixtures nécessaires aux tests e2e (compte admin + une offre active). Idempotent, il peut être rejoué à chaque démarrage.

**tests** -- build depuis `tests/Dockerfile`

Conteneur éphémère qui exécute `vitest run` contre l'API backend via `http://backend:3000`. Ne démarre que lorsque `backend` est `healthy` et que `test-setup` s'est terminé avec succès. Le conteneur s'arrête après exécution (exit 0 = succès, exit 1 = échec).

**cleanup** -- image `postgres:17-alpine`

Conteneur éphémère exécuté après le succès de `tests`. Il purge via `psql` (`database/cleanup-test-data.sql`) tout ce que les tests et `test-setup` ont créé (fixtures, comptes `@test.local`, comptes anonymisés RGPD). La base ne conserve que les données créées par l'utilisateur.

**frontend** -- build depuis `frontend/Dockerfile`

Application Vite buildée puis servie par nginx. Ne démarre que si le conteneur `cleanup` s'est terminé avec succès (`service_completed_successfully`), c'est-à-dire si toute la chaîne de tests a réussi. Le build arg `VITE_API_URL` est injecté au moment du `npm run build`.

---

## Dockerfiles

### backend/Dockerfile

Build single-stage.

```
node:22-alpine
  -> npm ci --omit=dev    (dépendances de production uniquement)
  -> copie src/
  -> USER node            (pas de root en runtime)
  -> CMD npm start        (node src/server.js)
```

### frontend/Dockerfile

Build multi-stage.

```
Stage 1 "build" (node:22-alpine)
  -> npm ci
  -> npm run build        (génère /app/dist)

Stage 2 "production" (nginx:alpine)
  -> copie nginx.conf
  -> copie /app/dist depuis le stage build
  -> CMD nginx -g "daemon off;"
```

L'image finale ne contient que nginx et les fichiers statiques, pas node ni les sources.

### tests/Dockerfile

Build single-stage.

```
node:22-alpine
  -> npm ci               (toutes les dépendances, y compris devDependencies)
  -> copie les fichiers de test
  -> CMD npx vitest run
```

---

## Scripts

Tous les scripts sont dans `scripts/` et doivent être exécutés depuis la racine du projet.

| Script        | Commande                                                       | Description                                                                 |
|---------------|----------------------------------------------------------------|-----------------------------------------------------------------------------|
| `start.sh`    | `docker compose up --build`                                    | Build les images et démarre tous les services en mode attaché               |
| `stop.sh`     | `docker compose down`                                          | Arrête les conteneurs, supprime le réseau                                   |
| `restart.sh`  | `docker compose down --volumes` puis `docker compose up --build` | Supprime les volumes (reset de la BDD), rebuild et redémarre                |
| `clean.sh`    | `docker compose down --volumes --rmi local --remove-orphans`   | Supprime tout : conteneurs, volumes, images locales, conteneurs orphelins   |

Tous les scripts passent `"$@"` à la commande docker compose, ce qui permet d'ajouter des flags :

```bash
./scripts/start.sh -d          # démarrage en mode détaché
./scripts/start.sh backend     # démarrage du backend uniquement
```

---

## Variables d'environnement

Copier `.env.example` vers `.env` et remplir les valeurs :

```bash
cp .env.example .env
```

| Variable           | Utilisé par          | Description                              |
|--------------------|----------------------|------------------------------------------|
| `POSTGRES_DB`      | database             | Nom de la base de données                |
| `POSTGRES_USER`    | database             | Utilisateur PostgreSQL                   |
| `POSTGRES_PASSWORD`| database             | Mot de passe PostgreSQL                  |
| `DATABASE_URL`     | backend              | Connection string complète               |
| `JWT_SECRET`       | backend              | Clé de signature des tokens JWT          |
| `JWT_EXPIRES_IN`   | backend              | Durée de validité des tokens (ex: `7d`)  |
| `CORS_ORIGIN`      | backend              | Origine autorisée pour les requêtes CORS |

---

## Réseau

Tous les services partagent le réseau Docker `geoemploi-network`. Les conteneurs se joignent par leur nom de service (`database`, `backend`, `frontend`). Les ports exposés sur l'hôte sont uniquement nécessaires pour l'accès depuis la machine locale.

## Volumes

| Volume          | Monté dans                        | Rôle                                        |
|-----------------|-----------------------------------|---------------------------------------------|
| `postgres_data` | `/var/lib/postgresql/data`        | Persistance des données PostgreSQL          |
| `database/init` | `/docker-entrypoint-initdb.d` (ro)| Scripts SQL d'initialisation (read-only)    |

Le volume `postgres_data` est un volume Docker nommé. Les scripts d'init ne sont exécutés que si le volume est vide (premier démarrage ou après un `clean.sh`/`restart.sh`).
