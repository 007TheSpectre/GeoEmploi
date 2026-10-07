import { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Clock,
  Lock,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { TransparencyCard } from '../components/faq/TransparencyCard';
import { FaqCategoryFilter } from '../components/faq/FaqCategoryFilter';
import { FaqAccordionItem } from '../components/faq/FaqAccordionItem';
import { FAQ_CATEGORIES, FAQ_ITEMS } from '../components/faq/faqData';

export const FaqPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredFaq =
    activeCategory === 'all'
      ? FAQ_ITEMS
      : FAQ_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <main className="flex-1 bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Badge variant="info" icon={<ShieldCheck size={14} />}>
              Transparence & Engagements
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Transparence & Foire Aux Questions
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
            Découvrez nos engagements d'intérêt général : neutralité, gratuité intégrale,
            gouvernance des données et précision géographique territoriale.
          </p>
        </div>

        <section aria-labelledby="transparency-pillars" className="space-y-6">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h2 id="transparency-pillars" className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles size={20} className="text-blue" />
              Nos 4 Piliers de Transparence
            </h2>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Conformité & Éthique du service
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TransparencyCard
              icon={<CheckCircle2 size={22} />}
              iconClassName="bg-emerald-50 text-emerald-600 border-emerald-100"
              title="1. Gratuité Intégrale du Service"
              subtitle="100% gratuit pour candidats et recruteurs"
              subtitleClassName="text-emerald-700"
            >
              <p>
                GeoEmploi est un démonstrateur technique dont l'accès est entièrement gratuit.
                Aucun paiement n'est requis pour consulter les offres, postuler, créer son profil
                ou publier des annonces d'emploi. Il n'existe aucune formule payante, aucun système
                d'enchère pour mettre en avant une offre et aucune commission d'intermédiation.
              </p>
            </TransparencyCard>

            <TransparencyCard
              icon={<MapPin size={22} />}
              iconClassName="bg-blue-light text-blue border-blue/20"
              title="2. Maillage à Précision Communale"
              subtitle="Focalisation sur le bassin de vie local"
              subtitleClassName="text-blue"
            >
              <p>
                Le découpage géographique s'appuie sur la commune comme unité de référence (codes INSEE
                et centroïdes officiels), articulé avec les arrondissements et les départements. Ce choix
                assure une lisibilité directe des temps de trajet et des opportunités d'emploi réelles, tout
                en interdisant toute géolocalisation invasive en temps réel des utilisateurs.
              </p>
            </TransparencyCard>

            <TransparencyCard
              icon={<Clock size={22} />}
              iconClassName="bg-amber-50 text-amber-700 border-amber-200"
              title="3. Durées de Rétention & Purges"
              subtitle="Calendrier strict de conservation"
              subtitleClassName="text-amber-800"
            >
              <div className="space-y-1.5">
                <p>
                  Les données stockées font l'objet d'un cycle de vie délimité et contrôlé :
                </p>
                <ul className="text-xs space-y-1 text-slate-700 list-disc list-inside">
                  <li><span className="font-bold">Coordonnées GPS :</span> purge immédiate dès la désactivation dans les réglages.</li>
                  <li><span className="font-bold">Vues d'offres & logs :</span> purge automatique au-delà de 90 jours.</li>
                  <li><span className="font-bold">Offres closes/expirées :</span> archivage automatique au-delà de 30 jours.</li>
                  <li><span className="font-bold">Comptes inactifs & candidatures :</span> conservation délimitée à 2 ans.</li>
                </ul>
              </div>
            </TransparencyCard>

            <TransparencyCard
              icon={<Lock size={22} />}
              iconClassName="bg-slate-100 text-slate-800 border-slate-200"
              title="4. Délégué à la Protection des Données"
              subtitle="Contact direct & conformité RGPD"
              subtitleClassName="text-slate-700"
            >
              <div className="space-y-2">
                <p>
                  Un Délégué à la Protection des Données (DPO) veille à la conformité continue des traitements
                  et au respect de vos droits.
                </p>
                <div className="text-xs bg-slate-200/70 p-2 rounded-lg text-slate-800 font-medium">
                  Contact officiel : <a href="mailto:dpo@emploi.gouv.fr" className="text-blue hover:underline font-bold">dpo@emploi.gouv.fr</a>
                </div>
              </div>
            </TransparencyCard>
          </div>
        </section>

        <section aria-labelledby="faq-section" className="space-y-6">
          <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 id="faq-section" className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle size={20} className="text-blue" />
              Foire Aux Questions (FAQ)
            </h2>

            <FaqCategoryFilter
              categories={FAQ_CATEGORIES}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
            />
          </div>

          <div className="space-y-3">
            {filteredFaq.map((item, index) => (
              <FaqAccordionItem
                key={`${item.category}-${index}`}
                id={index}
                question={item.question}
                answer={item.answer}
                isOpen={openIndex === index}
                onToggle={() => toggleAccordion(index)}
              />
            ))}
          </div>
        </section>

        <section className="bg-blue-light/50 border border-blue/20 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-blue">
              Consultez les Conditions Générales d'Utilisation
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
              Retrouvez l'ensemble des règles contractuelles encadrant la publication d'offres et la protection des utilisateurs sur notre plateforme.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="secondary" size="md" href="/cgu">
              Lire les CGU
            </Button>
            <Button variant="primary" size="md" href="/jobs">
              Voir la carte
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
};
