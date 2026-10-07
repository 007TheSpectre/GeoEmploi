# Note de Déploiement et de Cadrage d'Infrastructure — GéoEmploi

**Destinataire :** Direction Générale / Direction des Systèmes d'Information (DSI)  
**Objet :** Cadrage du déploiement en production, dimensionnement des ressources et cartographie des flux de données sortants  
**Statut :** Document d'orientation technique et opérationnel (hors tarification/devis)  
**Projet :** GéoEmploi (Plateforme ministérielle d'offres d'emploi géolocalisées)

---

## 1. Localisation et Hébergement en Production

Pour garantir la souveraineté des données publiques et des informations personnelles des usagers (demandeurs d'emploi et employeurs), l'hébergement du service **GéoEmploi** respectera la doctrine de l'État « *Le Nuage au centre* » (Circulaire n° 6282/SG du Premier Ministre).

### 1.1 Prestataire Cloud & Qualification
* **Qualification ANSSI :** L'infrastructure sera opérée exclusivement sur une offre certifiée **SecNumCloud** (délivrée par l'ANSSI).
* **Fournisseurs ciblés :** Cloud souverain qualifié établi en France (ex. *OVHcloud Hosted Private Cloud SecNumCloud*, *3DS OUTSCALE*, ou *Scaleway SecNumCloud*).
* **Localisation physique :** Data centers situés exclusivement sur le territoire métropolitain français (Régions Paris / Hauts-de-France).

### 1.2 Niveau de Service et Haute Disponibilité
* **Architecture Multi-AZ :** Déploiement réparti sur au moins deux Zones de Disponibilité (AZ) distantes pour prémunir le service contre tout incident matériel majeur.
* **Engagement de Service (SLA) :** Objectif de disponibilité de **99,9 %** en 24/7.
* **Isolation Réseau :** Partitionnement strict en sous-réseaux (Public / Applicatif / Base de données) et filtrage par pare-feu applicatif (WAF certifié).

---

## 2. Dimensionnement des Ressources d'Infrastructure

L'infrastructure cible repose sur la conteneurisation de la stack logicielle actuelle (API Node.js/Express, application frontend React/Vite servie sous Nginx, et base de données PostgreSQL 17).

```
                      +-----------------------------+
                      |   Ingress WAF & Load Balancer|
                      +--------------+--------------+
                                     |
             +-----------------------+-----------------------+
             |                                               |
  +----------v----------+                         +----------v----------+
  + Frontends Nginx     +                         + APIs Node.js/Express+
  + (2 à 4 instances)   +                         + (3 à 6 instances)   +
  +---------------------+                         +----------+----------+
                                                             |
                                                  +----------v----------+
                                                  + PostgreSQL 17 Primary+
                                                  + (+ Standby répliqué)+
                                                  +---------------------+
```

### 2.1 Services Applicatifs (Orchestration Kubernetes / Managed Containers SecNumCloud)

| Service | Rôle Technique | Instances (Min-Max) | Ressources unitaires cibles | Mode de scaling |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend (Nginx)** | Distribution des actifs statiques SPA React (Vite) | 2 à 4 conteneurs | 0.5 vCPU / 512 Mo RAM | Horizontal (CPU > 70%) |
| **Backend API (Node.js 22)** | Logique métier Express.js, JWT, validation, API REST | 3 à 6 conteneurs | 1.5 vCPU / 2 Go RAM | Horizontal (CPU/RAM > 65%) |
| **Tâches planifiées (Node-Cron)** | Worker éphémère (expiration d'offres, archivage 30j) | 1 conteneur dédié | 0.5 vCPU / 512 Mo RAM | Exécution programmée |

### 2.2 Base de Données Relationnelle & Spatiale (PostgreSQL 17)

* **Architecture BDD :** Cluster PostgreSQL haute disponibilité constitué d'un nœud Primaire (écriture/lecture) et d'un nœud Secondaire Répliqué en temps réel (réplication synchrone/asynchrone avec basculement automatique).
* **Spécifications Nœud Primaire & Replica :**
  * **Processeur :** 4 vCPU dédiés par nœud.
  * **Mémoire RAM :** 16 Go RAM avec allocation optimisée pour le cache PostgreSQL (`shared_buffers`).
  * **Stockage :** 200 Go SSD NVMe haute performance (IOPs garantis), extensible à chaud.
* **Stratégie de Sauvegarde & Restauration (PRA/PCA) :**
  * Archivage continu des journaux de transaction (WAL) permettant un *Point-in-Time Recovery* (PITR) jusqu'aux 14 derniers jours.
  * Instantanés (snapshots) quotidiens chiffrés avec rétention glissante sur 30 jours (conformité RGPD).

### 2.3 Équipements Réseau, Sécurité et Supervision

* **Repartiteur de charge (Load Balancer) & WAF :** Gestion des certificats TLS (HTTPS 1.3), protection Anti-DDoS, et filtrage OWASP.
* **Espace de Stockage Objets (S3 SecNumCloud) :** 100 Go d'espace chiffré pour la persistance des sauvegardes et le stockage d'éventuels justificatifs employeurs.
* **Supervision & Observabilité :** Collecte de métriques (Prometheus/Grafana) et centralisation des logs applicatifs anonymisés avec rétention limitée.

---

## 3. Matrice des Flux de Données Sortants (Egress Data Flow)

L'application **GéoEmploi** interagit de manière contrôlée avec le réseau extérieur. Les données qui quittent l'infrastructure sont strictement circonscrites aux besoins opérationnels, réglementaires et d'interopérabilité publique.

```
                                  +----------------------+
                                  |   GéoEmploi Infra    |
                                  +----------+-----------+
                                             |
     +-------------------+-------------------+-------------------+-------------------+
     |                   |                   |                   |                   |
     v                   v                   v                   v                   v
[Utilisateurs]    [FranceConnect]     [API Entreprise]     [BAN / IGN]     [Open Data / Public]
(Notifications)   (Auth OIDC)         (Vérification SIRET) (Géocodage)     (France Travail / Etalab)
```

### 3.1 Synthèse des Flux Sortants

| Destinataire / Partenaire | Catégorie de Données Sortantes | Finalité & Usage | Fréquence / Protocole |
| :--- | :--- | :--- | :--- |
| **Candidats & Employeurs** | Courriels transactionnels (avis de candidature, réinitialisation de mot de passe, alertes). | Notification des utilisateurs de la plateforme. | Événementiel via SMTP Sécurisé (TLS) vers relais souverain. |
| **API Entreprise / INSEE (SIRENE)** | Numéro SIRET saisi par l'employeur lors de sa demande de vérification. | Validation de l'existence juridique de l'entreprise avant autorisation de publication. | À la demande via API REST HTTPS (Client Express). |
| **Base Adresse Nationale (BAN) / IGN** | Chaîne d'adresse textuelle de l'offre d'emploi. | Géocodage (conversion adresse textuelle vers coordonnées GPS latitude/longitude). | À la création/édition d'offre via API REST HTTPS. |
| **FranceConnect / AgentConnect** | Jeton d'authentification OIDC / requêtes de vérification d'identité. | Authentification sécurisée des citoyens et agents publics. | Connexion utilisateur via HTTPS / OAuth 2.0. |
| **France Travail & data.gouv.fr (Etalab)** | Flux d'offres d'emploi publiques anonymisées (titre, description, commune, type de contrat). Exclut toute donnée personnelle usager. | Exposition en Open Data et syndication d'offres d'emploi nationales. | API Publique REST JSON (`/api/offers`) / Import quotidien. |

### 3.2 Engagements Sécurité & RGPD sur les Flux Sortants

1. **Minimisation des Données :** Aucune donnée à caractère personnel (nom, prénom, courriel, téléphone, CV) n'est exportée vers des tiers externes non autorisés ou hors de l'Union Européenne.
2. **Chiffrement des Flux :** Tous les flux sortants sont obligatoirement chiffrés en transit au moyen du protocole TLS 1.3.
3. **Anonymisation pour l'Open Data :** Les flux d'exposition publique d'offres ne comportent que des éléments géographiques et professionnels non identifiants au niveau individuel.
4. **Droit à l'Oubli et Purge :** La suppression d'un compte candidat ou employeur entraîne la purge ou l'anonymisation irréversible des enregistrements associés dans la base de données PostgreSQL nationale.

---

## 4. Synthèse pour la Direction

La solution **GéoEmploi**, telle qu'actuellement développée, présente une architecture conteneurisée moderne et sobre, directement prête pour un déploiement sur un **nuage souverain SecNumCloud**. 

L'empreinte d'infrastructure requise reste maîtrisée (cluster applicatif léger et base relationnelle PostgreSQL résiliente), et les flux de données sortants s'inscrivent parfaitement dans les standards d'interopérabilité de l'État (FranceConnect, API Entreprise, BAN, Open Data).
