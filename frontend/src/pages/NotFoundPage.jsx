import { Home, MapPin, AlertCircle } from 'lucide-react';
import { Button, ButtonGroup } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Alert } from '../components/common/Alert';

export const NotFoundPage = () => {
  return (
    <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-[calc(100vh-140px)] flex flex-col justify-center items-center">
      <div className="max-w-xl mx-auto w-full text-center">
        <div className="flex justify-center mb-4">
          <Badge variant="warning" icon={<AlertCircle size={14} />}>
            Erreur 404 — Page non trouvée
          </Badge>
        </div>

        <h1 className="text-6xl sm:text-8xl font-black text-blue tracking-tight mb-2">
          404
        </h1>

        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
          La page que vous cherchez n'existe pas
        </h2>

        <div className="mb-8 text-left">
          <Alert
            type="warning"
            title="Page introuvable ou déplacée"
            description="L'adresse URL que vous avez saisie est peut-être incorrecte ou la page n'est plus disponible sur le portail GÉOEMPLOI."
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm mb-8 space-y-4">
          <p className="text-sm text-slate-600">
            Vous pouvez retourner à la page d'accueil ou consulter la carte des offres d'emploi.
          </p>

          <ButtonGroup align="center" inlineBreakpoint="sm" className="pt-2">
            <Button variant="primary" href="/" icon={<Home size={18} />}>
              Retour à l'accueil
            </Button>
            <Button variant="secondary" href="/jobs" icon={<MapPin size={18} />}>
              Carte des emplois
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </main>
  );
};
