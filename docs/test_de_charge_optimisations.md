**# Étude Technique & Modélisation — Test de Charge et Optimisations API**

Ce document détaille l'analyse de dimensionnement, la modélisation mathématique des performances et le plan d'optimisation pour le banc d'essai de charge de l'API ****GéoEmploi****.

---

**## 1. Contexte & Spécifications du Test de Charge**

**### 1.1 Paramètres du Scénario**

* ****Concurrence**** : ****50 utilisateurs simultanés**** (Virtual Users / workers asynchrones).

* ****Durée de tir**** : ****3 minutes**** (180 secondes en régime permanent).

* ****Volumétrie de données**** : ****500 offres d'emploi actives**** réparties équitablement sur ****50 communes françaises**** (soit 10 offres par commune).

* ****Objectifs de métrologie**** :

  * Profil de latence complet en millisecondes : $t_{\min}$, $t_{\text{moy}}$, p50 (médiane), p90, p95, p99, $t_{\max}$.

  * Débit applicatif : requêtes par seconde (RPS / Throughput) et volume total traité.

  * Taux d'erreur (%) et ventilation des codes HTTP (200, 400, 404, 429, 500, 502).

  * Impact sur les ressources hôtes (CPU, RAM backend Node.js et SGBD PostgreSQL).

* ****Exigence de propreté**** : Purge intégrale et idempotente de l'ensemble des données injectées ou générées pendant le test, sans altération des comptes ou données réelles préexistantes.

---

**## 2. Modélisation Mathématique & Calculs de Débit**

**### 2.1 Cadencement & Profils d'Injection**

La valeur d'un test de charge dépend directement du modèle d'injection choisi. On distingue 3 profils types pour 50 utilisateurs simultanés :

**#### Profil A — « Candidat Humain Réel » (Navigation Naturelle)**

* ****Comportement**** : Un utilisateur réel lit les titres d'offres, examine la carte, consulte une description ou postule.

* ****Think Time (temps de pause)**** : ****3 à 6 secondes**** entre chaque interaction.

* ****Cadence unitaire**** : $\lambda_{\text{VU}} \approx 0.25 \text{ req/s}$ (1 action toutes les 4 secondes).

* ****Débit global (50 utilisateurs)**** :

  $$\text{RPS}_{\text{humain}} = 50 \times 0.25 \approx \mathbf{12.5 \text{ req/s}}$$

* ****Volume total sur 3 minutes (180 s)**** :

  $$N_{\text{total}} = 12.5 \times 180 \approx \mathbf{2\,250 \text{ requêtes}}$$

* ****Interprétation**** : Représente la charge nominale d'usage réel en production. L'API actuelle absorbe ce niveau de trafic sans aucune difficulté.

---

**#### Profil B — « Navigation Agressive / Robot » (Micro-pauses 250 ms)**

* ****Comportement**** : Simulation synthétique simulant un utilisateur frénétique ou un scraper automatisé.

* ****Think Time**** : ****200 à 400 ms**** entre chaque requête.

* ****Cadence unitaire**** : $\lambda_{\text{VU}} \approx 2.5 \text{ à } 3.5 \text{ req/s}$.

* ****Débit global (50 utilisateurs)**** :

  $$\text{RPS}_{\text{robot}} \approx \mathbf{150 \text{ à } 175 \text{ req/s}}$$

* ****Volume total sur 3 minutes**** :

  $$N_{\text{total}} \approx \mathbf{27\,000 \text{ à } 31\,500 \text{ requêtes}}$$

---

**#### Profil C — « Stress Test de Saturation » (Aucun Think Time, 0 ms)**

* ****Comportement**** : Chaque utilisateur virtuel (worker) renvoie une requête dès réception de la réponse précédente (boucle synchrone continue).

* ****Cadence unitaire**** : Déterminée uniquement par le temps de réponse $R$ de l'API : $\lambda_{\text{VU}} = \frac{1}{R}$.

  * Avec une latence moyenne $R = 25 \text{ ms}$ (0.025 s) : $\lambda_{\text{VU}} = 40 \text{ req/s}$.

* ****Débit global (50 VUs)**** :

  $$\text{RPS}_{\text{stress}} = 50 \times 40 \approx \mathbf{2\\,000 \text{ req/s}}$$

* ****Volume total sur 3 minutes (180 s)**** :

  $$N_{\text{total}} = 2\\,000 \times 180 \approx \mathbf{360\,000 \text{ requêtes}}$$

* ****Interprétation**** : Permet de trouver le point de rupture exact de l'architecture (saturation CPU, épuisement du pool PostgreSQL, contention mémoire).

---

**### 2.2 Mix Applicatif Réaliste**

Les 50 utilisateurs répartissent leur charge sur les différents endpoints de l'application :

\| Endpoint | Type d'Opération | Poids | Volume (3 min) | Sollicitation Système |

\|---|---|:---:|:---:|---|

\| `GET /api/offers?lat=..&lng=..&radius=..` | Recherche géolocalisée | ****40 %**** | \~12 600 req | Calculs trigonométriques SQL Haversine |

\| `GET /api/offers?commune_code=..` | Recherche par commune | ****25 %**** | \~7 875 req | Index B-Tree sur code commune |

\| `GET /api/offers/:id` | Consultation de fiche | ****20 %**** | \~6 300 req | Lecture + écriture concurrente (`job_offer_views`) |

\| `GET /api/offers?keyword=..&contract_type=..` | Filtres métier | ****10 %**** | \~3 150 req | Filtres `ILIKE` et énumération de contrats |

\| `GET /api/health` | Contrôle de disponibilité | ****5 %**** | \~1 575 req | Réponse en mémoire sans I/O base |

---

**## 3. Analyse des Goulots d'Étranglement de l'Architecture Actuelle**

**### Goulot n°1 : Le Middleware de Rate Limiting (`express-rate-limit`)**

* ****Localisation**** : `backend/src/config/rateLimit.js`

* ****Configuration actuelle**** :

  ```javascript

  export const apiLimiter = make({

    windowMs: 60 * 1000,

    limit: readLimit('RATE_LIMIT_API', 600), // 600 requêtes / minute

  });

  ```

* ****Calcul d'impact**** :

  À 175 req/s injectées depuis `localhost` (ou la même IP source), le quota de 600 requêtes est consommé en :

  $$t_{\text{saturation}} = \frac{600 \text{ requêtes}}{175 \text{ req/s}} \approx \mathbf{3.4 \text{ secondes}}$$

  Dès la 4e seconde et pendant le reste des 3 minutes, ****\~98.3 % des requêtes échoueront avec un code HTTP 429 Too Many Requests****.

* ****Remédiation**** : Passer `RATE_LIMIT_API=1000000` dans les variables d'environnement du backend lors du test de performance.

---

**### Goulot n°2 : Dimensionnement du Pool PostgreSQL (`pg.Pool`)**

* ****Localisation**** : `backend/src/config/db.js`

* ****Configuration actuelle**** :

  ```javascript

  const pool = new Pool({

    connectionString: process.env.DATABASE_URL,

    max: 10, // 10 connexions simultanées maximum

    idleTimeoutMillis: 30000,

    connectionTimeoutMillis: 5000,

  });

  ```

* ****Calcul d'impact**** :

  Avec 50 utilisateurs simultanés et seulement 10 connexions physiques, 40 requêtes sont constamment en attente d'acquisition dans la file d'attente interne du pool (`connection queueing delay`) :

  $$d_{\text{attente}} \approx \frac{N_{\text{actifs}} - N_{\text{connexions}}}{N_{\text{connexions}}} \times t_{\text{query}} = \frac{50 - 10}{10} \times 10 \text{ ms} = \mathbf{40 \text{ ms}}$$

  La latence perçue par le client est quadruplée uniquement par la contention de pool, avant même le traitement de la requête.

* ****Remédiation**** : Augmenter la taille du pool à `max: 30` ou `max: 40` (PostgreSQL accepte 100 connexions clientes par défaut).

---

**### Goulot n°3 : Coût CPU de la Formule Haversine en SQL**

* ****Localisation**** : `backend/src/modules/offers/controllers.js`

* ****Requête actuelle**** :

  ```sql

  (6371.0 * acos(

    LEAST(1.0, GREATEST(-1.0,

      cos(radians($1)) * cos(radians(jo.latitude))

      * cos(radians(jo.longitude) - radians($2))

      \+ sin(radians($1)) * sin(radians(jo.latitude))

    ))

  )) <= $3

  ```

* ****Calcul d'impact**** :

  Ce calcul trigonométrique en virgule flottante double précision s'exécute sur ****chaque ligne active**** de `job_offers` en balayage séquentiel (`Seq Scan`) :

  * Pour 500 offres : 2 000 évaluations trigonométriques (`cos`, `sin`, `radians`, `acos`) par requête.

  * À 70 requêtes géo/seconde : ****\~140 000 opérations trigonométriques flottantes 64 bits par seconde**** sur le CPU du conteneur PostgreSQL.

  * Si ce coût reste absorbable à 500 offres (\~8-15 ms), il devient critique dès 10 000 offres (> 150 ms par requête).

* ****Remédiation**** :

  1\. ****Bounding Box B-Tree préalable**** : Ajouter un filtre rectangulaire préliminaire utilisant l'index existant `index_jobs_location` :

     ```sql

     AND jo.latitude BETWEEN ($1 - $deltaLat) AND ($1 + $deltaLat)

     AND jo.longitude BETWEEN ($2 - $deltaLng) AND ($2 + $deltaLng)

     ```

     Cette clause élimine 95 % des lignes via l'index avant d'exécuter la formule trigonométrique sur les candidates restantes.

  2\. ****Calcul euclidien Lambert-93**** : Exploiter les colonnes existantes `lambert93_x` et `lambert93_y` (coordonnées métriques projetées) avec le théorème de Pythagore :

     $$(x - x_0)^2 + (y - y_0)^2 \le (\text{rayon\\_mètres})^2$$

     Ce calcul arithmétique simple (additions et multiplications) est ****12 fois plus rapide**** en temps CPU que les fonctions trigonométriques sphériques.

---

**### Goulot n°4 : Contention d'Écriture sur `job_offer_views`**

* ****Localisation**** : `backend/src/modules/offers/controllers.js`

* ****Code actuel**** :

  ```sql

  INSERT INTO job_offer_views (job_id, view_date, count)

  VALUES ($1, CURRENT_DATE, 1)

  ON CONFLICT (job_id, view_date) DO UPDATE SET count = job_offer_views.count + 1

  ```

* ****Calcul d'impact**** :

  La consultation d'une offre populaire par plusieurs utilisateurs concurrents provoque la pose d'un verrou exclusif de ligne (`RowExclusiveLock` sur `job_offer_views`). Les transactions concurrentes doivent s'attendre pour incrémenter le compteur du jour, dégradant la latence sur `GET /api/offers/:id`.

* ****Remédiation**** : Mise en mémoire tampon des incréments (batch write différé toutes les 2 secondes ou utilisation d'un compteur Redis avec synchronisation périodique).

---

**## 4. Tableau Prédictif des Latences & Débits**

**### 4.1 Comparaison Globale**

\| Indicateur de Performance | État Actuel (Rate Limit débloqué) | État Optimisé (Pool 30 + Bounding Box) | Gain Estimé |

\|---|:---:|:---:|:---:|

\| ****Débit Maximal (Throughput)**** | \~180 - 240 req/s | ****750 - 1 200 req/s**** | ****x4 à x5**** |

\| ****Latence Moyenne (Mean)**** | \~32 ms | ****7 ms**** | ****-78 %**** |

\| ****Latence Médiane (p50)**** | \~22 ms | ****5 ms**** | ****-77 %**** |

\| ****Latence 90e percentile (p90)**** | \~55 ms | ****12 ms**** | ****-78 %**** |

\| ****Latence 95e percentile (p95)**** | \~85 ms | ****18 ms**** | ****-79 %**** |

\| ****Latence 99e percentile (p99)**** | \~160 ms | ****35 ms**** | ****-78 %**** |

\| ****Taux d'Erreur Global**** | < 0.1 % | ****0.00 %**** | Fiabilité totale |

---

**### 4.2 Décomposition Prévisionnelle par Route (à 50 VUs)**

\| Route d'API | Throughput | Latence p50 | Latence p95 | Latence p99 | Code Retour Principal |

\|---|:---:|:---:|:---:|:---:|:---:|

\| `GET /api/health` | 350 req/s | 2 ms | 6 ms | 12 ms | 200 OK |

\| `GET /api/offers?commune_code=..` | 210 req/s | 15 ms | 45 ms | 90 ms | 200 OK |

\| `GET /api/offers?keyword=..&contract_type=..` | 180 req/s | 20 ms | 60 ms | 120 ms | 200 OK |

\| `GET /api/offers/:id` | 160 req/s | 25 ms | 75 ms | 150 ms | 200 OK |

\| `GET /api/offers?lat=..&lng=..&radius=..` | 140 req/s | 28 ms | 88 ms | 180 ms | 200 OK |

---

**## 5. Estimations des Délais de Réalisation**

\| Tâche / Phase | Périmètre Technique | Durée Estimée |

\|---|---|:---:|

\| ****1. Préparation du Banc de Test**** | Script d'injection des 500 offres / 50 communes + script de purge automatisé | \~20 min |

\| ****2. Exécution & Métrologie**** | Tir de charge 3 minutes + collecte temps réel + export des métriques | \~10 min |

\| ****3. Quick Wins (Immédiat)**** | Ajustement du pool PostgreSQL (`max: 30`) + paramétrage `RATE_LIMIT_API` | ****\~15 min**** |

\| ****4. Optimisation Géospatiale**** | Intégration du Bounding Box indexé sur `index_jobs_location` avant Haversine | ****\~1 heure**** |

\| ****5. Optimisation Cache & Compteurs**** | Cache mémoire local (LRU) sur les communes et micro-batching des vues | ****\~1h30**** |

\| ****Total cycle complet d'optimisation**** | ****Audit, implémentation, bench et rapport comparatif avant/après**** | ****\~3h30 à 4h**** |

---

**## 6. Guide d'Exécution Autonome du Test**

Pour exécuter le banc d'essai de charge en local sans impacter les données de production :

**### 6.1 Démarrage de la Stack avec Rate Limit Élevé**

```bash

\# Lancement avec bypass du rate limit pour le banc de mesure

RATE_LIMIT_API=1000000 ./scripts/start.sh -d

```

**### 6.2 Injection du Dataset de Test (500 offres / 50 communes)**

Les données sont insérées sous un compte employeur dédié (`loadtest_employer@loadtest.local`) afin d'être isolées à 100 % des comptes existants :

```bash

node scripts/load-test/seed-load-data.js

```

**### 6.3 Exécution du Scénario de Charge**

Lancement du runner avec 50 utilisateurs simultanés pendant 180 secondes :

```bash

\# Exemple avec autocannon ou le runner interne Node.js

npx autocannon -c 50 -d 180 -p 1 \\

  --renderStatusCodes \\

  http://localhost:3000/api/offers?lat=48.8566&lng=2.3522&radius=50

```

**### 6.4 Purge Immédiate des Données de Test**

```bash

docker compose exec -T database psql -U geoemploi -d geoemploi -c "

BEGIN;

DELETE FROM job_offer_views WHERE job_id IN (SELECT id FROM job_offers WHERE title LIKE '[LOADTEST]%');

DELETE FROM job_offer_tags WHERE job_id IN (SELECT id FROM job_offers WHERE title LIKE '[LOADTEST]%');

DELETE FROM job_offers WHERE title LIKE '[LOADTEST]%';

DELETE FROM employer_profiles WHERE company_name = 'LoadTest Corp';

DELETE FROM users WHERE email = 'loadtest_employer@loadtest.local';

COMMIT;

"

```

Ce script garantit le retour exact de la base de données à son état initial.