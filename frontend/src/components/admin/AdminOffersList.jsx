import { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  Eye,
  Check,
  X,
  Search,
  RefreshCw,
  Loader2,
  Building2,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Alert } from '../common/Alert';
import { fetchAdminOffers, moderateOfferApi } from '../../api/adminApi';
import { AdminOfferStatusBadge } from './AdminOfferStatusBadge';
import { AdminOfferDetailModal } from './AdminOfferDetailModal';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Toutes les offres' },
  { value: 'pending_moderation', label: 'En attente' },
  { value: 'active', label: 'Actives' },
  { value: 'rejected', label: 'Rejetées' },
  { value: 'closed', label: 'Fermées' },
];

export const AdminOffersList = ({ token, onOfferModerated }) => {
  const [offers, setOffers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [selectedOffer, setSelectedOffer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [moderatingId, setModeratingId] = useState(null);

  const loadOffers = useCallback(async (page = 1, status = statusFilter) => {
    if (!token)
      return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetchAdminOffers(token, {
        status,
        page,
        limit: 10,
      });
      setOffers(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Impossible de récupérer la liste des offres');
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    loadOffers(1, statusFilter);
  }, [loadOffers, statusFilter]);

  const handleModerate = async (offerId, { action, reason }) => {
    setModeratingId(offerId);
    try {
      const updated = await moderateOfferApi(token, offerId, { action, reason });
      const actionLabels = {
        approve: 'validée et publiée',
        reject: 'rejetée',
        close: 'fermée',
      };
      setFeedback({
        type: 'success',
        message: `L'offre #${offerId} a été ${actionLabels[action] || 'mise à jour'} avec succès.`,
      });

      setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, ...updated } : o)));

      if (onOfferModerated) {
        onOfferModerated();
      }

      return updated;
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Échec de l\'opération de modération',
      });
      throw err;
    } finally {
      setModeratingId(null);
    }
  };

  const handleOpenDetail = (offer) => {
    setSelectedOffer(offer);
    setIsModalOpen(true);
  };

  const handleQuickApprove = async (e, offer) => {
    e.stopPropagation();
    try {
      await handleModerate(offer.id, { action: 'approve' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickReject = (e, offer) => {
    e.stopPropagation();
    setSelectedOffer(offer);
    setIsModalOpen(true);
  };

  const filteredOffers = offers.filter((offer) => {
    if (!searchTerm.trim())
      return true;
    const term = searchTerm.toLowerCase();
    return (
      (offer.title && offer.title.toLowerCase().includes(term)) ||
      (offer.company_name && offer.company_name.toLowerCase().includes(term)) ||
      (offer.city && offer.city.toLowerCase().includes(term)) ||
      (offer.postal_code && offer.postal_code.includes(term))
    );
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden space-y-4">
      <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue" />
              Modération des Offres d'Emploi
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Consultez les annonces, examinez les coordonnées et validez ou refusez leur publication.
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}
            onClick={() => loadOffers(pagination.page, statusFilter)}
            disabled={loading}
            title="Rafraîchir la liste"
          >
            Actualiser
          </Button>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {STATUS_OPTIONS.map((opt) => {
              const isSelected = statusFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-blue text-white border-blue shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="w-full md:w-72">
            <Input
              name="search"
              placeholder="Filtrer par titre, entreprise, ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={15} />}
            />
          </div>
        </div>
      </div>

      <div className="px-5">
        {feedback && (
          <Alert
            type={feedback.type}
            title={feedback.type === 'success' ? 'Opération réussie' : 'Erreur'}
            description={feedback.message}
            dismissible
            onClose={() => setFeedback(null)}
          />
        )}
        {error && (
          <Alert
            type="error"
            title="Erreur"
            description={error}
            dismissible
            onClose={() => setError(null)}
          />
        )}
      </div>

      <div className="px-5 pb-5">
        {loading && offers.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue" />
            <p className="text-sm font-medium">Chargement des offres d'emploi...</p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
            <Briefcase size={28} className="mx-auto text-slate-400" />
            <h3 className="text-sm font-bold text-slate-700">Aucune offre d'emploi trouvée</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Aucune annonce ne correspond aux filtres sélectionnés. Modifiez le statut ou le terme de recherche.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Offre & Entreprise</th>
                  <th className="py-3 px-4">Contrat</th>
                  <th className="py-3 px-4">Localisation</th>
                  <th className="py-3 px-4">Date de soumission</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOffers.map((offer) => {
                  const isModerating = moderatingId === offer.id;
                  return (
                    <tr
                      key={offer.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetail(offer)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-blue transition-colors leading-snug">
                          {offer.title}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Building2 size={13} className="text-slate-400" />
                          <span>{offer.company_name || 'Entreprise non renseignée'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-xs text-xs font-semibold bg-blue/10 text-blue border border-blue/20 uppercase">
                          {offer.contract_type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin size={13} className="text-slate-400 shrink-0" />
                          <span>{[offer.postal_code, offer.city].filter(Boolean).join(' ') || 'N/C'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar size={13} className="text-slate-400 shrink-0" />
                          <span>
                            {offer.created_at
                              ? new Date(offer.created_at).toLocaleDateString('fr-FR')
                              : 'N/C'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <AdminOfferStatusBadge status={offer.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Eye size={14} />}
                            onClick={() => handleOpenDetail(offer)}
                            title="Voir l'offre en détail"
                          >
                            Voir l'offre
                          </Button>

                          {offer.status !== 'active' && (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={isModerating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              onClick={(e) => handleQuickApprove(e, offer)}
                              disabled={isModerating}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white p-2"
                              title="Valider et publier directement"
                            />
                          )}

                          {offer.status !== 'rejected' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<X size={14} />}
                              onClick={(e) => handleQuickReject(e, offer)}
                              disabled={isModerating}
                              className="text-red-700 hover:bg-red-50 p-2 border border-red-200"
                              title="Refuser avec motif"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between pt-4 text-xs text-slate-500">
            <span>
              Affichage de {filteredOffers.length} sur {pagination.total} offres
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronLeft size={14} />}
                onClick={() => loadOffers(pagination.page - 1, statusFilter)}
                disabled={pagination.page <= 1 || loading}
              >
                Précédent
              </Button>

              <span className="font-semibold text-slate-700 px-2">
                Page {pagination.page} / {pagination.pages}
              </span>

              <Button
                variant="outline"
                size="sm"
                icon={<ChevronRight size={14} />}
                iconPosition="right"
                onClick={() => loadOffers(pagination.page + 1, statusFilter)}
                disabled={pagination.page >= pagination.pages || loading}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      <AdminOfferDetailModal
        isOpen={isModalOpen}
        offer={selectedOffer}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOffer(null);
        }}
        onModerate={handleModerate}
        loading={moderatingId === selectedOffer?.id}
      />
    </div>
  );
};
