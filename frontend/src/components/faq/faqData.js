export const FAQ_CATEGORIES = [
  { id: 'all', label: 'Toutes les questions' },
  { id: 'candidat', label: 'Candidats' },
  { id: 'employeur', label: 'Employeurs' },
  { id: 'territoire', label: 'Cartographie & Données' },
];

export const FAQ_ITEMS = [
  {
    category: 'candidat',
    question: "Comment postuler à une offre d'emploi ?",
    answer:
      "Lorsque vous cliquez sur une offre d'emploi depuis la carte ou la liste latérale, la fiche de poste détaillée s'affiche. Vous y trouverez le descriptif, les compétences requises ainsi que les modalités de candidature. Si un compte candidat est requis pour déposer un dossier en ligne, la connexion ou l'inscription se fait en moins d'une minute, sans aucun frais.",
  },
  {
    category: 'candidat',
    question: 'Dois-je obligatoirement créer un compte pour consulter les offres ?',
    answer:
      "Non. La consultation de la carte, l'exploration par département, commune ou arrondissement, ainsi que la lecture des fiches de poste sont 100% libres et ouvertes sans compte. La création d'un compte candidat devient nécessaire uniquement pour sauvegarder des offres dans votre tableau de bord personnel et suivre vos démarches.",
  },
  {
    category: 'candidat',
    question: 'Mes coordonnées sont-elles visibles publiquement ?',
    answer:
      "Non. Vos coordonnées personnelles, votre adresse électronique et votre numéro de téléphone ne sont jamais affichés publiquement sur la carte ou dans les moteurs de recherche. Elles ne sont transmises qu'aux recruteurs auprès desquels vous candidatez volontairement.",
  },
  {
    category: 'employeur',
    question: "Comment référencer et publier une offre en tant qu'employeur ?",
    answer:
      "Il vous suffit de créer un compte Employeur / Organisme en renseignant votre numéro SIRET valide et les informations de votre établissement. Une fois connecté, vous disposez d'un formulaire de publication complet vous permettant de localiser précisément votre opportunité, de renseigner le type de contrat, la rémunération et le rayon de diffusion.",
  },
  {
    category: 'employeur',
    question: "Combien coûte la diffusion d'annonces sur GeoEmploi ?",
    answer:
      "Le service est entièrement gratuit. Aucune commission n'est prélevée sur les recrutements réalisés et il n'existe aucune option payante « sponsorisée ». Toutes les offres d'emploi sont traitées avec équité et classées selon des critères géographiques et de récence objectifs.",
  },
  {
    category: 'employeur',
    question: 'Comment sont modérées les offres déposées ?',
    answer:
      "Toute annonce publiée doit respecter la législation en vigueur : interdiction absolue des clauses discriminatoires (âge, sexe, situation familiale, etc.), sincérité des éléments contractuels et réalité de l'opportunité proposée. Les administrateurs de la plateforme peuvent désactiver en temps réel toute offre non conforme.",
  },
  {
    category: 'territoire',
    question: "D'où proviennent les découpages cartographiques ?",
    answer:
      "Les données géographiques, contours départementaux et limites communales sont issues des fonds de données ouverts de référence de l'IGN (Institut National de l'Information Géographique et Forestière) via la Géoplateforme, garantissant une cartographie précise et continuellement actualisée.",
  },
  {
    category: 'territoire',
    question: 'Pourquoi le maillage communal est-il privilégié ?',
    answer:
      "L'échelle communale constitue le juste équilibre entre la réalité des bassins de mobilité quotidienne des travailleurs et la stricte préservation de la vie privée. Elle évite la géolocalisation intrusive de l'adresse exacte du domicile tout en offrant une visibilité territoriale pertinente.",
  },
  {
    category: 'candidat',
    question: 'Quelles sont les durées de conservation et de purge de mes données ?',
    answer:
      "Le cycle de vie de vos données est rigoureusement délimité : purge immédiate de vos coordonnées dès la désactivation de la géolocalisation dans vos réglages, purge automatique des vues d'offres et journaux techniques au-delà de 90 jours, archivage automatique des offres closes ou expirées au-delà de 30 jours, et suppression des comptes inactifs après 2 ans.",
  },
  {
    category: 'candidat',
    question: 'Comment contacter le Délégué à la Protection des Données (DPO) ?',
    answer:
      "Pour exercer vos droits d'accès, de rectification, d'effacement (droit à l'oubli) ou de portabilité de vos données, vous pouvez écrire directement à notre Délégué à la Protection des Données par courriel à dpo@emploi.gouv.fr.",
  },
];
