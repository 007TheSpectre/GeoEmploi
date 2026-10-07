import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Briefcase, Heart, Send } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Alert } from '../common/Alert';
import { useFavorites } from '../../context/FavoritesContext';

export const JobsListPanel = ({
  jobOffers = [],
  selectedOffer,
  onSelectOffer,
  onApplyOffer,
  selectedDept,
  onResetMap,
  favoritesOnly = false,
  onResetFavorites,
}) => {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite, canUseFavorites } = useFavorites();
  const selectedCardRef = useRef(null);

  useEffect(() => {
    if (selectedOffer && selectedCardRef.current) {
      selectedCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedOffer]);

  return (
    <div className="w-full md:w-5/12 lg:w-4/12 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden shrink-0 z-10">
      <div className="p-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between shrink-0">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Briefcase size={15} className="text-blue" />
          {favoritesOnly ? `Mes Favoris (${jobOffers.length})` : `Offres d'emploi disponibles (${jobOffers.length})`}
        </span>
        <span className="text-xs text-slate-500 font-medium">Trié par récence</span>
      </div>

      {favoritesOnly && onResetFavorites && (
        <div className="px-3.5 py-2 bg-rose-50/80 border-b border-rose-100 flex items-center justify-between gap-2 shrink-0">
          <span className="text-xs font-semibold text-rose-700 flex items-center gap-1.5 truncate">
            <Heart size={13} className="shrink-0 fill-rose-500 text-rose-500" />
            Affichage des offres favorites uniquement
          </span>
          <button
            type="button"
            onClick={onResetFavorites}
            className="text-xs text-rose-700 hover:text-rose-900 font-bold underline cursor-pointer shrink-0"
          >
            Toutes les offres
          </button>
        </div>
      )}

      {selectedDept && (
        <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <span className="text-xs font-semibold text-blue flex items-center gap-1.5 truncate">
            <MapPin size={13} className="shrink-0" />
            Département : {selectedDept.nom} ({selectedDept.code})
          </span>
          {onResetMap && (
            <button
              type="button"
              onClick={onResetMap}
              className="text-xs text-blue hover:text-blue-hover font-bold underline cursor-pointer shrink-0"
            >
              Sortir du département
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {jobOffers.length === 0 ? (
          <div className="py-6 text-center space-y-3">
            <Alert
              type="info"
              title={favoritesOnly ? "Aucun favori enregistré" : "Aucune offre d'emploi disponible"}
              description={
                favoritesOnly
                  ? "Vous n'avez pas encore d'offres en favoris. Cliquez sur le cœur d'une offre pour l'enregistrer dans votre liste de favoris."
                  : "Aucune offre d'emploi active n'est répertoriée pour le moment. Cliquez sur un département ou un arrondissement de la carte pour filtrer."
              }
            />
          </div>
        ) : (
          jobOffers.map((offer) => {
            const isSelected = selectedOffer?.id === offer.id;
            const favorited = isFavorite(offer.id);
            return (
              <div
                key={offer.id}
                ref={isSelected ? selectedCardRef : null}
                onClick={() => onSelectOffer && onSelectOffer(offer)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'border-blue bg-blue-50/60 ring-2 ring-blue/30 shadow-md'
                    : 'border-slate-200 hover:border-blue bg-white hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-sm leading-snug flex-1">{offer.title}</h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!canUseFavorites) {
                          navigate('/login', { state: { returnTo: '/jobs', offerId: offer.id } });
                        } else {
                          toggleFavorite(offer);
                        }
                      }}
                      className={`p-1 rounded-full transition-colors cursor-pointer ${
                        !canUseFavorites
                          ? 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                          : favorited
                          ? 'text-rose-500 hover:bg-rose-50'
                          : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100'
                      }`}
                      title={
                        !canUseFavorites
                          ? 'Connectez-vous pour ajouter cette offre à vos favoris'
                          : favorited
                          ? 'Retirer des favoris'
                          : 'Ajouter aux favoris'
                      }
                      aria-label={
                        !canUseFavorites
                          ? 'Connectez-vous pour ajouter cette offre à vos favoris'
                          : favorited
                          ? 'Retirer des favoris'
                          : 'Ajouter aux favoris'
                      }
                    >
                      <Heart
                        size={16}
                        className={favorited ? 'fill-rose-500 text-rose-500' : 'text-current'}
                      />
                    </button>
                    <Badge variant="gov" size="sm">{offer.contract_type}</Badge>
                  </div>
                </div>
                <p className="text-xs text-slate-600 font-medium">{offer.company_name}</p>
                <div className="flex items-center justify-between pt-1 gap-2">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} /> {offer.postal_code || offer.commune_code || 'France'}
                    </span>
                    {offer.salary_min && (
                      <span>{offer.salary_min.toLocaleString()}€ - {offer.salary_max.toLocaleString()}€</span>
                    )}
                  </div>
                  {onApplyOffer && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplyOffer(offer);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-blue hover:bg-blue-hover rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Send size={11} />
                      Postuler
                    </button>
                  )}
                </div>
                {isSelected && (
                  <div className="flex items-center justify-between pt-1 text-[11px] font-semibold text-blue border-t border-blue-200/60">
                    <span>Sélectionnée sur la carte</span>
                    <span className="underline hover:text-blue-hover">Recentrer</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
