import { ShieldCheck, Download, Loader2 } from 'lucide-react';

export const AdminHeader = ({ userEmail, onExport, exporting = false }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-blue text-white flex items-center justify-center shrink-0 shadow-md">
          <ShieldCheck size={32} />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">
              Bienvenue sur le panel d'administration
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              ADMINISTRATEUR
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Espace de gestion globale de la plateforme GÉOEMPLOI ({userEmail || 'Non connecté'})
          </p>
        </div>
      </div>

      {onExport && (
        <button
          type="button"
          onClick={onExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors cursor-pointer flex-1 sm:flex-initial justify-center disabled:opacity-50 shrink-0"
          title="Télécharger l'intégralité de vos données personnelles au format JSON (Art. 20 RGPD)"
        >
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} className="text-slate-600" />}
          <span>{exporting ? 'Exportation...' : 'Exporter mes données'}</span>
        </button>
      )}
    </div>
  );
};
