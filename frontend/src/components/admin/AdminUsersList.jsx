import { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, Filter, Shield, CheckCircle2,
  AlertCircle, Loader2, RefreshCw
} from 'lucide-react';
import { Button } from '../common/Button';
import { fetchAdminUsers, updateUserStatusApi, moderateEmployerVerificationApi } from '../../api/adminApi';
import { useDebounce } from '../../hooks';
import { AdminUserTableRow } from './AdminUserTableRow';
import { AdminUserStatusModal } from './AdminUserStatusModal';

export const AdminUsersList = ({ token, onUserUpdated }) => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const [selectedUserForStatus, setSelectedUserForStatus] = useState(null);
  const [statusReason, setStatusReason] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const loadUsers = useCallback(
    async (page = 1) => {
      if (!token) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetchAdminUsers(token, {
          role: roleFilter,
          status: statusFilter,
          search: debouncedSearch.trim() || undefined,
          page,
          limit: 20,
        });

        setUsers(res.data || []);
        setPagination(res.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
      } catch (err) {
        setError(err.message || 'Impossible de récupérer la liste des utilisateurs.');
      } finally {
        setLoading(false);
      }
    },
    [token, roleFilter, statusFilter, debouncedSearch]
  );

  useEffect(() => {
    let ignore = false;
    if (!token) return;

    fetchAdminUsers(token, {
      role: roleFilter,
      status: statusFilter,
      search: debouncedSearch.trim() || undefined,
      page: 1,
      limit: 20,
    })
      .then((res) => {
        if (!ignore) {
          setUsers(res.data || []);
          setPagination(res.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Impossible de récupérer la liste des utilisateurs.');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [token, roleFilter, statusFilter, debouncedSearch]);

  const handleOpenStatusModal = (user) => {
    setSelectedUserForStatus(user);
    setStatusReason(user.suspension_reason || '');
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedUserForStatus) return;
    setSubmittingStatus(true);

    const nextStatus = selectedUserForStatus.status === 'suspended' ? 'active' : 'suspended';
    try {
      await updateUserStatusApi(token, selectedUserForStatus.id, {
        status: nextStatus,
        reason: statusReason.trim() || undefined,
      });

      setActionSuccess(
        `Le compte ${selectedUserForStatus.email} est désormais ${nextStatus === 'active' ? 'actif' : 'suspendu'}.`
      );
      setSelectedUserForStatus(null);
      setStatusReason('');
      loadUsers(pagination.page);

      if (onUserUpdated) {
        onUserUpdated();
      }
    } catch (err) {
      alert(err.message || 'Erreur lors de la mise à jour du statut.');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleModerateVerification = async (employerProfileId, status) => {
    if (!employerProfileId) return;
    const confirmMsg = status === 'verified'
      ? 'Confirmer la validation du SIRET de cet employeur ?'
      : 'Refuser la vérification du SIRET de cet employeur ?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await moderateEmployerVerificationApi(token, employerProfileId, { status });
      setActionSuccess(`Vérification employeur mise à jour (${status === 'verified' ? 'validée' : 'refusée'}).`);
      loadUsers(pagination.page);
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      alert(err.message || "Erreur lors de la modération de l'employeur.");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden space-y-4 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users size={20} className="text-purple-600" />
            Gestion des Utilisateurs & Comptes ({pagination.total})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Administration des comptes candidats et employeurs, activation, suspension et modération des SIRET.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw size={14} />}
          onClick={() => loadUsers(pagination.page)}
        >
          Actualiser
        </Button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par email, nom ou raison sociale..."
            className="w-full pl-10 pr-3.5 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <Filter size={13} className="text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent outline-hidden font-medium cursor-pointer"
            >
              <option value="ALL">Tous les rôles</option>
              <option value="candidate">Demandeurs d'emploi</option>
              <option value="employer">Employeurs</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <Shield size={13} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent outline-hidden font-medium cursor-pointer"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="active">Comptes Actifs</option>
              <option value="suspended">Comptes Suspendus</option>
            </select>
          </div>
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Utilisateur / Organisme</th>
                <th className="py-3 px-4">Rôle</th>
                <th className="py-3 px-4">Inscription</th>
                <th className="py-3 px-4">Statut Compte</th>
                <th className="py-3 px-4">Vérification SIRET</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                    Chargement des comptes utilisateurs...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Aucun compte utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <AdminUserTableRow
                    key={u.id}
                    user={u}
                    onSelectForStatus={handleOpenStatusModal}
                    onModerateVerification={handleModerateVerification}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {pagination.page} sur {pagination.pages} ({pagination.total} comptes au total)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => loadUsers(pagination.page - 1)}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => loadUsers(pagination.page + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      <AdminUserStatusModal
        selectedUser={selectedUserForStatus}
        onClose={() => setSelectedUserForStatus(null)}
        statusReason={statusReason}
        setStatusReason={setStatusReason}
        submitting={submittingStatus}
        onConfirm={handleConfirmStatusChange}
      />
    </div>
  );
};
