import { useState, useEffect, useCallback } from 'react';
import { Plus, Briefcase, Eye, Users, Search, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Alert } from '../common/Alert';
import { EmployerOfferCard } from './EmployerOfferCard';
import { JobOfferModal } from './JobOfferModal';
import { EmployerApplicationsModal } from './EmployerApplicationsModal';
import { KpiCard } from './KpiCard';
import { fetchEmployerDashboard, fetchEmployerOffers, deleteEmployerOffer } from '../../api/offersApi';

export const EmployerDashboard = ({ token }) => {
  const [offers, setOffers] = useState([]);
  const [stats, setStats] = useState({
    total_views: 0,
    total_applications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successAlert, setSuccessAlert] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOfferForApplications, setSelectedOfferForApplications] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadDashboardData = useCallback(async () => {
    if (!token)
      return;
    setLoading(true);
    setError(null);

    try {
      const dashData = await fetchEmployerDashboard(token).catch(() => null);
      if (dashData) {
        setStats({
          total_views: dashData.total_views || 0,
          total_applications: dashData.total_applications || 0,
        });
      }

      const ownOffers = await fetchEmployerOffers(token);
      setOffers(ownOffers || []);
    } catch (err) {
      setError(err.message || 'Impossible de charger vos offres d\'emploi.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleOfferCreated = (newOffer) => {
    setSuccessAlert(`L'offre "${newOffer.title}" a été ajoutée avec succès !`);
    loadDashboardData();
  };

  const handleDeleteOffer = async (offerId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
      return;
    }

    try {
      await deleteEmployerOffer(offerId, token);
      setSuccessAlert('L\'offre d\'emploi a été supprimée.');
      loadDashboardData();
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression');
    }
  };

  const filteredOffers = offers.filter((offer) => {
    const matchesSearch = offer.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && offer.status === statusFilter;
  });

  const activeOffersCount = offers.filter((o) => o.status === 'active').length;
  const pendingOffersCount = offers.filter((o) => o.status === 'pending_moderation').length;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue" />
            Espace Recruteur & Gestion des Offres
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gérez vos annonces de recrutement, publiez de nouvelles offres et suivez les retours.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          icon={<Plus size={20} />}
          onClick={() => setIsModalOpen(true)}
          className="shadow-md shrink-0"
        >
          Ajouter une offre d'emploi
        </Button>
      </div>

      {successAlert && (
        <Alert
          type="success"
          title="Succès"
          description={successAlert}
          dismissible
          onClose={() => setSuccessAlert(null)}
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          label="Total Offres"
          value={offers.length}
          valueColor="text-blue"
        />
        <KpiCard
          label="Offres Actives"
          value={activeOffersCount}
          valueColor="text-emerald-600"
        />
        <KpiCard
          label="Total Vues"
          value={stats.total_views}
          icon={<Eye size={20} />}
          valueColor="text-blue-600"
        />
        <KpiCard
          label="Candidatures"
          value={stats.total_applications}
          icon={<Users size={20} />}
          valueColor="text-indigo-600"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Rechercher par titre ou mot-clé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search size={16} />}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-100 focus:bg-white text-slate-800 text-sm font-medium px-3.5 py-2.5 rounded-xs border-b-2 border-slate-300 focus:border-blue focus:outline-hidden cursor-pointer w-full sm:w-auto"
          >
            <option value="ALL">Tous les statuts ({offers.length})</option>
            <option value="active">Actives ({activeOffersCount})</option>
            <option value="pending_moderation">En attente ({pendingOffersCount})</option>
            <option value="closed">Fermées</option>
          </select>

          <Button
            variant="ghost"
            size="md"
            icon={<RefreshCw size={16} />}
            onClick={loadDashboardData}
            title="Rafraîchir les données"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue" />
          <p className="text-sm font-medium">Chargement de vos offres d'emploi...</p>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-blue flex items-center justify-center mx-auto">
            <Briefcase size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">Aucune offre d'emploi trouvée</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {offers.length === 0
                ? "Vous n'avez pas encore publié d'offre d'emploi. Cliquez sur le bouton ci-dessous pour ajouter votre première offre."
                : "Aucune offre ne correspond à vos critères de recherche."}
            </p>
          </div>
          {offers.length === 0 && (
            <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
              Ajouter une offre d'emploi
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredOffers.map((offer) => (
            <EmployerOfferCard
              key={offer.id}
              offer={offer}
              onDelete={handleDeleteOffer}
              onViewApplications={(selected) => setSelectedOfferForApplications(selected)}
            />
          ))}
        </div>
      )}

      <JobOfferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleOfferCreated}
        token={token}
      />

      <EmployerApplicationsModal
        isOpen={Boolean(selectedOfferForApplications)}
        onClose={() => setSelectedOfferForApplications(null)}
        offer={selectedOfferForApplications}
        token={token}
        onApplicationStatusUpdated={() => {
          loadDashboardData();
        }}
      />
    </div>
  );
};
