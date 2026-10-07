import { Link } from 'react-router-dom';
import { ArrowLeft, Scale, AlertCircle } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { CguArticle } from '../components/cgu/CguArticle';

export const CguPage = () => {
  return (
    <main className="flex-1 bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-blue hover:text-blue-hover transition-colors"
          >
            <ArrowLeft size={16} />
            Retour à la carte des emplois
          </Link>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral" icon={<Scale size={13} />}>
                Cadre Juridique Officiel
              </Badge>
              <span className="text-xs text-slate-500 font-medium">
                Version 1.0 — En vigueur : 02/09/2026 — Dernière mise à jour : 02/09/2026
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Conditions Générales d'Utilisation (CGU) — GéoEmplois
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Conditions régissant l'accès et l'utilisation de la plateforme GéoEmplois.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3.5 text-amber-900 text-xs sm:text-sm shadow-2xs">
          <AlertCircle size={20} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Avertissement légal</p>
            <p className="leading-relaxed">
              « Démonstrateur technique, ne constitue pas un service public en exploitation. »
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 shadow-xs">
          <CguArticle />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Des questions sur notre démarche ?
            </h3>
            <p className="text-xs text-slate-500">
              Consultez notre foire aux questions et nos engagements de transparence.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" href="/jobs">
              Voir la carte
            </Button>
            <Button variant="primary" size="sm" href="/faq">
              FAQ
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};
