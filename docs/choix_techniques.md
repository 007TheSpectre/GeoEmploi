# Choix Techniques — GéoEmploi

Ce document synthétise et justifie les choix technologiques du projet **GéoEmploi**.
Il est conçu pour accompagner une présentation orale ou un support de slides.

---

## Frontend — React + Vite + Tailwind CSS

| Technologie | Justification |
|:---|:---|
| **React** | Bibliothèque UI déclarative et composable. Permet de construire une interface modulaire (composants réutilisables : `Button`, `Input`, `Badge`, `Alert`…) et de maintenir un état applicatif clair (carte interactive, formulaires, filtres). |
| **Vite** | Outil de build ultra-rapide basé sur ESBuild. Le Hot Module Replacement (HMR) est quasi instantané, ce qui accélère considérablement le cycle de développement sur un projet de 2 semaines. |
| **Tailwind CSS** | Framework CSS utility-first. Évite la multiplication de fichiers CSS séparés : tout le style est co-localisé directement dans le JSX, ce qui facilite la lecture, la maintenance et la cohérence visuelle du code. |
| **Pas de Next.js** | Next.js apporte du Server-Side Rendering et du pré-rendu statique, mais cette complexité supplémentaire (routing serveur, API routes, configuration SSR) n'est pas justifiée pour un projet de 2 semaines. Notre application est une SPA classique servie par Nginx, plus simple à déployer et à déboguer. |
| **Leaflet (react-leaflet)** | Bibliothèque cartographique légère et open-source. Intégration native avec OpenStreetMap (pas de clé API payante), support des couches GeoJSON pour le découpage territorial (départements, arrondissements). |

---

## Backend — Node.js + Express.js

| Technologie | Justification |
|:---|:---|
| **Node.js (v22 LTS)** | Runtime JavaScript côté serveur. Langage unifié front/back (JavaScript ES Modules), ce qui réduit la charge cognitive de l'équipe et simplifie le partage de logiques de validation. Modèle d'I/O non bloquant adapté aux applications web centrées sur les requêtes HTTP et base de données. |
| **Express.js (v5)** | Framework minimaliste et standard de facto du monde Node.js. Tout le monde dans l'équipe a travaillé avec Express en Tek 1, donc tout le monde est capable de comprendre et de contribuer au backend immédiatement sans courbe d'apprentissage. |
| **SQL pur (`pg`)** | Pas d'ORM (pas de Sequelize, pas de Prisma). Le driver `pg` (node-postgres) avec un pool de connexions permet un contrôle total sur les requêtes SQL, de meilleures performances sur les requêtes complexes et une transparence totale sur ce qui est exécuté en base. |

---

## Base de Données — PostgreSQL 17

| Aspect | Justification |
|:---|:---|
| **PostgreSQL** | SGBD relationnel le plus moderne et le plus utilisé dans les projets web actuels. Open-source, scalable, optimisé pour les charges de production. Support natif des types géographiques et des index spatiaux (GiST), pertinent pour la géolocalisation des offres d'emploi. |
| **Schéma structuré** | Architecture relationnelle stricte avec contraintes d'intégrité (`FOREIGN KEY`, `CHECK`, `UNIQUE`), index optimisés et transactions ACID. Garantit la cohérence des données métier (utilisateurs, offres, candidatures, notifications). |
| **Initialisation automatique** | Les fichiers SQL dans `database/init/` sont exécutés au premier démarrage du conteneur Docker. Aucune donnée de démonstration n'est injectée : la base démarre vide (schéma seul). Des fixtures de test (admin, offre) sont créées par le service `test-setup` avant les tests e2e puis purgées par `cleanup`. Un jeu de démonstration peut être injecté à la demande via `./scripts/seed.sh`. |

---

## Tests — Vitest

| Aspect | Justification |
|:---|:---|
| **Vitest** | Framework de test rapide, natif à l'écosystème Vite. Permet de s'assurer que les routes du backend ne sont pas cassées lors de changements de code. |
| **Tests d'intégration** | Les tests s'exécutent contre l'API réelle (HTTP) dans un conteneur Docker éphémère. Si un test échoue, le frontend ne démarre pas — garantie que l'API est fonctionnelle avant le déploiement. |
| **Couverture** | Authentification, inscription, CRUD offres, candidatures, administration, RGPD (suppression de compte). |

---

## DevOps — Docker Compose

| Aspect | Justification |
|:---|:---|
| **Docker** | Conteneurisation de l'ensemble de la stack (base de données, backend, frontend, tests) pour harmoniser les environnements de développement. Un seul script (`./scripts/start.sh`) suffit pour lancer l'intégralité du projet, peu importe la machine. |
| **Orchestration ordonnée** | Chaîne de démarrage stricte : `database → backend → tests → frontend`. Chaque service attend que sa dépendance soit `healthy` avant de démarrer. Le frontend ne se lance que si les tests passent (exit 0). |
| **Reproductibilité** | Garantit que le projet fonctionne à l'identique en local, en CI et en production. Supprime le problème classique du « ça marche sur ma machine ». |
| **Scripts simplifiés** | 4 scripts (`start`, `stop`, `restart`, `clean`) couvrent tous les cas d'usage du développeur. |

---

## Sécurité

| Technologie | Rôle |
|:---|:---|
| **JWT (`jsonwebtoken`)** | Authentification stateless par jetons signés. Pas de sessions serveur, scalabilité horizontale facilitée. |
| **Argon2** | Hachage de mots de passe recommandé par l'OWASP (vainqueur du Password Hashing Competition). Plus résistant que bcrypt aux attaques GPU/ASIC. |
| **Helmet** | Sécurisation automatique des en-têtes HTTP (XSS, clickjacking, MIME sniffing). |
| **CORS** | Restriction des origines autorisées pour les requêtes cross-origin. |
| **Validation SIRET (Luhn)** | Contrôle du format des numéros SIRET employeurs côté frontend avant soumission. |

---

## Résumé visuel (pour slide)

```
┌─────────────────────────────────────────────────────────┐
│                      GÉOEMPLOI                          │
├──────────────┬──────────────────┬───────────────────────┤
│   Frontend   │     Backend      │    Base de données    │
│  React/Vite  │  Node.js/Express │    PostgreSQL 17      │
│ Tailwind CSS │  JWT + Argon2    │    SQL pur (pg)       │
│   Leaflet    │  Swagger/OpenAPI │    Docker volume      │
├──────────────┴──────────────────┴───────────────────────┤
│              Docker Compose (orchestration)              │
│         database → backend → tests → frontend           │
└─────────────────────────────────────────────────────────┘
```

---

## Pourquoi ces choix ?

1. **Rapidité de mise en œuvre** — Projet de 2 semaines : chaque technologie a été choisie pour minimiser le temps de setup et maximiser la productivité.
2. **Accessibilité pour l'équipe** — Stack connue par tous les membres (JavaScript, Express, PostgreSQL). Pas de technologie exotique qui nécessite une formation.
3. **Robustesse** — Tests automatisés, orchestration Docker, sécurité (Argon2, Helmet, JWT) : le projet est prêt pour un passage en production.
4. **Standards de l'industrie** — Chaque brique est un standard ouvert, maintenu et documenté. Pas de lock-in propriétaire.
