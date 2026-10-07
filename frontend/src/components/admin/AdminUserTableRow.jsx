import { Ban, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';

export const AdminUserTableRow = ({
  user,
  onSelectForStatus,
  onModerateVerification,
}) => {
  const isCandidate = user.role === 'candidate';
  const isEmployer = user.role === 'employer';
  const isSuspended = user.status === 'suspended';

  return (
    <tr className="hover:bg-slate-50/80 transition-colors">
      <td className="py-3.5 px-4">
        <div className="font-semibold text-slate-900">{user.email}</div>
        <div className="text-[11px] text-slate-500">
          {isCandidate && (user.first_name || user.last_name)
            ? `${user.first_name || ''} ${user.last_name || ''}`
            : isEmployer && user.company_name
            ? `${user.company_name} (SIRET: ${user.siret || 'Non renseigné'})`
            : '—'}
        </div>
      </td>

      <td className="py-3.5 px-4">
        <span
          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
            isCandidate
              ? 'bg-blue-50 text-blue border border-blue-200'
              : isEmployer
              ? 'bg-purple-50 text-purple-700 border border-purple-200'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {isCandidate ? "Demandeur d'emploi" : isEmployer ? 'Employeur' : user.role}
        </span>
      </td>

      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
        {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'}
      </td>

      <td className="py-3.5 px-4">
        {isSuspended ? (
          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-semibold border border-rose-200 text-[11px]">
            <Ban size={11} /> Suspendu
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200 text-[11px]">
            <CheckCircle2 size={11} /> Actif
          </span>
        )}
      </td>

      <td className="py-3.5 px-4">
        {isEmployer ? (
          <div className="flex items-center gap-1.5">
            {user.verification_status === 'verified' && (
              <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                Vérifié
              </span>
            )}
            {user.verification_status === 'pending' && (
              <span className="text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                En attente
              </span>
            )}
            {user.verification_status === 'rejected' && (
              <span className="text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px]">
                Rejeté
              </span>
            )}
            {(!user.verification_status || user.verification_status === 'unverified') && (
              <span className="text-slate-500 text-[11px]">Non vérifié</span>
            )}

            {user.verification_status === 'pending' && user.employer_profile_id && (
              <div className="flex items-center gap-1 ml-1">
                <button
                  type="button"
                  onClick={() => onModerateVerification(user.employer_profile_id, 'verified')}
                  className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded cursor-pointer font-medium"
                  title="Valider le SIRET de l'employeur"
                >
                  Valider
                </button>
                <button
                  type="button"
                  onClick={() => onModerateVerification(user.employer_profile_id, 'rejected')}
                  className="text-[11px] bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded cursor-pointer font-medium"
                  title="Rejeter la vérification"
                >
                  Rejeter
                </button>
              </div>
            )}
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>

      <td className="py-3.5 px-4 text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectForStatus(user)}
          className={`text-xs py-1 px-2.5 h-auto font-medium ${
            isSuspended
              ? 'text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
              : 'text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          {isSuspended ? 'Réactiver' : 'Suspendre'}
        </Button>
      </td>
    </tr>
  );
};
