import { User, Mail, LogOut, Download, Loader2, Trash2 } from 'lucide-react';

export const AccountHeader = ({ user, onLogout, onExport, onDeleteAccount, exporting = false }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue text-white flex items-center justify-center font-bold text-2xl shrink-0 shadow-md">
          {user?.email ? user.email.charAt(0).toUpperCase() : <User size={32} />}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">Mon Compte</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue border border-blue-200">
              {user?.role === 'employer' ? 'Recruteur / Employeur' : user?.role === 'admin' ? 'Administrateur' : 'Candidat'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <Mail size={14} className="text-slate-400" />
            {user?.email || 'Non connecté'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors cursor-pointer flex-1 sm:flex-initial justify-center disabled:opacity-50"
            title="Télécharger l'intégralité de vos données personnelles au format JSON (Art. 20 RGPD)"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} className="text-slate-600" />}
            <span>{exporting ? 'Exportation...' : 'Exporter mes données'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors cursor-pointer flex-1 sm:flex-initial justify-center"
        >
          <LogOut size={16} />
          Déconnexion
        </button>

        {onDeleteAccount && (
          <button
            type="button"
            onClick={onDeleteAccount}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors cursor-pointer flex-1 sm:flex-initial justify-center"
            title="Supprimer définitivement mon compte (RGPD Art. 17)"
          >
            <Trash2 size={16} />
            <span>Supprimer le compte</span>
          </button>
        )}
      </div>
    </div>
  );
};
