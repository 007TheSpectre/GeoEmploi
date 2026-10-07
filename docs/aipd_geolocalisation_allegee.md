# Analyse d'Impact relative à la Protection des Données (AIPD Allégée)

> **Traitement :** Géolocalisation et recherche territoriale d'emploi — Plateforme GéoEmploi  
> **Cadre juridique :** Règlement Général sur la Protection des Données (RGPD 2016/679) & Loi Informatique et Libertés  
> **Référentiel méthodologique :** Guide AIPD de la Commission Nationale de l'Informatique et des Libertés (CNIL)  
> **Date de réalisation :** Septembre 2026  
> **Statut :** Validé — Version 1.0 (Allégée)  

> **Séparation documentaire :** Le présent document constitue une Analyse d'Impact relative à la Protection des Données (AIPD) formalisée, autonome et strictement isolée des Conditions Générales d'Utilisation (CGU). Il sert de référence pour la démonstration de conformité auprès des usagers et de l'autorité de contrôle.

---

## 1. Fiche d'Identité et Contexte du Traitement

| Paramètre | Description |
|:---|:---|
| **Responsable de traitement** | Direction du projet GéoEmploi (Démonstrateur technique territorial) |
| **Délégué à la Protection des Données (DPO)** | `dpo@emploi.gouv.fr` |
| **Finalité principale** | Permettre aux candidats de visualiser les offres d'emploi publiques et territoriales sur une carte interactive et de filtrer les opportunités à l'échelle de leur département ou commune |
| **Finalité secondaire** | Permettre aux recruteurs de publier des annonces territorialisées avec un rayon de diffusion géographique défini |
| **Base légale** | **Consentement explicite** de la personne concernée (Art. 6.1.a du RGPD) pour l'accès aux coordonnées de l'appareil. Le service demeure 100 % accessible sans géolocalisation par sélection manuelle de département. |
| **Personnes concernées** | Candidats à l'emploi public territorial, recruteurs des collectivités, administrateurs |

---

## 2. Description Systématique du Traitement

### 2.1 Cycle de vie des données géographiques et recueil du consentement

> **Clarification du parcours de consentement (RGPD Art. 4.11 & 7) :**  
> L'autorisation technique native sollicitée par le navigateur web **ne fait pas office de consentement RGPD unique**.  
> Un bandeau d'information explicite et préalable (`GeolocationConsentNotice`) est obligatoirement présenté à l'utilisateur avant tout déclenchement de l'API de localisation. Ce bandeau :
> 1. Pré-affiche clairement la finalité du traitement (détection du département pour centrer la carte et filtrer les offres locales pertinentes).
> 2. Assure un choix parfaitement libre (boutons équivalents « Autoriser et me localiser » et « Continuer sans géolocalisation »).
> 3. Informe expressément l'utilisateur de sa liberté de changer d'avis à tout moment dans ses réglages de compte.

```
┌────────────────────────┐       Information préalable       ┌────────────────────────┐
│  Utilisateur / Client  │ ────────────────────────────────► │ Notice RGPD explicite  │
│  (Interface Web)       │ ◄──────────────────────────────── │ [Autoriser] [Refuser]  │
└───────────┬────────────┘                                   └────────────────────────┘
            │
            │ (Si consentement accordé via le bandeau préalable PUIS confirmation navigateur)
            ▼
┌────────────────────────┐       Calcul côté client          ┌────────────────────────┐
│  Déduction Département │ ────────────────────────────────► │ Centrage de la carte   │
│  (Polygones GeoJSON)   │                                   │ Filtrage des offres    │
└───────────┬────────────┘                                   └────────────────────────┘
            │
            │ (Optionnel : enregistrement profil si connecté)
            ▼
┌────────────────────────┐       Désactivation dans réglages ┌────────────────────────┐
│ Base de données PostgreSQL │ ────────────────────────────► │ PURGE IMMÉDIATE (NULL) │
│ (candidate_profiles)   │                                   │ Droit à l'oubli        │
└────────────────────────┘                                   └────────────────────────┘
```

### 2.2 Données traitées vs Données formellement exclues

| Données traitées | Précision / Niveau de détail | Durée de conservation & Calendrier |
|:---|:---|:---|
| **Département / Arrondissement** | Code département (ex: 59, 75) ou commune INSEE | Durée de vie du compte utilisateur |
| **Coordonnées de géolocalisation** | Latitude / Longitude (arrondies) | **Purge immédiate** lors de la désactivation du toggle dans les réglages |
| **Historique des vues d'offres** | Date de consultation, identifiant de l'offre | **Purge automatique > 90 jours** par tâche programmée |
| **Traces et journaux (logs)** | Horodatage et logs techniques de sécurité | **Purge automatique > 90 jours** |
| **Offres closes ou expirées** | Données de l'annonce d'emploi | **Archivage automatique > 30 jours** (retrait de la recherche) |

> **Données strictement EXCLUES du traitement :**
> - **Aucune adresse précise de rue ou de domicile** n'est exigée ni collectée (précision limitée à la commune/arrondissement).
> - **Aucun suivi GPS continu en temps réel** (pas de polling continu de position).
> - **Aucun historique de déplacements, ni trajectoires, ni trajets pendulaires domicile-travail**.
> - **Aucune collecte d'identifiant matériel réseau (adresse MAC, IMEI)**.

---

## 3. Évaluation de la Nécessité et de la Proportionnalité

### 3.1 Respect des principes fondamentaux du RGPD

| Principe RGPD | Mesure mise en œuvre dans GéoEmploi | Conformité |
|:---|:---|:---:|
| **Licéité (Art. 6)** | Consentement explicite libre, éclairé, univoque et préalable recueilli par bandeau dédié avant tout appel à l'API navigateur. | **Conforme** |
| **Information préalable (Art. 13)** | Notice didactique pré-affichant la finalité, le caractère facultatif et les modalités de désactivation dans les réglages. | **Conforme** |
| **Minimisation (Art. 5.1.c)** | La position GPS est immédiatement traduite en code département côté client. Les coordonnées précises ne sont jamais transmises aux tiers. | **Conforme** |
| **Exactitude (Art. 5.1.d)** | Possibilité pour l'utilisateur de rectifier ou remplacer manuellement la localisation détectée par une sélection directe. | **Conforme** |
| **Limitation de conservation (Art. 5.1.e)** | Calendrier de conservation strict :<br>1. **Purge immédiate** des coordonnées lors de la désactivation du paramètre.<br>2. **Purge automatique > 90 jours** des vues d'offres et logs techniques (`scripts/purge_data_90days.py`).<br>3. **Archivage automatique > 30 jours** des offres closes/expirées (`scripts/archive_data_30days.py`). | **Conforme** |
| **Droit de retrait (Art. 7.3 & 17)** | Interrupteur dédié (*Toggle*) dans « Mon Compte / Réglages & Confidentialité » permettant de révoquer l'autorisation à tout moment avec purge instantanée des données. | **Conforme** |
| **Droit à la portabilité (Art. 20)** | Export complet de toutes les données personnelles au format normalisé JSON en un clic. | **Conforme** |

---

## 4. Appréciation des Risques sur les Droits et Libertés

### 4.1 Grille d'évaluation des risques

| Risque identifié | Menace / Cause | Impact potentiel | Vraisemblance brute | Gravité brute | Niveau de risque brut |
|:---|:---|:---|:---:|:---:|:---:|
| **R1. Géolocalisation non consentie** | Déclenchement automatique intempestif de la localisation sans notice préalable | Sentiment d'intrusion, perte de contrôle sur les données personnelles | Moyenne | Moyenne | **Modéré** |
| **R2. Traçage des habitudes de vie** | Stockage persistant des positions GPS successives et reconstitution de trajectoires | Atteinte à la vie privée, profilage géographique non désiré | Faible | Élevée | **Modéré** |
| **R3. Fuite de données / Accès illégitime** | Exposition publique des coordonnées exactes d'un candidat à des tiers ou employeurs | Risque de localisation physique directe de la personne | Faible | Élevée | **Modéré** |
| **R4. Rétention excessive de logs** | Conservation indéfinie des traces de consultation d'offres et de localisation | Non-respect du droit à l'oubli, sur-stockage inutile | Élevée | Faible | **Modéré** |

---

## 5. Mesures de Sécurité et Atténuation des Risques

### 5.1 Mesures techniques et organisationnelles associées

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             MESURES DE MITIGATION                                │
├──────────────────────────────────────────────────────────────────────────────────┤
│ 1. BANNIÈRE DE CONSENTEMENT PRÉALABLE (GeolocationConsentNotice)                 │
│    Aucun appel navigateur n'est émis tant que l'utilisateur n'a pas cliqué      │
│    sur « Autoriser et me localiser ». Choix mémorisé et révocable.               │
│                                                                                  │
│ 2. PURGE IMMÉDIATE SUR ACTION UTILISATEUR (Toggle Settings)                      │
│    La désactivation de la géolocalisation dans « Mon Compte » purge              │
│    instantanément (SET latitude = NULL, longitude = NULL) en base SQL.           │
│                                                                                  │
│ 3. SCRIPT DE PURGE AUTOMATIQUE > 90 JOURS (scripts/purge_data_90days.sh)         │
│    Élimination automatique des vues d'offres, notifications lues et jetons       │
│    avec contrôle de comptage avant/après et journalisation horodatée.            │
│                                                                                  │
│ 4. SCRIPT D'ARCHIVAGE AUTOMATIQUE > 30 JOURS (scripts/archive_data_30days.sh)   │
│    Bascule des offres closes ou expirées vers le statut 'archived' pour          │
│    retrait de la recherche publique tout en préservant l'audit légal.            │
│                                                                                  │
│ 5. CONTRÔLE D'ACCÈS RBAC & SÉCURITÉ DU PROTOCOLE                                 │
│    HTTPS/TLS systématique, chiffrement robuste des mots de passe (ANSSI),        │
│    jetons de session sécurisés et protection renforcée des en-têtes web.         │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Matrice d'évaluation des risques résiduels

| Risque | Mesures de mitigation appliquées | Vraisemblance résiduelle | Gravité résiduelle | Risque résiduel |
|:---|:---|:---:|:---:|:---:|
| **R1. Géolocalisation non consentie** | Notice préalable explicite (Art. 13) + absence d'appel auto si refus | Négligeable | Faible | **Négligeable** |
| **R2. Traçage des habitudes de vie** | Aucune conservation d'historique de position ni de trajectoire | Négligeable | Négligeable | **Négligeable** |
| **R3. Fuite de données / Accès illégitime** | Cloisonnement strict des profils, exclusion des coordonnées dans les listes publiques | Faible | Faible | **Faible** |
| **R4. Rétention excessive de logs** | Purge quotidienne > 90j et archivage > 30j avec contrôle de comptage | Négligeable | Faible | **Négligeable** |

---

## 6. Synthèse de Conformité et Plan d'Action

### 6.1 Bilan de conformité
> Le traitement de géolocalisation mis en œuvre sur la plateforme GéoEmploi répond aux standards les plus stricts de protection dès la conception (*Privacy by Design*) et par défaut (*Privacy by Default*).  
> 
> Grâce à l'instauration d'une **mention d'information préalable**, d'un **mécanisme de désactivation avec purge immédiate des coordonnées**, d'une **politique de purge automatique > 90 jours** et d'un **archivage > 30 jours**, les risques pesant sur les droits et libertés des personnes concernées sont maîtrisés et réduits à un niveau résiduel **négligeable à faible**.

### 6.2 Plan d'action et suivi dans le temps

1. **Revue semestrielle des logs de purge et d'archivage** : Vérification de la bonne exécution des scripts de purge et d'archivage (`scripts/purge_data_90days.py` et `scripts/archive_data_30days.py`).
2. **Audit annuel des consentements** : Contrôle du respect du non-déclenchement de la géolocalisation pour les utilisateurs ayant refusé ou n'ayant pas exprimé de choix.
3. **Mise à jour documentaire** : Actualisation de la présente AIPD en cas d'évolution de l'architecture ou des finalités du traitement.
