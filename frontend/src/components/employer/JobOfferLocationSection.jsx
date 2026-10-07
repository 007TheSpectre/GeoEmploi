import { MapPin, Navigation, Loader2, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

export const JobOfferLocationSection = ({
  formData,
  fieldErrors = {},
  onChange,
  onGeocode,
  geocodingLoading = false,
  showAdvancedGeo = false,
  setShowAdvancedGeo,
}) => {
  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <MapPin size={18} className="text-blue" /> Localisation de l'Offre
        </h3>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={geocodingLoading ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
          onClick={() => onGeocode(false)}
          disabled={geocodingLoading}
        >
          {geocodingLoading ? 'Géocodage...' : 'Vérifier la commune (BAN)'}
        </Button>
      </div>

      <p className="text-xs text-slate-500">
        Renseignez la commune ou l'arrondissement du poste. Conformément aux règles de confidentialité, aucune adresse précise de rue n'est collectée.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <Input
            label="Commune ou Arrondissement"
            name="city"
            value={formData.city}
            onChange={onChange}
            maxLength={100}
            onBlur={() => {
              if (formData.city && !formData.latitude) {
                onGeocode(true);
              }
            }}
            placeholder="ex: Paris 11e, Lille, Lyon 3e, Bordeaux..."
            icon={<MapPin size={16} />}
            error={fieldErrors.city}
          />
        </div>
        <Input
          label="Code Postal"
          name="postal_code"
          value={formData.postal_code}
          onChange={onChange}
          maxLength={10}
          onBlur={() => {
            if (formData.postal_code && !formData.latitude) {
              onGeocode(true);
            }
          }}
          placeholder="ex: 75011, 59000..."
          error={fieldErrors.postal_code}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Rayon de diffusion (km)"
          name="broadcast_radius_km"
          type="number"
          min="1"
          max="500"
          step="1"
          value={formData.broadcast_radius_km}
          onChange={onChange}
          placeholder="50"
          info="Entre 1 et 500 km"
          error={fieldErrors.broadcast_radius_km}
        />
      </div>

      {formData.latitude && formData.longitude && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            Localisation communale validée : Coordonnées calculées ({formData.latitude}, {formData.longitude})
          </span>
        </div>
      )}

      <div className="pt-2">
        <Button
          type="button"
          variant="tertiary-no-outline"
          size="sm"
          onClick={() => setShowAdvancedGeo(!showAdvancedGeo)}
          icon={<ChevronDown size={14} className={`transition-transform duration-200 ${showAdvancedGeo ? 'rotate-180' : ''}`} />}
          className="text-xs font-semibold text-blue p-0 hover:underline"
        >
          {showAdvancedGeo ? 'Masquer les coordonnées GPS manuelles' : 'Coordonnées GPS avancées (Optionnel)'}
        </Button>

        {showAdvancedGeo && (
          <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <Input
              label="Code Commune (INSEE)"
              name="commune_code"
              value={formData.commune_code}
              onChange={onChange}
              maxLength={6}
              error={fieldErrors.commune_code}
              placeholder="ex: 75056"
            />
            <Input
              label="Code Département"
              name="departement_code"
              value={formData.departement_code}
              onChange={onChange}
              maxLength={3}
              error={fieldErrors.departement_code}
              placeholder="ex: 75"
            />
            <Input
              label="Latitude (°)"
              name="latitude"
              type="number"
              step="any"
              min="-90"
              max="90"
              value={formData.latitude}
              onChange={onChange}
              error={fieldErrors.latitude}
              placeholder="ex: 48.8698"
            />
            <Input
              label="Longitude (°)"
              name="longitude"
              type="number"
              step="any"
              min="-180"
              max="180"
              value={formData.longitude}
              onChange={onChange}
              error={fieldErrors.longitude}
              placeholder="ex: 2.3314"
            />
          </div>
        )}
      </div>
    </div>
  );
};
