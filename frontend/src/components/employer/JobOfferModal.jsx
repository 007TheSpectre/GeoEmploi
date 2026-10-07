import { useState } from 'react';
import { X, Briefcase, DollarSign, Calendar, Tag, Loader2 } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Alert } from '../common/Alert';
import { createEmployerOffer } from '../../api/offersApi';
import { geocodeAddress } from '../../api/geoApi';
import { JobOfferLocationSection } from './JobOfferLocationSection';
import { useFocusTrap } from '../../hooks';
import {
  CONTRACT_OPTIONS,
  INITIAL_FORM_STATE,
  validateOfferField,
  validateOfferForm,
  buildOfferPayload,
} from './offerValidation';

export const JobOfferModal = ({ isOpen, onClose, onSuccess, token }) => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [geocodingInfo, setGeocodingInfo] = useState(null);
  const [showAdvancedGeo, setShowAdvancedGeo] = useState(false);

  const handleClose = () => {
    setFormData(INITIAL_FORM_STATE);
    setFieldErrors({});
    setError(null);
    setGeocodingInfo(null);
    onClose();
  };

  const modalRef = useFocusTrap(isOpen, { onClose: handleClose });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const err = validateOfferField(name, value, { ...formData, [name]: value });

    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) next[name] = err;
      else delete next[name];

      if ((name === 'salary_min' || name === 'salary_max') && !err) {
        delete next.salary_min;
        delete next.salary_max;
      }
      return next;
    });

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const geocodeCurrentAddress = async (silent = false) => {
    const addressQuery = [formData.city, formData.postal_code].filter(Boolean).join(' ');
    if (!addressQuery.trim()) {
      if (!silent) {
        setError('Veuillez saisir une commune ou un code postal pour géocoder.');
        setFieldErrors((prev) => ({ ...prev, city: 'Veuillez saisir une commune ou un arrondissement.' }));
      }
      return null;
    }

    setGeocodingLoading(true);
    if (!silent)
      setError(null);

    try {
      const results = await geocodeAddress({
        q: addressQuery,
        limit: 1,
        postcode: formData.postal_code || undefined,
        citycode: formData.commune_code || undefined,
      });

      if (results && results.length > 0) {
        const best = results[0];
        const updatedGeo = {
          latitude: Number(best.latitude).toFixed(6),
          longitude: Number(best.longitude).toFixed(6),
          commune_code: best.citycode || formData.commune_code,
          departement_code: best.context
            ? best.context.split(',')[0].trim()
            : (best.postcode ? best.postcode.substring(0, 2) : formData.departement_code),
          postal_code: best.postcode || formData.postal_code,
          city: best.city || formData.city,
        };

        setFormData((prev) => ({ ...prev, ...updatedGeo }));
        setGeocodingInfo(`Commune géolocalisée avec succès : ${best.label || best.city}`);
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next.city;
          delete next.postal_code;
          delete next.latitude;
          delete next.longitude;
          return next;
        });
        return updatedGeo;
      } else if (!silent) {
        setError('Commune non trouvée sur la Base Adresse Nationale (BAN).');
        setFieldErrors((prev) => ({ ...prev, city: "Commune introuvable sur la BAN. Vérifiez l'orthographe." }));
      }
    } catch (err) {
      console.error('Erreur lors du géocodage:', err);
      if (!silent) setError(err.message || 'Erreur de connexion au service de géocodage BAN.');
    } finally {
      setGeocodingLoading(false);
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const clientErrors = validateOfferForm(formData);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setError('Veuillez corriger les champs invalides indiqués ci-dessous.');
      return;
    }

    setLoading(true);

    let currentLat = formData.latitude;
    let currentLng = formData.longitude;
    let currentCommune = formData.commune_code;
    let currentDept = formData.departement_code;

    if ((!currentLat || !currentLng) && (formData.city || formData.postal_code)) {
      const geoResult = await geocodeCurrentAddress(true);
      if (geoResult) {
        currentLat = geoResult.latitude;
        currentLng = geoResult.longitude;
        currentCommune = geoResult.commune_code;
        currentDept = geoResult.departement_code;
      } else {
        setLoading(false);
        setFieldErrors((prev) => ({
          ...prev,
          city: 'Impossible de localiser cette commune sur la Base Adresse Nationale. Vérifiez la saisie ou renseignez les coordonnées GPS.',
        }));
        setError('Impossible de localiser la commune. Veuillez vérifier ou renseigner les coordonnées GPS manuellement.');
        return;
      }
    }

    if (!currentLat || !currentLng) {
      setLoading(false);
      setFieldErrors((prev) => ({
        ...prev,
        city: 'Les coordonnées de localisation sont requises pour publier une offre.',
      }));
      setError('Localisation requise : veuillez renseigner une commune ou un code postal valide.');
      return;
    }

    const payload = buildOfferPayload(formData, {
      lat: currentLat,
      lng: currentLng,
      commune: currentCommune,
      dept: currentDept,
    });

    try {
      const createdOffer = await createEmployerOffer(payload, token);
      setLoading(false);
      setFormData(INITIAL_FORM_STATE);
      setFieldErrors({});
      setError(null);
      onSuccess(createdOffer);
      onClose();
    } catch (err) {
      setLoading(false);
      if (err.details && typeof err.details === 'object') {
        setFieldErrors((prev) => ({ ...prev, ...err.details }));
      }
      setError(err.message || 'Échec de la création de l\'offre');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-offer-modal-title"
        className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Briefcase className="w-5 h-5 text-blue-400" />
            <h2 id="job-offer-modal-title" className="text-xl font-bold tracking-wide">Publier une nouvelle offre d'emploi</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<X size={20} />}
            iconPosition="only"
            onClick={handleClose}
            ariaLabel="Fermer"
            className="text-slate-300 hover:text-white hover:bg-white/10 border-transparent!"
          >
            Fermer
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && <Alert type="error" title="Erreur" description={error} dismissible onClose={() => setError(null)} />}
          {geocodingInfo && <Alert type="success" title="Géolocalisation" description={geocodingInfo} dismissible onClose={() => setGeocodingInfo(null)} />}

          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
              <Briefcase size={18} className="text-blue" /> Informations Générales
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Titre du poste"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="ex: Développeur Web Fullstack, Chef de projet..."
                  maxLength={255}
                  error={fieldErrors.title}
                  required
                />
              </div>

              <Select
                label="Type de contrat"
                name="contract_type"
                value={formData.contract_type}
                onChange={handleChange}
                options={CONTRACT_OPTIONS}
                error={fieldErrors.contract_type}
                required
              />
            </div>

            <Input
              label="Description détaillée du poste"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={4}
              maxLength={10000}
              placeholder="Décrivez les missions, le profil recherché, les avantages..."
              error={fieldErrors.description}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Salaire min (€/an)"
                name="salary_min"
                type="number"
                min="0"
                max="10000000"
                step="500"
                value={formData.salary_min}
                onChange={handleChange}
                placeholder="ex: 35000"
                icon={<DollarSign size={16} />}
                error={fieldErrors.salary_min}
              />
              <Input
                label="Salaire max (€/an)"
                name="salary_max"
                type="number"
                min="0"
                max="10000000"
                step="500"
                value={formData.salary_max}
                onChange={handleChange}
                placeholder="ex: 45000"
                icon={<DollarSign size={16} />}
                error={fieldErrors.salary_max}
              />
              <Input
                label="Expérience (années)"
                name="experience_years"
                type="number"
                min="0"
                max="60"
                step="1"
                value={formData.experience_years}
                onChange={handleChange}
                placeholder="ex: 2"
                info="Entre 0 et 60 ans"
                error={fieldErrors.experience_years}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <Input
                label="Mots-clés / Tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="ex: react, node, fullstack"
                icon={<Tag size={16} />}
                info="Séparés par des virgules (ex: react, node)"
                error={fieldErrors.tags}
              />
              <Input
                label="Date d'expiration de l'offre"
                name="expires_at"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={formData.expires_at}
                onChange={handleChange}
                icon={<Calendar size={16} />}
                error={fieldErrors.expires_at}
              />
            </div>
          </div>

          <JobOfferLocationSection
            formData={formData}
            fieldErrors={fieldErrors}
            onChange={handleChange}
            onGeocode={geocodeCurrentAddress}
            geocodingLoading={geocodingLoading}
            showAdvancedGeo={showAdvancedGeo}
            setShowAdvancedGeo={setShowAdvancedGeo}
          />

          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0">
            <Button type="button" variant="tertiary" onClick={handleClose} disabled={loading}>
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              icon={loading ? <Loader2 size={16} className="animate-spin" /> : <Briefcase size={16} />}
            >
              {loading ? 'Publication en cours...' : 'Publier l\'offre d\'emploi'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
