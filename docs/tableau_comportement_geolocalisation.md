# Tableau de Comportement — Avec / Sans Géolocalisation

> **Projet :** GéoEmploi | **Date :** 02/09/2026

---

## 1. Tableau comparatif

| # | Fonctionnalité | Avec Géolocalisation | Sans Géolocalisation |
|:--|:---|:---|:---|
| 1 | **Centre de la carte** | Centrée sur la position utilisateur | France entière (46.60, 1.89, zoom 6) |
| 2 | **Recherche d'offres** | Triées par proximité | Par département ou date |
| 3 | **Rayon de recherche** | Rayon GPS (30 km défaut) | Recherche par département/CP |
| 4 | **Marqueurs** | Distance relative affichée | Sans indication de distance |
| 5 | **Création offre** | Lat/lng pré-remplis | Saisie manuelle adresse/CP |
| 6 | **Profil candidat** | Lat/lng auto | Saisie CP + département |
| 7 | **GeoJSON départements** | Identique | Identique |
| 8 | **GeoJSON arrondissements** | Identique | Identique |
| 9 | **Navigation clavier** | Identique | Identique |

---

## 2. Flux utilisateur

### Avec géolocalisation
```
/jobs → Bandeau préalable RGPD (finalité & libre choix) → [Autoriser et me localiser] → Demande navigateur [Autoriser] → Détection département & centrage carte → Offres locales
```

### Sans géolocalisation
```
/jobs → Bandeau préalable RGPD → [Continuer sans géolocalisation] (ou refus navigateur) → Carte France entière (46.60, 1.89) → Sélection département / commune manuelle
```

### Révocation & Droit à l'oubli
```
Mon Compte / Réglages & Confidentialité → Interrupteur "Géolocalisation" désactivé → Purge immédiate des coordonnées SQL (NULL) et locale
```

---

## 3. Calendrier de conservation et purges automatiques

| Traitement | Modalité & Fréquence | Effet |
|:---|:---|:---|
| **Désactivation géolocalisation** | Immédiate à l'action utilisateur | Suppression instantanée des coordonnées (latitude/longitude) |
| **Vues d'offres et journaux techniques** | Purge automatique quotidienne (> 90 jours) | Nettoyage des historiques d'activité |
| **Offres closes ou expirées** | Archivage automatique (> 30 jours) | Retrait de la recherche publique tout en conservant l'intégrité légale |

---

## 4. Résumé de conformité

| Aspect | Statut |
|:---|:---|
| Fonctionnement sans géolocalisation | 100% fonctionnel sans restriction |
| Recueil du consentement | Bandeau préalable explicite + demande navigateur (pas de consentement implicite) |
| Révocabilité & Droit à l'oubli | Immédiat via réglages avec purge SQL instantanée |
| Contact DPO | `dpo@emploi.gouv.fr` |
| Séparation documentaire AIPD | Document dédié autonome (`aipd_geolocalisation_allegee.md`) |
