import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MapPin, Loader2 } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

export const JobsHeader = ({
  jobOffersCount = 0,
  selectedDept,
  selectedArrondissement,
  contractFilter,
  setContractFilter,
  departementFilter,
  setDepartementFilter,
  handleResetMap,
  favoritesOnly = false,
  setFavoritesOnly,
  favoritesCount = 0,
  canUseFavorites = false,
  onTriggerGeolocation,
  geolocating = false,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shadow-xs shrink-0 z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Carte des emplois
          </h1>
          <Badge variant="neutral" size="sm">
            {jobOffersCount} offre{jobOffersCount > 1 ? 's' : ''}
          </Badge>

          {setFavoritesOnly && (
            !canUseFavorites ? (
              <Button
                variant="tertiary"
                size="sm"
                icon={<Heart size={14} className="text-slate-300" />}
                onClick={() => navigate('/login')}
                className="!text-slate-400 hover:!text-slate-600 !border-slate-200"
                title="Connectez-vous pour accéder à vos favoris"
              >
                Favoris
              </Button>
            ) : (
              <Button
                variant={favoritesOnly ? 'primary' : 'tertiary'}
                size="sm"
                icon={
                  <Heart
                    size={14}
                    className={
                      favoritesOnly
                        ? 'fill-white text-white'
                        : favoritesCount > 0
                        ? 'fill-rose-500 text-rose-500'
                        : ''
                    }
                  />
                }
                onClick={() => setFavoritesOnly(!favoritesOnly)}
                className={
                  favoritesOnly
                    ? '!bg-rose-600 hover:!bg-rose-700 !border-rose-600 !text-white'
                    : ''
                }
              >
                Favoris {favoritesCount > 0 ? `(${favoritesCount})` : ''}
              </Button>
            )
          )}

          {(selectedDept || selectedArrondissement) && (
            <Button
              variant="tertiary"
              size="sm"
              icon={<ArrowLeft size={14} />}
              onClick={handleResetMap}
            >
              Sortir du département{selectedDept?.nom ? ` (${selectedDept.nom})` : ''}
            </Button>
          )}

          {onTriggerGeolocation && (
            <Button
              variant="tertiary"
              size="sm"
              icon={geolocating ? <Loader2 size={14} className="animate-spin text-blue" /> : <MapPin size={14} className="text-blue" />}
              onClick={onTriggerGeolocation}
              disabled={geolocating}
              title="Me localiser dans mon département"
            >
              {geolocating ? 'Localisation...' : 'Me localiser'}
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 max-w-3xl justify-end">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={contractFilter}
              onChange={(e) => setContractFilter(e.target.value)}
              className="bg-slate-100 focus:bg-white text-slate-900 text-xs px-3 py-2 rounded-xs border-b-2 border-slate-300 focus:border-blue focus:outline-hidden transition-all h-10 font-medium cursor-pointer"
            >
              <option value="ALL">Tous contrats</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="interim">Intérim</option>
              <option value="alternance">Alternance</option>
              <option value="stage">Stage</option>
              <option value="freelance">Freelance</option>
            </select>

            <div className="w-24">
              <Input
                placeholder="59"
                maxLength={3}
                value={departementFilter}
                onChange={(e) => {
                  setDepartementFilter(e.target.value);
                  if (!e.target.value)
                    handleResetMap();
                }}
                inputClassName="!h-10 text-xs !py-1 text-center font-bold"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
