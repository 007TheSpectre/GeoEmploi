import { Link, useNavigate } from 'react-router-dom';
import { Heart, ExternalLink, MapPin, Trash2 } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

export const AccountFavoritesSection = ({
  favoriteOffers = [],
  favoritesCount = 0,
  onToggleFavorite,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <Heart size={20} className="text-rose-500 fill-rose-500" />
          <h2 className="text-lg font-bold text-slate-800">
            Mes Offres Favorites ({favoritesCount})
          </h2>
        </div>
        <Link
          to="/jobs?favorites=true"
          className="text-xs font-semibold text-blue hover:text-blue-hover flex items-center gap-1"
        >
          <span>Voir sur la carte</span>
          <ExternalLink size={14} />
        </Link>
      </div>

      {favoriteOffers.length === 0 ? (
        <div className="text-center py-6 space-y-3">
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Vous n'avez pas encore d'offres enregistrées dans vos favoris.
          </p>
          <Button variant="secondary" size="sm" onClick={() => navigate('/jobs')}>
            Parcourir les offres d'emploi
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {favoriteOffers.map((offer) => (
            <div
              key={offer.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    onClick={() => navigate(`/jobs?offerId=${offer.id}`)}
                    className="font-bold text-slate-900 hover:text-blue cursor-pointer text-sm transition-colors"
                  >
                    {offer.title}
                  </h3>
                  <Badge variant="gov" size="sm">{offer.contract_type}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {offer.company_name && <span>{offer.company_name}</span>}
                  {(offer.postal_code || offer.city) && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {[offer.postal_code, offer.city].filter(Boolean).join(' ')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/jobs?offerId=${offer.id}`)}
                  className="text-xs text-blue hover:bg-blue-50"
                >
                  Voir
                </Button>
                {onToggleFavorite && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={14} />}
                    onClick={() => onToggleFavorite(offer)}
                    className="text-xs text-red-600 hover:bg-red-50"
                    title="Retirer des favoris"
                  >
                    Retirer
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
