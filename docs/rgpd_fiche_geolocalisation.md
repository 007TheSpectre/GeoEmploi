# Fiche de Traitement RGPD — Géolocalisation

> **Projet :** GéoEmploi — Plateforme de recherche d'emploi géolocalisé  
> **Responsable de traitement :** GéoEmploi (République Française)  
> **Délégué à la Protection des Données (DPO) :** `dpo@emploi.gouv.fr`  
> **Date de rédaction :** 02/09/2026 (Mise à jour : Septembre 2026)  
> **Version :** 2.0  

---

## 1. Identification du traitement

| Champ | Description |
|:---|:---|
| **Nom du traitement** | Géolocalisation des offres d'emploi et des utilisateurs |
| **Délégué à la Protection des Données** | `dpo@emploi.gouv.fr` |
| **Finalité principale** | Afficher les offres d'emploi sur une carte interactive et permettre aux candidats de rechercher des opportunités dans un rayon géographique autour de leur localisation |
| **Finalité secondaire** | Permettre aux employeurs de localiser géographiquement leurs offres et de définir un rayon de diffusion (`broadcast_radius_km`) |
| **Base légale** | **Consentement explicite** (Art. 6.1.a du RGPD) — Recueilli via une notice didactique préalable d'information (l'autorisation technique du navigateur ne faisant pas office de consentement RGPD unique). Le service demeure 100 % accessible sans géolocalisation. |

---

## 2. Données collectées

| Donnée | Type | Précision | Source | Obligatoire |
|:---|:---|:---|:---|:---|
| `latitude` | `DOUBLE PRECISION` | ~11 m (5 décimales) | API Géolocalisation navigateur / saisie manuelle | Non |
| `longitude` | `DOUBLE PRECISION` | ~11 m (5 décimales) | API Géolocalisation navigateur / saisie manuelle | Non |
| `departement_code` | `VARCHAR(3)` | Département | Déduit des coordonnées ou saisie | Non |
| `commune_code` | `VARCHAR(6)` | Commune (code INSEE) | Déduit des coordonnées ou saisie | Non |
| `postal_code` | `VARCHAR(10)` | Code postal | Saisie utilisateur | Non |
| `search_radius_km` | `INT` | Rayon de recherche en km | Saisie candidat (défaut : 30 km) | Non |
| `broadcast_radius_km` | `INT` | Rayon de diffusion d'offre en km | Saisie employeur (défaut : 50 km) | Non |
| `city` | `VARCHAR(100)` | Commune / Arrondissement | Saisie utilisateur / API BAN | Non |

### 2.1 Données NON collectées

- Adresses précises de voie / rue (numéro et voie) : la précision géographique est strictement limitée à l'arrondissement ou à la commune
- Historique des positions GPS
- Données de localisation en temps réel
- Données de déplacement ou trajectoires
- Données d'accéléromètre ou gyroscope
- Adresse MAC ou identifiant réseau

---

## 3. Personnes concernées

| Catégorie | Données de localisation traitées |
|:---|:---|
| **Candidats** | Coordonnées (lat/lng), code département, code commune, code postal, rayon de recherche |
| **Employeurs** | Coordonnées (lat/lng) de l'entreprise, code département, code commune, code postal |
| **Offres d'emploi** | Coordonnées (lat/lng) de l'offre, code département, rayon de diffusion |
| **Visiteurs non authentifiés** | Aucune donnée de localisation persistée. Le navigateur peut demander la géolocalisation pour affiner la carte, mais cette donnée reste côté client |

---

## 4. Destinataires des données

| Destinataire | Données accédées | Justification |
|:---|:---|:---|
| **L'utilisateur lui-même** | Ses propres coordonnées | Consultation de son profil |
| **Les autres candidats** | Département/commune des offres | Recherche géographique |
| **Les administrateurs** | Toutes les données de localisation | Modération et support |
| **Équipe technique habilitée** | Données techniques nécessaires | Déploiements, hébergement et maintenance dans un cadre strictement délimité |
| **OpenStreetMap (tiles)** | Coordonnées de la vue de la carte (côté navigateur uniquement) | Affichage des tuiles cartographiques |
| **Aucun organisme tiers** | — | Aucune transmission ni commercialisation de données personnelles |

---

## 5. Mesures de sécurité

### 5.1 Mesures techniques

| Mesure | Implémentation |
|:---|:---|
| **Chiffrement en transit** | HTTPS/TLS pour toutes les communications client ↔ serveur |
| **Protection des mots de passe** | Chiffrement irréversible robuste conforme aux exigences de l'ANSSI |
| **Authentification** | Jetons de session sécurisés |
| **Protection des en-têtes HTTP** | En-têtes de sécurité web renforcés (anti-XSS, anti-clickjacking) |
| **CORS** | Restriction stricte des domaines autorisés |
| **Contrôle d'accès** | Contrôle strict des rôles et habilitations (`employer`, `candidate`, `admin`) |
| **Validation d'entrée** | Contrôle systématique côté serveur de la validité des coordonnées |

### 5.2 Mesures organisationnelles & Calendrier de conservation

| Mesure | Description |
|:---|:---|
| **Principe de minimisation** | Seules les coordonnées nécessaires à la recherche géographique sont collectées (pas d'adresse de rue) |
| **Accès restreint** | Les coordonnées précises des candidats ne sont jamais exposées publiquement ni transmises aux employeurs |
| **Suppression de compte** | Suppression immédiate, définitive et irréversible de toutes les données et activités liées |
| **Purge immédiate coordonnées** | Désactivation immédiate dans les réglages du compte avec effacement SQL instantané (`SET latitude = NULL, longitude = NULL`) |
| **Purge automatique > 90 jours** | Purge programmée par tâche automatisée des vues d'offres et journaux techniques de plus de 90 jours |
| **Archivage automatique > 30 jours** | Bascule automatique des offres closes ou expirées depuis plus de 30 jours vers le statut archivé |

---

## 6. Droits des personnes

| Droit | Mise en œuvre |
|:---|:---|
| **Droit d'accès** (Art. 15) | Consultation de ses données depuis son profil |
| **Droit de rectification** (Art. 16) | Modification de ses informations et de sa localisation à tout moment |
| **Droit à l'effacement** (Art. 17) | Suppression de compte entraînant l'effacement intégral de ses données personnelles |
| **Droit à la portabilité** (Art. 20) | Export direct de toutes ses données personnelles au format structuré JSON |
| **Droit d'opposition & de retrait** | Désactivation à tout moment via le toggle dans les réglages de compte avec purge immédiate |
| **Contact du DPO** | Pour toute question ou exercice de ces droits : **`dpo@emploi.gouv.fr`** |

---

## 7. Mécanisme de recueil du consentement

### 7.1 Parcours utilisateur à deux niveaux

> [!IMPORTANT]
> **Clarification du consentement RGPD :** L'autorisation technique sollicitée par le navigateur web ne fait pas office de consentement RGPD unique.  
> Un bandeau préalable explicite (`GeolocationConsentNotice`) est présenté à l'utilisateur avant tout appel à l'API du navigateur :

```
┌──────────────────────────────────────────────────────────────┐
│       BANDEAU PRÉALABLE D'INFORMATION (GéoEmploi)            │
│  "GéoEmploi souhaite vous localiser afin de centrer          │
│   la carte et afficher les offres d'emploi à proximité.      │
│   Ce choix est libre et révocable à tout moment dans         │
│   vos réglages de compte."                                   │
│                                                              │
│       [ Continuer sans géolocalisation ]  [ M'autoriser ]    │
└──────────────────────────────┬───────────────────────────────┘
                               │ (Si clic sur "M'autoriser")
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    NAVIGATEUR WEB                             │
│  "geoemploi.gouv.fr souhaite accéder à votre position"       │
│                [ Bloquer ]          [ Autoriser ]            │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 Caractéristiques du consentement (RGPD Art. 7)

- **Libre** — Le refus n'empêche nullement l'utilisation du service (recherche manuelle ouverte).
- **Spécifique** — Le consentement porte exclusivement sur la détection du département pour le centrage de carte.
- **Éclairé** — Notice préalable détaillant la finalité, la base légale et les modalités de retrait.
- **Univoque** — Action positive explicite (clic préalable puis autorisation navigateur).
- **Révocable** — Retrait instantané à tout instant depuis les réglages de compte avec purge immédiate des données.

---

## 8. Séparation documentaire & Analyse d'Impact (AIPD)

> [!NOTE]
> **Séparation documentaire :**  
> L'Analyse d'Impact relative à la Protection des Données (AIPD Allégée) est désormais isolée dans un document formel dédié et autonome, distinct des CGU et de la présente fiche :  
> 👉 Consulter l'[AIPD Allégée de GéoEmploi](aipd_geolocalisation_allegee.md).

---

## 9. Flux de données

```
┌─────────────┐     Consentement navigateur     ┌──────────────────┐
│  Navigateur │ ──────────────────────────────── │ API Geolocation  │
│  (Client)   │ ◄──── lat/lng (côté client) ─── │ (navigator.geo)  │
└──────┬──────┘                                  └──────────────────┘
       │
       │  POST /api/profile  (lat, lng, postal_code...)
       │  Headers: Authorization: Bearer <JWT>
       │
       ▼
┌──────────────┐    SQL INSERT/UPDATE    ┌─────────────────────┐
│   Backend    │ ──────────────────────► │   PostgreSQL 17     │
│  Express.js  │                         │  candidate_profiles │
│              │ ◄────── SELECT ──────── │  employer_profiles  │
└──────────────┘                         │  job_offers         │
                                         └─────────────────────┘
```

---
