# Note d'Architecture — Processus de Reprise et Migration du Géocodage

## Contexte et Objectif

Conformément à la convention signée avec l'IGN et aux directives ministérielles, l'application GéoEmplois s'appuie sur la **Base Adresse Nationale (API Adresse — api-adresse.data.gouv.fr)** pour le géocodage des offres et la dérivation des coordonnées officielles en **Lambert-93 (EPSG:2154)**.

Ce document détaille la procédure de reprise et de migration des offres d'emploi, appuyée sur le script automatisé [`scripts/regeocode-offers.py`](file:///home/gabriel/Documents/Third_year/survivor/G-SVR-500-LIL-5-1-survivor-5/scripts/regeocode-offers.py).

---

## 1. Commande de Reprise Prévue

La procédure de reprise s'exécute à l'aide du script Python situé à la racine du projet :

```bash
# 1. Mode Rapport (Dry-run) : analyse les offres et affiche un rapport sans modifier la BDD
./scripts/regeocode-offers.py

# 2. Mode Application : regéocode et met à jour les coordonnées en base de données
./scripts/regeocode-offers.py --apply

# 3. Mode Ciblé : regéocode une offre spécifique par son ID
./scripts/regeocode-offers.py --apply --id 42
```

---

## 2. Analyse et Catégorisation des Offres

À chaque exécution, le script lit l'ensemble des offres d'emploi (`job_offers`) et les classe en 3 catégories distinctes :

1. **Déjà correctes :** Offres possédant des coordonnées WGS84 (`latitude`, `longitude`) valides et des coordonnées Lambert-93 (`lambert93_x`, `lambert93_y`) calculées et cohérentes à moins d'un mètre près.
2. **À re-géocoder via la BAN :** Offres possédant des coordonnées WGS84 manquantes (`NULL`), égales à 0 ou situées hors de la France métropolitaine. Le script interroge alors `https://api-adresse.data.gouv.fr/search/` avec l'adresse postale, le code postal et le code commune.
3. **À re-dériver en Lambert-93 :** Offres possédant des coordonnées WGS84 valides mais dont les projection Lambert-93 sont manquantes ou incohérentes. La dérivation s'effectue localement sans aucun appel réseau.

---

## 3. Reprise après Interruption (Idempotence & Résilience)

- **Idempotence native :** En cas d'interruption (coupure réseau, arrêt du conteneur), relancer `./scripts/regeocode-offers.py --apply` ignore automatiquement les offres déjà corrigées lors de la passe précédente.
- **Seuil de confiance BAN :** Seuls les résultats BAN renvoyant un score de confiance $\ge 0.5$ (`MIN_GEOCODE_SCORE = 0.5`) et situés en France métropolitaine sont retenus.
- **Gestion de la charge (Rate Limiting) :** Une temporisation de `0.3s` est appliquée entre chaque requête HTTP à l'API Adresse nationale pour respecter la politique d'usage et éviter les erreurs HTTP `429 Too Many Requests`.

---

## 4. Gestion des Échecs et Sécurité Géographique

Si l'API Adresse ne parvient pas à géocoder une offre (adresse introuvable ou score $< 0.5$) :

- **Pas de coordonnées aberrantes :** Aucune coordonnée arbitraire (ex: `0,0` dans l'Atlantique) n'est injectée. L'offre conserve son état initial sans pollution de données.
- **Traçabilité des échecs :** Le script émet un log explicite :  
  `[ÉCHEC] #id : adresse non géocodable, offre laissée en l'état.`
- **Modération et administration :** L'offre reste consultable dans le back-office d'administration pour permettre une correction manuelle de l'adresse ou des coordonnées par l'équipe de modération.

---

## 5. Données et Métriques Produite par le Rapport

Lors de son exécution, le script affiche un bilan complet incluant :

- **Le nombre total d'offres analysées**
- **Le nombre d'offres déjà conformes**
- **Le nombre d'offres ré-exécutées via l'API BAN**
- **Le nombre d'offres re-dérivées localement en Lambert-93**
- **Le nombre d'échecs et le nombre total de corrections appliquées**

---

## 6. Synthèse des Garanties

| Critère | Réalisation avec `scripts/regeocode-offers.py` |
|:---|:---|
| **Géocodeur unique** | Base Adresse Nationale (`api-adresse.data.gouv.fr`) |
| **Projection légale** | RGF93 / Lambert-93 (`EPSG:2154`) calculé côté serveur |
| **Idempotence** | Réexécutable sans doublon ni altération des données conformes |
| **Rapport préalable** | Exécution sécurisée en mode rapport par défaut sans `--apply` |
