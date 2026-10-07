import { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

export const GovBanner = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-[#f1f5f9] border-b border-slate-200 text-xs text-blue py-1.5 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium">
          <span className="inline-flex items-center gap-1.5 font-bold uppercase text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e1000f] inline-block"></span>
            République Française
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="hidden sm:inline text-slate-600">Un site officiel du gouvernement</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1 hover:underline cursor-pointer">
          <span>En savoir plus</span>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {isOpen && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-200 text-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 pb-1">
          <div className="flex items-start gap-2">
            <ShieldCheck size={16} className="text-blue shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">Domaine officiel .gouv.fr</p>
              <p className="text-xs text-slate-600">Les sites officiels de l'État utilisent des domaines certifiés.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck size={16} className="text-blue shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">Sécurité des accès</p>
              <p className="text-xs text-slate-600">Connexion sécurisée garantissant la protection des données.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
