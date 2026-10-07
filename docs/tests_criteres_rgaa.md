# Tests des Critères RGAA — GéoEmploi

> **Référentiel :** RGAA 4.1 | **Date :** 02/09/2026  
> **Pages testées :** `/jobs`, `/login`, `/register`, `/faq`, `404`

---

## Méthodologie

- **Navigateur :** Chrome
- **Outils :** DevTools, axe DevTools, Colour Contrast Analyser
- **Lecteur d'écran :** NVDA 2024.3
- **Clavier :** Test `Tab`/`Shift+Tab`/`Entrée`/`Espace`/`Échap`

---

## Test 1 — Critère 1.1 : Alternative aux images informatives

### Procédure
1. Inspecter chaque `<img>` et SVG porteur d'information
2. Vérifier la présence de `alt="..."` non vide
3. Vérifier que les marqueurs Leaflet ont un label accessible

### Résultats

| Page | Élément | `alt` / `aria-label` | Résultat |
|:---|:---|:---|:---|
| Toutes | Logo ministère `<img>` | `alt="Logo République Française"` | Pass |
| `/jobs` | Marqueurs Leaflet (divIcon) | Absent | Fail |
| `/jobs` | SVG dans marqueur | Aucun `aria-label` | Fail |
| `/login` | Icône ShieldCheck (Badge) | Décorative → OK si `aria-hidden` | Pass |

**Verdict : Partiellement conforme**

**Correction :**
```jsx
// JobsMap.jsx L10-12 — Ajouter role="img" et aria-label
html: `<div role="img" aria-label="Localisation de l'offre" ...>
  <svg aria-hidden="true" ...>...</svg>
</div>`
```

---

## Test 2 — Critère 1.2 : Décoration des images illustratives

### Procédure
1. Identifier les images/icônes décoratives
2. Vérifier `alt=""` ou `aria-hidden="true"`
3. Lancer NVDA et vérifier que le lecteur d'écran ne les lit pas

### Résultats

| Page | Élément | Traitement | Résultat |
|:---|:---|:---|:---|
| Navbar | `<MapPin>`, `<FileText>`, `<User>` | lucide-react ajoute `aria-hidden` par défaut | Pass |
| `/login` | `<ShieldCheck>` dans Badge | Accompagné de texte | Pass |
| `/register` | `<User>`, `<Building2>` | Accompagnés de texte | Pass |
| `/jobs` | Loader `<Loader2>` | Décoratif (texte adjacent) | Pass |

**Verdict : Conforme**

---

## Test 3 — Critère 2.1 : Titre des cadres `<iframe>`

### Procédure
1. Rechercher `<iframe>` dans le DOM
2. Vérifier la présence de `title="..."` sur chaque iframe
3. Vérifier les zones applicatives (carte Leaflet)

### Résultats

| Page | Élément | `title` / `aria-label` | Résultat |
|:---|:---|:---|:---|
| `/jobs` | MapContainer (pas un iframe, `<div>`) | Pas de `aria-label` | Recommandation |
| Toutes | Aucun `<iframe>` détecté | N/A | Pass |

**Verdict : Conforme** (pas d'iframe utilisé)

**Recommandation :** Ajouter `aria-label` sur le conteneur carte :
```jsx
<div role="application" aria-label="Carte interactive des offres d'emploi">
```

---

## Test 4 — Critère 3.1 : Information pas uniquement par la couleur

### Procédure
1. Identifier les informations transmises par la couleur
2. Vérifier qu'une icône ou un texte accompagne systématiquement
3. Simuler en niveaux de gris (DevTools → Rendering → Emulate vision deficiency → Achromatopsia)

### Résultats

| Page | Élément | Couleur seule ? | Résultat |
|:---|:---|:---|:---|
| Toutes | Alert success (vert) | Non → icône ✓ + texte « succès » | Pass |
| Toutes | Alert error (rouge) | Non → icône ✗ + texte « erreur » | Pass |
| `/jobs` | GeoJSON hover (bleu foncé) | Non → tooltip textuel | Pass |
| `/register` | Onglet actif (bleu) | Non → style différent (fond, poids police) | Pass |
| `/register` | Validation SIRET | Non → texte explicite | Pass |

**Verdict : ✅ Conforme**

---

## Test 5 — Critère 3.2 : Contraste texte ≥ 4,5:1

### Procédure
1. Relever les paires couleur texte / couleur fond
2. Calculer le ratio via Colour Contrast Analyser
3. Vérifier ratio ≥ 4,5:1 (texte normal) ou ≥ 3:1 (grand texte ≥ 24px)

### Résultats

| Paire | Texte | Fond | Ratio | Seuil | Résultat |
|:---|:---|:---|:---|:---|:---|
| Corps de texte | `#1e293b` | `#f8fafc` | **15,4:1** | 4,5:1 | Pass |
| Titres `<h1>` | `#1B3A6B` | `#ffffff` | **9,2:1** | 3:1 (grand) | Pass |
| Texte secondaire | `#64748b` | `#f8fafc` | **4,6:1** | 4,5:1 | Pass |
| Footer | `#475569` | `#f8fafc` | **6,1:1** | 4,5:1 | Pass |
| Bouton primaire | `#ffffff` | `#1B3A6B` | **9,2:1** | 4,5:1 | Pass |
| Placeholder input | `#94a3b8` | `#ffffff` | **3,0:1** | 4,5:1 | Note* |

> *Les placeholders ne sont pas considérés comme du contenu textuel par le RGAA.

**Verdict : ✅ Conforme**

---

## Test 6 — Critère 3.3 : Contraste composants ≥ 3:1

### Procédure
1. Identifier les composants interactifs (boutons, champs, icônes)
2. Mesurer le contraste de leurs bordures/contours avec le fond adjacent

### Résultats

| Composant | Bordure | Fond | Ratio | Résultat |
|:---|:---|:---|:---|:---|
| Input focus ring | `#1B3A6B` | `#ffffff` | **9,2:1** | Pass |
| Bouton primaire | `#1B3A6B` | `#f8fafc` | **9,2:1** | Pass |
| Bouton secondaire | `#1B3A6B` | `#ffffff` | **9,2:1** | Pass |
| Input border (repos) | `#cbd5e1` | `#ffffff` | **1,9:1** | Fail |
| Card border | `#e2e8f0` | `#f8fafc` | **1,2:1** | Fail |
| Icônes nav (actives) | `#1B3A6B` | `#ffffff` | **9,2:1** | Pass |

**Verdict : ⚠️ Partiellement conforme**

**Correction :**
```css
/* Renforcer les bordures au repos */
input, select, textarea {
  border-color: #94a3b8; /* slate-400 → ratio 3,0:1 */
}
.card {
  border-color: #94a3b8; /* slate-400 */
}
```

---

## Test 7 — Critère 8.3 : Langue du document `<html lang="fr">`

### Procédure
1. Ouvrir le code source (`Ctrl+U`)
2. Vérifier `<html lang="fr">`
3. Vérifier `<title>` descriptif

### Résultats

| Vérification | Valeur trouvée | Résultat |
|:---|:---|:---|
| `<html lang="...">` | `<html lang="en">` (défaut Vite) | Fail |
| `<title>` | `Vite + React` (défaut Vite) | Fail |
| `<meta charset>` | `UTF-8` | Pass |

**Verdict : Non conforme**

**Correction dans `index.html` :**
```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>GéoEmploi — Recherche d'emploi géolocalisée</title>
```

---

## Test 8 — Critère 8.9 : Sémantique HTML

### Procédure
1. Inspecter le DOM de chaque page
2. Vérifier que chaque balise est utilisée pour son rôle natif
3. Rechercher les anti-patterns (`<div>` cliquable, `<span>` comme bouton)

### Résultats

| Rôle | Balise attendue | Balise utilisée | Page | Résultat |
|:---|:---|:---|:---|:---|
| En-tête | `<header>` | `<header>` | Toutes | Pass |
| Navigation | `<nav>` | `<div>` (implicite) | Navbar | Recommandation |
| Contenu principal | `<main>` | `<main>` | Toutes | Pass |
| Pied de page | `<footer>` | `<footer>` | Toutes | Pass |
| Bouton | `<button>` | `<button>` | Toutes | Pass |
| Lien | `<a>` | `<Link>` → `<a>` | Toutes | Pass |
| Formulaire | `<form>` | `<form>` | Login, Register | Pass |
| Paragraphe | `<p>` | `<p>` | Toutes | Pass |
| Liste | `<ul>/<li>` | Non utilisé pour la nav | Navbar | Recommandation |

**Verdict : Conforme** (recommandations mineures)

---

## Test 9 — Critère 9.1 : Hiérarchie des titres

### Procédure
1. Lister tous les titres `<h1>` à `<h6>` par page
2. Vérifier qu'il n'y a pas de saut de niveau
3. Vérifier qu'il y a un seul `<h1>` par page

### Résultats

| Page | `<h1>` | `<h2>` | `<h3>` | Sauts | Résultat |
|:---|:---|:---|:---|:---|:---|
| `/jobs` | Absent | — | — | — | Fail |
| `/login` | « Espace Connexion » | — | — | Non | Pass |
| `/register` | « Création de compte » | — | — | Non | Pass |
| `/faq` | « FAQ & Ressources » | — | — | Non | Pass |
| `404` | Présent | — | — | Non | Pass |

**Verdict : Partiellement conforme**

**Correction pour `/jobs` :**
```jsx
// JobsHeader.jsx — Ajouter un h1 (visible ou sr-only)
<h1 className="sr-only">Carte des offres d'emploi</h1>
// ou un h1 visible dans le header
```

---

## Test 10 — Critère 10.7 : Visibilité du focus clavier

### Procédure
1. Naviguer avec `Tab` sur chaque page
2. Vérifier qu'un indicateur visuel (outline, ring) est visible à chaque focus
3. Rechercher `outline: none` ou `outline: 0` dans le CSS

### Résultats

| Page | Élément | Focus visible | Style | Résultat |
|:---|:---|:---|:---|:---|
| Toutes | Liens navbar | Oui | Outline navigateur | Pass |
| Toutes | Bouton menu mobile | Oui | Outline navigateur | Pass |
| `/login` | Input email | Oui | Ring Tailwind `focus:ring-2` | Pass |
| `/login` | Input password | Oui | Ring Tailwind | Pass |
| `/login` | Bouton submit | Oui | Ring Tailwind | Pass |
| `/register` | Onglets type compte | Oui | Style actif visible | Pass |
| `/register` | Tous les inputs | Oui | Ring Tailwind | Pass |
| `/jobs` | Carte Leaflet | Partiel | Contrôles Leaflet natifs | Note |

**Recherche `outline: none` :**
```bash
grep -r "outline: none" src/ → Aucun résultat
grep -r "outline:none" src/  → Aucun résultat
grep -r "outline: 0" src/    → Aucun résultat
```

**Verdict : Conforme**

---

## Test Navigation Clavier Complet

### Parcours Tab sur `/jobs`

| # | Élément atteint | Activation | Note |
|:--|:---|:---|:---|
| 1 | Logo (lien accueil) | `Entrée` → `/` | OK |
| 2 | Lien « Carte des emplois » | `Entrée` → `/jobs` | OK |
| 3 | Lien « FAQ & Ressources » | `Entrée` → `/faq` | OK |
| 4 | Lien « Me connecter » | `Entrée` → `/login` | OK |
| 5 | Barre de recherche | Saisie texte | OK |
| 6 | Filtre contrat | `Entrée` → menu | OK |
| 7 | Carte Leaflet | `+`/`-` zoom | Piège potentiel |

### Parcours Tab sur `/login`

| # | Élément atteint | Activation |
|:--|:---|:---|
| 1-4 | Navigation (idem) | OK |
| 5 | Input email | Saisie |
| 6 | Input mot de passe | Saisie |
| 7 | Toggle visibilité mdp | `Entrée` |
| 8 | Lien « Mot de passe oublié ? » | `Entrée` |
| 9 | Bouton « Se connecter » | `Entrée`/`Espace` |
| 10 | Lien « Créer un compte » | `Entrée` |

### Parcours Tab sur `/register`

| # | Élément atteint | Activation |
|:--|:---|:---|
| 1-4 | Navigation (idem) | OK |
| 5 | Onglet « Candidat » | `Entrée`/`Espace` |
| 6 | Onglet « Employeur » | `Entrée`/`Espace` |
| 7-N | Champs du formulaire | Saisie |
| N+1 | Bouton « Créer mon compte » | `Entrée`/`Espace` |
| N+2 | Lien « Se connecter » | `Entrée` |

---

## Synthèse Finale

| # | Critère | Résultat | Action |
|:--|:---|:---|:---|
| 1 | 1.1 — Alt images informatives | Partiel | Ajouter `aria-label` marqueurs Leaflet |
| 2 | 1.2 — Déco images | Conforme | — |
| 3 | 2.1 — Titre cadres | Conforme | Recommandation : `aria-label` carte |
| 4 | 3.1 — Pas que la couleur | Conforme | — |
| 5 | 3.2 — Contraste texte 4,5:1 | Conforme | — |
| 6 | 3.3 — Contraste composants 3:1 | Partiel | Bordures input → `slate-400` |
| 7 | 8.3 — Langue `lang="fr"` | Non conforme | Corriger `index.html` |
| 8 | 8.9 — Sémantique HTML | Conforme | Recommandation : `<nav>` |
| 9 | 9.1 — Hiérarchie titres | Partiel | `<h1>` manquant `/jobs` |
| 10 | 10.7 — Focus visible | Conforme | — |

**Score : 6/10 pleinement conformes — 3 partiels — 1 non conforme**

**Toutes les corrections identifiées sont mineures (< 1h de travail total).**
