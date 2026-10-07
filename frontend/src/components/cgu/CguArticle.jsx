import {
  FileText,
  CheckCircle2,
  Lock,
  Scale,
  MapPin,
  ShieldCheck,
  Eye,
  AlertCircle,
  Cookie,
  UserX,
  RefreshCw,
} from 'lucide-react';

const Section = ({ title, icon, children }) => (
  <section className="space-y-3">
    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
      {icon}
      <span>{title}</span>
    </h2>
    <div className="text-slate-700 leading-relaxed text-sm space-y-3">{children}</div>
  </section>
);

const SubSection = ({ title, children }) => (
  <div className="space-y-1">
    <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
    <div className="text-slate-600 leading-relaxed text-sm space-y-1.5">{children}</div>
  </div>
);

const List = ({ items }) => (
  <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600 text-sm">
    {items.map((item, idx) => (
      <li key={idx}>{item}</li>
    ))}
  </ul>
);

export const CguArticle = () => {
  return (
    <div className="space-y-8">
      <Section title="Préambule" icon={<FileText size={18} className="text-blue" />}>
        <p>
          La plateforme <strong>GéoEmplois</strong> (ci-après « la Plateforme ») est un service numérique public opéré par le Ministère du Travail et du Bonheur. Elle permet la mise en relation géolocalisée entre candidats à l'emploi et employeurs sur le territoire français.
        </p>
        <p>
          L'utilisation de la Plateforme implique l'acceptation pleine et entière des présentes Conditions Générales d'Utilisation (CGU). Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le service.
        </p>
      </Section>

      <Section title="Article 1 — Objet" icon={<CheckCircle2 size={18} className="text-blue" />}>
        <p>
          Les présentes CGU définissent les conditions d'accès et d'utilisation de la Plateforme GéoEmplois.
        </p>
        <p>La Plateforme propose les services suivants :</p>
        <List
          items={[
            "Consultation d'offres d'emploi géolocalisées sur une carte interactive",
            "Recherche d'offres par localisation (département, arrondissement, rayon GPS)",
            "Création de compte candidat pour postuler aux offres",
            "Création de compte employeur pour publier des offres d'emploi",
            "Gestion des candidatures (envoi, suivi, historique)",
          ]}
        />
      </Section>

      <Section title="Article 2 — Définitions" icon={<FileText size={18} className="text-blue" />}>
        <List
          items={[
            <><strong>Utilisateur :</strong> Toute personne physique accédant à la Plateforme, qu'elle soit inscrite ou non.</>,
            <><strong>Candidat :</strong> Utilisateur inscrit avec un compte de type « Candidat / Particulier ».</>,
            <><strong>Employeur :</strong> Utilisateur inscrit avec un compte de type « Employeur / Entreprise ».</>,
            <><strong>Administrateur :</strong> Personnel autorisé par le Responsable de traitement à modérer le contenu et les comptes.</>,
            <><strong>Offre d'emploi :</strong> Annonce publiée par un Employeur décrivant un poste à pourvoir.</>,
            <><strong>Candidature :</strong> Acte par lequel un Candidat postule à une Offre d'emploi.</>,
          ]}
        />
      </Section>

      <Section title="Article 3 — Accès à la Plateforme" icon={<FileText size={18} className="text-blue" />}>
        <SubSection title="3.1 Accès libre">
          <p>
            La consultation des offres d'emploi et l'utilisation de la carte interactive sont accessibles librement sans inscription.
          </p>
        </SubSection>

        <SubSection title="3.2 Accès avec inscription">
          <p>La création d'un compte est nécessaire pour :</p>
          <List
            items={[
              "Postuler à une offre d'emploi (Candidat)",
              "Publier une offre d'emploi (Employeur)",
              'Recevoir des notifications',
              'Gérer son profil et ses candidatures',
            ]}
          />
        </SubSection>

        <SubSection title="3.3 Conditions d'inscription">
          <p>L'Utilisateur doit :</p>
          <List
            items={[
              'Être une personne physique majeure (ou un représentant légal d\'une personne morale)',
              'Fournir une adresse e-mail valide et unique',
              'Choisir un mot de passe conforme aux exigences de sécurité (minimum 8 caractères)',
              'Pour les Employeurs : fournir un numéro SIRET valide (vérifié par algorithme de Luhn)',
            ]}
          />
        </SubSection>
      </Section>

      <Section title="Article 4 — Inscription et Compte Utilisateur" icon={<Lock size={18} className="text-blue" />}>
        <SubSection title="4.1 Création de compte">
          <p>Deux types de comptes sont proposés :</p>
          <List
            items={[
              'Candidat / Particulier : Nom, prénom, e-mail, mot de passe',
              'Employeur / Entreprise : Nom de l\'entreprise, SIRET, e-mail, mot de passe',
            ]}
          />
        </SubSection>

        <SubSection title="4.2 Sécurité du compte">
          <p>
            L'Utilisateur est responsable de la confidentialité de ses identifiants. Les mots de passe sont protégés par des mécanismes de chiffrement irréversible robustes et éprouvés, conformes aux exigences de sécurité de l'ANSSI. GéoEmplois ne stocke jamais les mots de passe en clair.
          </p>
        </SubSection>

        <SubSection title="4.3 Exactitude des informations">
          <p>
            L'Utilisateur s'engage à fournir des informations exactes et à jour. Toute fausse déclaration peut entraîner la suspension ou la suppression du compte.
          </p>
        </SubSection>
      </Section>

      <Section title="Article 5 — Obligations de l'Utilisateur" icon={<Scale size={18} className="text-blue" />}>
        <p>L'Utilisateur s'engage à :</p>
        <List
          items={[
            "Utiliser la Plateforme conformément à sa finalité (recherche d'emploi)",
            'Ne pas publier de contenu illicite, discriminatoire, diffamatoire ou trompeur',
            "Ne pas usurper l'identité d'un tiers",
            "Ne pas tenter d'accéder aux données d'autres utilisateurs",
            'Ne pas utiliser la Plateforme à des fins de spam ou de sollicitation commerciale non autorisée',
            'Ne pas contourner les mesures de sécurité de la Plateforme',
            'Respecter les droits de propriété intellectuelle',
          ]}
        />
      </Section>

      <Section title="Article 6 — Obligations des Employeurs" icon={<Scale size={18} className="text-blue" />}>
        <p>L'Employeur s'engage à :</p>
        <List
          items={[
            "Publier uniquement des offres d'emploi réelles et licites",
            'Respecter le Code du Travail français dans la rédaction des offres',
            "Ne pas publier d'offres discriminatoires (origine, sexe, âge, handicap, orientation sexuelle, opinions politiques, etc.)",
            'Fournir un numéro SIRET valide correspondant à son entreprise',
            'Répondre dans un délai raisonnable aux candidatures reçues',
            'Supprimer ou clôturer les offres pourvues',
          ]}
        />
        <p className="text-xs text-slate-500 italic mt-2">
          Les offres sont soumises à modération avant publication. L'Administrateur peut rejeter toute offre non conforme.
        </p>
      </Section>

      <Section title="Article 7 — Géolocalisation" icon={<MapPin size={18} className="text-blue" />}>
        <SubSection title="7.1 Consentement et parcours utilisateur">
          <p>
            L'utilisation de la géolocalisation est strictement facultative. L'accès à la Plateforme et la recherche d'emploi s'effectuent librement sans obligation de localisation. Le recueil du consentement s'appuie sur une mention d'information préalable explicite affichée avant tout appel technique : l'autorisation demandée par le navigateur ne fait pas office de consentement RGPD unique. L'Utilisateur est pré-informé de la finalité et conserve la liberté de révoquer ce choix à tout moment dans ses réglages de compte.
          </p>
        </SubSection>

        <SubSection title="7.2 Données de localisation">
          <p>
            Les données de localisation collectées (latitude, longitude, département, code postal) sont traitées conformément à notre Fiche de Traitement RGPD et à notre AIPD Allégée.
          </p>
        </SubSection>

        <SubSection title="7.3 Fonctionnement sans géolocalisation">
          <p>Sans géolocalisation, l'Utilisateur peut rechercher des offres par :</p>
          <List
            items={[
              'Clic sur les départements de la carte interactive',
              'Filtres par département ou code postal',
              'Barre de recherche textuelle',
            ]}
          />
        </SubSection>
      </Section>

      <Section title="Article 8 — Protection des Données Personnelles" icon={<ShieldCheck size={18} className="text-blue" />}>
        <SubSection title="8.1 Responsable de traitement">
          <p>GéoEmplois, agissant pour le Ministère du Travail et du Bonheur.</p>
        </SubSection>

        <SubSection title="8.2 Données collectées">
          <List
            items={[
              'Données d\'identification : nom, prénom, e-mail',
              'Données professionnelles : CV, expériences, compétences (candidats) ; SIRET, nom d\'entreprise (employeurs)',
              'Données de localisation : latitude, longitude, département, code postal (facultatif)',
              'Données de connexion : adresse IP, date de connexion',
            ]}
          />
        </SubSection>

        <SubSection title="8.3 Finalités">
          <List
            items={[
              'Mise en relation candidats/employeurs',
              'Géolocalisation des offres d\'emploi',
              'Modération du contenu',
              'Notifications',
            ]}
          />
        </SubSection>

        <SubSection title="8.4 Base légale">
          <List
            items={[
              'Consentement (Art. 6.1.a RGPD) : géolocalisation',
              'Exécution du contrat (Art. 6.1.b RGPD) : gestion du compte et des candidatures',
              'Intérêt légitime (Art. 6.1.f RGPD) : sécurité et modération',
            ]}
          />
        </SubSection>

        <SubSection title="8.5 Droits des Utilisateurs & Contact du DPO">
          <p>Conformément au RGPD, l'Utilisateur dispose des droits suivants :</p>
          <List
            items={[
              'Accès (Art. 15) — Consulter ses données',
              'Rectification (Art. 16) — Modifier ses données',
              'Effacement (Art. 17) — Supprimer son compte et ses données (droit à l\'oubli)',
              'Portabilité (Art. 20) — Exporter ses données',
              'Opposition (Art. 21) — S\'opposer au traitement',
              'Limitation (Art. 18) — Limiter le traitement',
            ]}
          />
          <p className="mt-2 text-xs text-slate-600 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
            Pour toute question ou exercice de ces droits, l'Utilisateur peut contacter directement le Délégué à la Protection des Données (DPO) par courriel à l'adresse officielle : <strong>dpo@emploi.gouv.fr</strong>.
          </p>
        </SubSection>

        <SubSection title="8.6 Transmission aux tiers et accès technique">
          <p>
            Aucune donnée personnelle n'est vendue, louée ou transmise à des tiers à des fins commerciales. L'équipe technique opère les déploiements et accède aux données dans le strict cadre de la maintenance, de l'hébergement et de la sécurité, éliminant tout risque d'interprétation sur une transmission de données à des tiers. Les tuiles cartographiques OpenStreetMap sont chargées côté navigateur sans transmission de données personnelles.
          </p>
        </SubSection>

        <SubSection title="8.7 Durées de conservation et politique de purge">
          <List
            items={[
              'Coordonnées de géolocalisation : purge immédiate lors de la désactivation du paramètre dans les réglages de compte.',
              'Vues d\'offres et journaux techniques : purge automatique au-delà de 90 jours.',
              'Offres closes ou expirées : archivage automatique au-delà de 30 jours (retrait de la recherche publique).',
              'Comptes inactifs et candidatures : conservation délimitée à 2 ans.',
            ]}
          />
        </SubSection>
      </Section>

      <Section title="Article 9 — Modération" icon={<Eye size={18} className="text-blue" />}>
        <SubSection title="9.1 Modération des offres">
          <p>Toute offre d'emploi publiée est soumise à modération. L'Administrateur peut :</p>
          <List items={['Approuver une offre', 'Rejeter une offre (avec motif)', 'Signaler une offre']} />
        </SubSection>

        <SubSection title="9.2 Modération des comptes">
          <p>
            L'Administrateur peut suspendre ou supprimer un compte utilisateur en cas de violation des présentes CGU, avec indication du motif.
          </p>
        </SubSection>

        <SubSection title="9.3 Signalement">
          <p>Tout Utilisateur peut signaler un contenu ou un comportement inapproprié.</p>
        </SubSection>
      </Section>

      <Section title="Article 10 — Propriété Intellectuelle" icon={<FileText size={18} className="text-blue" />}>
        <SubSection title="10.1 Contenu de la Plateforme">
          <p>
            La Plateforme, son design, son code source, ses textes et sa charte graphique sont la propriété de GéoEmplois / Ministère du Travail et du Bonheur.
          </p>
        </SubSection>

        <SubSection title="10.2 Contenu Utilisateur">
          <p>
            L'Utilisateur conserve la propriété intellectuelle de ses contenus (CV, lettres de motivation, offres). En publiant des données sur la Plateforme, il accorde une licence non exclusive et révocable d'affichage dans le cadre du service.
          </p>
        </SubSection>

        <SubSection title="10.3 Données ouvertes">
          <p>
            Les données cartographiques utilisées proviennent d'OpenStreetMap (licence ODbL) et de l'IGN / data.gouv.fr (licence ouverte).
          </p>
        </SubSection>
      </Section>

      <Section title="Article 11 — Responsabilité" icon={<AlertCircle size={18} className="text-blue" />}>
        <SubSection title="11.1 Limitation">
          <p>
            GéoEmplois s'efforce de maintenir la disponibilité de la Plateforme mais ne garantit pas un fonctionnement ininterrompu. GéoEmplois ne saurait être tenu responsable :
          </p>
          <List
            items={[
              'Des interruptions de service pour maintenance',
              'Des erreurs dans les offres publiées par les Employeurs',
              'De la véracité des informations fournies par les Utilisateurs',
              'Des suites données aux candidatures',
            ]}
          />
        </SubSection>

        <SubSection title="11.2 Liens externes">
          <p>
            La Plateforme peut contenir des liens vers des sites externes. GéoEmplois n'est pas responsable du contenu de ces sites.
          </p>
        </SubSection>
      </Section>

      <Section title="Article 12 — Cookies" icon={<Cookie size={18} className="text-blue" />}>
        <p>
          La Plateforme utilise uniquement des traceurs et témoins de connexion strictement techniques nécessaires au fonctionnement du service (maintien sécurisé de la session de connexion, mémorisation des préférences de navigation). Aucun cookie publicitaire ou de traçage n'est utilisé.
        </p>
      </Section>

      <Section title="Article 13 — Suspension et Résiliation" icon={<UserX size={18} className="text-blue" />}>
        <SubSection title="13.1 Par l'Utilisateur">
          <p>
            L'Utilisateur peut supprimer son compte à tout moment depuis son espace personnel. La suppression entraîne l'effacement immédiat, définitif et irréversible de l'ensemble de ses données personnelles, de son profil et des activités associées sur la Plateforme.
          </p>
        </SubSection>

        <SubSection title="13.2 Par l'Administrateur">
          <p>L'Administrateur peut suspendre ou supprimer un compte en cas de :</p>
          <List
            items={[
              'Violation des présentes CGU',
              'Publication de contenu illicite',
              'Usurpation d\'identité',
              'Tentative d\'atteinte à la sécurité du service',
            ]}
          />
        </SubSection>
      </Section>

      <Section title="Article 14 — Modification des CGU" icon={<RefreshCw size={18} className="text-blue" />}>
        <p>
          GéoEmplois se réserve le droit de modifier les présentes CGU. Les Utilisateurs seront informés de toute modification substantielle par notification sur la Plateforme. La poursuite de l'utilisation après notification vaut acceptation.
        </p>
      </Section>

      <Section title="Article 15 — Droit applicable et juridiction" icon={<Scale size={18} className="text-blue" />}>
        <p>
          Les présentes CGU sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut, les tribunaux compétents sont ceux du ressort de Paris.
        </p>
      </Section>
    </div>
  );
};
