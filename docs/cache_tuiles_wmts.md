# Documentation du Cache de Tuiles WMTS IGN

## Overview

Le système de cache de tuiles permet de servir les fond de carte de la Géoplateforme IGN (flux WMTS) aux utilisateurs de l'application tout en évitant les requêtes réseau répétitives vers les serveurs externes de l'IGN.

Le serveur backend agit comme un proxy intermédiaire doté d'un cache à deux niveaux.

---

## Flux de Traitement d'une Requête

Lorsqu'un utilisateur navigue sur la carte, le composant Leaflet demande une tuile via l'URL `/api/geo/tiles/{z}/{x}/{y}.png`.

Le traitement s'effectue dans l'ordre suivant :

1. **Vérification du cache RAM**
   Le serveur contrôle si la tuile demandée est conservée en mémoire vive.
   - Si la tuile est en RAM : renvoi immédiat avec l'en-tête `X-Cache: HIT_RAM`.

2. **Vérification du cache Disque**
   Si la tuile n'est pas en RAM, le serveur cherche le fichier correspondant dans le répertoire local `data/cache/tiles/{z}/{x}/{y}.png`.
   - Si la tuile existe sur disque : lecture du fichier, stockage en RAM, puis renvoi avec l'en-tête `X-Cache: HIT_DISK`.

3. **Appel au service WMTS IGN**
   Si la tuile n'existe ni en RAM ni sur disque :
   - Le backend effectue une requête HTTP vers `https://data.geopf.fr/wmts` avec les paramètres WMTS requis.
   - La couche interrogée est `GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2` en format PNG et projection Web Mercator (`PM`).
   - Une fois la tuile récupérée, elle est enregistrée sur disque de manière asynchrone, mise en mémoire RAM, puis renvoyée au client avec l'en-tête `X-Cache: MISS_IGN`.

---

## Composants du Système

### Backend

- **Module de cache (`backend/src/modules/geo/tileCache.js`)**
  Contient la logique de récupération, la gestion de la carte mémoire (RAM) avec une limite maximale de 1000 tuiles et l'écriture des fichiers PNG sur le disque.

- **Route API (`backend/src/modules/geo/routes.js`)**
  Expose l'endpoint `GET /api/geo/tiles/:z/:x/:y.png` (et `/tiles/:z/:x/:y`).
  Valide les bornes des coordonnées (zoom entre 0 et 21, identifiants de tuiles positifs).

- **Gestion des limites de requêtes (`backend/src/config/rateLimit.js`)**
  La route `/tiles` est exclue du limiteur de requêtes de géocodage (`geoLimiter`) afin d'autoriser le chargement simultané de multiples tuiles sans déclencher d'erreur HTTP 429.

### Frontend

- **Composant Carte (`frontend/src/components/jobs/JobsMap.jsx`)**
  Configure Leaflet pour utiliser l'URL du proxy backend (`TILE_LAYER_URL`) avec l'attribution légale de la Géoplateforme IGN.

- **Configuration réseau (`frontend/nginx.conf`)**
  Met à jour la politique de sécurité du navigateur (`Content-Security-Policy`) pour autoriser les tuiles provenant du domaine local ainsi que `data.geopf.fr`.

---

## En-têtes HTTP de Réponse

Chaque tuile servie par l'API contient les en-têtes suivants :

| En-tête | Valeur | Description |
|:---|:---|:---|
| `Content-Type` | `image/png` | Format de l'image retournée |
| `Cache-Control` | `public, max-age=604800, immutable` | Indique au navigateur de conserver la tuile en cache client pendant 7 jours |
| `X-Cache` | `HIT_RAM` \| `HIT_DISK` \| `MISS_IGN` | Indique la provenance de la tuile |

---

## Structure du Stockage sur Disque

Les tuiles sont enregistrées de manière arborescente dans le dossier du projet :

```text
data/cache/tiles/
├── 6/
│   └── 32/
│       └── 22.png
└── 12/
    └── 2048/
        └── 1400.png
```

La structure suit la convention `{zoom}/{colonne}/{ligne}.png`.
