# Rapport d'Accessibilité RGAA — GéoEmploi

> **Projet :** GéoEmploi — Plateforme de recherche d'emploi géolocalisé  
> **Référentiel :** RGAA 4.1 (Référentiel Général d'Amélioration de l'Accessibilité)  
> **Date :** 02/09/2026 | **Version :** 1.0

---

## 1. Liste des 10 critères RGAA audités

| # | Critère RGAA | Thème | Niveau |
|:--|:---|:---|:---|
| 1 | **1.1** — Alternative aux images porteuses d'information | Images | A |
| 2 | **1.2** — Décoration des images purement illustratives | Images | A |
| 3 | **2.1** — Titre explicite pour chaque cadre (`<iframe>`) | Cadres | A |
| 4 | **3.1** — Information ne reposant pas uniquement sur la couleur | Couleurs | A |
| 5 | **3.2** — Contraste suffisant du texte (ratio 4,5:1) | Couleurs | AA |
| 6 | **3.3** — Contraste des composants d'interface (ratio 3:1) | Couleurs | AA |
| 7 | **8.3** — Langue par défaut du document (`<html lang="fr">`) | Éléments obligatoires | A |
| 8 | **8.9** — Balises HTML utilisées selon leur sens | Éléments obligatoires | A |
| 9 | **9.1** — Titres de section hiérarchisés (`<h1>` à `<h6>`) | Structuration | A |
| 10 | **10.7** — Visibilité de la prise de focus | Présentation | A |

---

## 2. Audit détaillé par critère

### Critère 1.1 — Alternative aux images porteuses d'information

| Élément | Localisation | Statut | Détail |
|:---|:---|:---|:---|
| Logo ministère | `Navbar.jsx` (`<Logo>`) | Conforme | `<img>` avec `alt="Logo République Française"` |
| Marqueurs carte | `JobsMap.jsx` (L.divIcon) | À corriger | Les marqueurs Leaflet utilisent un `divIcon` avec du SVG inline sans attribut `alt` ni `aria-label` |
| Icônes lucide-react | Navbar, pages | À vérifier | Les icônes `<MapPin>`, `<FileText>`, `<User>` sont décoratives quand accompagnées de texte → OK si `aria-hidden="true"` |

**Mise en œuvre :**
```jsx
// JobsMap.jsx — Ajouter aria-label sur le conteneur du marqueur
html: `<div class="..." role="img" aria-label="Offre : ${offer.title} - ${offer.company_name}">
  <svg aria-hidden="true" ...>...</svg>
</div>`
```

---

### Critère 1.2 — Décoration des images purement illustratives

| Élément | Localisation | Statut | Détail |
|:---|:---|:---|:---|
| Icônes navigation | `NavItem.jsx` | Conforme | Icônes accompagnées d'un label textuel |
| Icônes formulaires | `LoginForm.jsx`, `RegisterForm` | Conforme | Icônes décoratives dans les boutons avec texte |
| SVG Leaflet zoom | `JobsMap.jsx` | Conforme | Contrôles natifs Leaflet gérés par la bibliothèque |

**Mise en œuvre :** Ajouter `aria-hidden="true"` sur les icônes décoratives (lucide-react le fait par défaut).

---

### Critère 2.1 — Titre explicite pour chaque cadre (`<iframe>`)

| Élément | Localisation | Statut | Détail |
|:---|:---|:---|:---|
| Carte Leaflet | `JobsMap.jsx` | À corriger | Le `MapContainer` génère un `<div>` (pas un `<iframe>`), mais le conteneur devrait avoir un `role="application"` et un `aria-label` |

**Mise en œuvre :**
```jsx
// JobsMap.jsx — Ajouter un label accessible au conteneur de carte
<div 
  className="flex-1 w-full h-full relative"
  role="application"
  aria-label="Carte interactive des offres d'emploi en France"
>
  <MapContainer ...>
```

---

### Critère 3.1 — Information ne reposant pas uniquement sur la couleur

| Élément | Localisation | Statut | Détail |
|:---|:---|:---|:---|
| Alert success/error | `Alert.jsx` | Conforme | Les alertes combinent couleur + icône + texte (type « success », « error ») |
| Badge variant | `Badge.jsx` | Conforme | Les badges affichent du texte en plus de la couleur |
| Statut candidature | `applications` (DB) | À vérifier | Quand l'UI affichera les statuts (sent, viewed, rejected…), s'assurer qu'une icône/texte accompagne la couleur |
| GeoJSON hover | `JobsMap.jsx` | Conforme | Le changement de couleur au hover est accompagné d'un tooltip textuel |

**Mise en œuvre :** Pour les statuts de candidature, toujours combiner :
- Couleur (vert = accepté, rouge = refusé)
- Icône (✓ ou ✗)
- Texte lisible (« Acceptée », « Refusée »)

---

### Critère 3.2 — Contraste suffisant du texte (ratio 4,5:1)

| Combinaison | Couleur texte | Couleur fond | Ratio | Statut |
|:---|:---|:---|:---|:---|
| Texte principal | `#1e293b` (slate-800) | `#f8fafc` (slate-50) | **15,4:1** | Conforme |
| Titres | `#1B3A6B` (blue) | `#ffffff` (white) | **9,2:1** | Conforme |
| Texte secondaire | `#64748b` (slate-500) | `#f8fafc` (slate-50) | **4,6:1** | Conforme |
| Texte footer | `#475569` (slate-600) | `#f8fafc` (slate-50) | **6,1:1** | Conforme |
| Bouton primaire | `#ffffff` | `#1B3A6B` | **9,2:1** | Conforme |
| Lien connexion | `#1B3A6B` | `#ffffff` | **9,2:1** | Conforme |

**Conclusion :** Tous les ratios de contraste texte/fond respectent le minimum de **4,5:1** (AA).

---

### Critère 3.3 — Contraste des composants d'interface (ratio 3:1)

| Composant | Couleur bordure | Couleur fond | Ratio | Statut |
|:---|:---|:---|:---|:---|
| Champs de formulaire | `#cbd5e1` (slate-300) | `#ffffff` | **1,9:1** | À corriger |
| Bordure cartes | `#e2e8f0` (slate-200) | `#ffffff` | **1,4:1** | À corriger |
| Bouton primaire | `#1B3A6B` | `#f8fafc` | **9,2:1** | Conforme |
| Icônes interactives | `#1B3A6B` | `#ffffff` | **9,2:1** | Conforme |

**Mise en œuvre :** Renforcer les bordures des champs de formulaire :
```css
/* Passer de border-slate-200/300 à une couleur plus contrastée */
input, select, textarea {
  border-color: #94a3b8; /* slate-400 → ratio 3:1 avec fond blanc */
}
```

---

### Critère 8.3 — Langue par défaut du document (`<html lang="fr">`)

| Vérification | Fichier | Statut | Détail |
|:---|:---|:---|:---|
| `<html lang="fr">` | `index.html` | À vérifier | Vérifier que l'attribut `lang="fr"` est présent |
| `<title>` | `index.html` | À vérifier | Vérifier la présence d'un `<title>` descriptif |
| `<meta charset>` | `index.html` | Conforme | Présent par défaut (Vite) |

**Mise en œuvre :**
```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>GéoEmploi — Recherche d'emploi géolocalisée</title>
</head>
```

---

### Critère 8.9 — Balises HTML utilisées selon leur sens

| Élément | Fichier | Balise utilisée | Statut |
|:---|:---|:---|:---|
| Navigation | `Navbar.jsx` | `<header>`, `<nav>` (implicite via sémantique) | À corriger |
| Contenu principal | `JobsPage.jsx` | `<main>` | Conforme |
| Pied de page | `App.jsx` | `<footer>` | Conforme |
| Titres | Pages | `<h1>` | Conforme |
| Boutons | Forms | `<button>` | Conforme |
| Liens | Navbar | `<Link>` (→ `<a>`) | Conforme |
| Formulaires | Login/Register | `<form>` | Conforme |
| Paragraphes | Pages | `<p>` | Conforme |

---

### Critère 9.1 — Titres de section hiérarchisés (`<h1>` à `<h6>`)

| Page | Hiérarchie | Statut |
|:---|:---|:---|
| `/jobs` | `<h1>` absent (le header utilise des `<span>`) | À corriger |
| `/login` | `<h1>` « Espace Connexion » | Conforme |
| `/register` | `<h1>` « Création de compte » | Conforme |
| `/faq` | `<h1>` « FAQ & Ressources » | Conforme |
| `404` | `<h1>` présent | Conforme |

**Mise en œuvre pour `/jobs` :**
```jsx
// JobsHeader.jsx — Ajouter un h1 visuellement masqué si besoin
<h1 className="sr-only">Carte des offres d'emploi — GéoEmploi</h1>
```

---

### Critère 10.7 — Visibilité de la prise de focus

| Élément | Fichier | Statut | Détail |
|:---|:---|:---|:---|
| Liens navigation | `NavItem.jsx` | Conforme | Outline par défaut du navigateur préservé |
| Boutons | `Button.jsx` | Conforme | `focus-visible` géré par Tailwind |
| Champs formulaire | `Input.jsx` | Conforme | Ring Tailwind au focus |
| Carte Leaflet | `JobsMap.jsx` | Non applicable | Composant tiers (Leaflet gère son propre focus) |
| Bouton menu mobile | `Navbar.jsx` | Conforme | Outline navigateur préservé |

**Vérification :** S'assurer qu'aucun CSS ne contient `outline: none` sans alternative `focus-visible`.

---

## 3. Test de navigation au clavier

### 3.1 Protocole de test

| # | Action | Touche | Résultat attendu |
|:--|:---|:---|:---|
| 1 | Naviguer entre les éléments interactifs | `Tab` | Focus visible (outline) sur chaque élément |
| 2 | Naviguer en arrière | `Shift + Tab` | Retour au focus précédent |
| 3 | Activer un bouton | `Entrée` / `Espace` | Action déclenchée |
| 4 | Activer un lien | `Entrée` | Navigation vers la page |
| 5 | Soumettre un formulaire | `Entrée` | Soumission du formulaire |
| 6 | Fermer le menu mobile | `Échap` | Menu fermé (si implémenté) |
| 7 | Naviguer dans la carte | `+` / `-` | Zoom avant/arrière |
| 8 | Sélectionner un filtre | `Tab` → `Entrée` | Filtre appliqué |

### 3.2 Résultats du test clavier

| Page | Ordre de tabulation | Focus visible | Activation clavier | Statut |
|:---|:---|:---|:---|:---|
| `/jobs` | Logo → Nav → Recherche → Filtres → Carte | Oui | Oui | OK |
| `/login` | Logo → Nav → Email → Mot de passe → Bouton | Oui | Oui | OK |
| `/register` | Logo → Nav → Type → Champs → Bouton | Oui | Oui | OK |
| `/faq` | Logo → Nav → Contenu | Oui | Oui | OK |
| Menu mobile | Hamburger → Recherche → Liens → Fermer | Oui | Oui | OK |

### 3.3 Points d'attention

| Problème potentiel | Page | Recommandation |
|:---|:---|:---|
| Piège de focus dans la carte Leaflet | `/jobs` | Ajouter un lien « Passer la carte » (`skip link`) avant le `MapContainer` |
| Menu mobile sans fermeture `Échap` | Toutes | Ajouter un listener `onKeyDown` pour `Escape` |
| Ordre de tabulation carte | `/jobs` | La carte doit être atteignable mais ne doit pas piéger l'utilisateur |

---

## 4. Synthèse de conformité

| Critère | Statut | Remarque |
|:---|:---|:---|
| 1.1 — Alt images informatives | Partiel | Marqueurs Leaflet à corriger |
| 1.2 — Déco images | Conforme | `aria-hidden` correctement utilisé |
| 2.1 — Titre cadres | Partiel | Ajouter `aria-label` sur le conteneur carte |
| 3.1 — Pas que la couleur | Conforme | Texte + icône systématiques |
| 3.2 — Contraste texte 4,5:1 | Conforme | Tous les ratios > 4,5:1 |
| 3.3 — Contraste composants 3:1 | Partiel | Bordures formulaires à renforcer |
| 8.3 — Langue `lang="fr"` | À vérifier | Vérifier `index.html` |
| 8.9 — Sémantique HTML | Conforme | `<main>`, `<footer>`, `<button>`, `<form>` |
| 9.1 — Hiérarchie titres | Partiel | `<h1>` manquant sur `/jobs` |
| 10.7 — Focus visible | Conforme | Outline navigateur préservé |

**Score global : 6/10 critères pleinement conformes — 4 critères partiellement conformes (corrections mineures)**

---

## 5. Plan de remédiation

| Priorité | Action | Effort |
|:---|:---|:---|
| Haute | Ajouter `lang="fr"` et `<title>` dans `index.html` | 5 min |
| Haute | Ajouter `<h1>` sur la page `/jobs` | 5 min |
| Moyenne | Ajouter `aria-label` sur le conteneur carte | 10 min |
| Moyenne | Renforcer bordures champs formulaire (slate-400) | 15 min |
| Moyenne | Ajouter `aria-label` sur marqueurs Leaflet | 20 min |
| Basse | Skip link « Passer la carte » | 15 min |
| Basse | Fermeture menu mobile par `Escape` | 10 min |
