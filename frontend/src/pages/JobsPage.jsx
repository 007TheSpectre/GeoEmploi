import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { JobsHeader } from '../components/jobs/JobsHeader';
import { JobsListPanel } from '../components/jobs/JobsListPanel';
import { JobsMap } from '../components/jobs/JobsMap';
import { ApplyJobModal } from '../components/jobs/ApplyJobModal';
import { GeolocationConsentNotice } from '../components/geo/GeolocationConsentNotice';
import { fetchDepartmentsGeoJson, fetchArrondissementsGeoJson, findDepartmentAtPoint } from '../api/geoApi';
import { fetchActiveOffers } from '../api/offersApi';
import { moderateOfferApi } from '../api/adminApi';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';

export const JobsPage = () => {
  const { user, token } = useAuth();
  const { isFavorite, favoritesCount, canUseFavorites } = useFavorites();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'ADMIN' || user.isAdmin));
  const [contractFilter, setContractFilter] = useState('ALL');
  const [departementFilter, setDepartementFilter] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(
    () => searchParams.get('favorites') === 'true'
  );
  const [jobOffers, setJobOffers] = useState([]);
  const [departmentsGeoJson, setDepartmentsGeoJson] = useState(null);
  const [subGeoJson, setSubGeoJson] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedArrondissement, setSelectedArrondissement] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedOfferForApply, setSelectedOfferForApply] = useState(null);
  const [targetBounds, setTargetBounds] = useState(null);
  const [loadingGeoJson, setLoadingGeoJson] = useState(true);
  const [loadingSubGeoJson, setLoadingSubGeoJson] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [showConsentNotice, setShowConsentNotice] = useState(false);
  const geolocationStartedRef = useRef(false);

  useEffect(() => {
    if (searchParams.get('favorites') === 'true') {
      setFavoritesOnly(true);
    }
  }, [searchParams]);

  const handleToggleFavoritesOnly = (val) => {
    setFavoritesOnly(val);
    if (!val && searchParams.get('favorites') === 'true') {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('favorites');
      setSearchParams(newParams);
    }
  };

  const visibleOffers = jobOffers.filter((offer) => {
    if (favoritesOnly && !isFavorite(offer.id)) {
      return false;
    }
    if (contractFilter !== 'ALL' && offer.contract_type !== contractFilter) {
      return false;
    }
    const currentDept = (departementFilter || selectedDept?.code || '').trim();
    if (currentDept && offer.departement_code !== currentDept) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    fetchActiveOffers()
      .then((data) => {
        setJobOffers(data);
      })
      .catch(() => {
        setJobOffers([]);
      });
  }, []);

  useEffect(() => {
    fetchDepartmentsGeoJson()
      .then((data) => {
        setDepartmentsGeoJson(data);
        setLoadingGeoJson(false);
      })
      .catch(() => {
        setLoadingGeoJson(false);
      });
  }, []);

  const applyDeptSelection = (feature) => {
    const { code, nom } = feature.properties || {};
    if (!code || !nom)
      return;

    const bounds = L.geoJSON(feature).getBounds();
    setTargetBounds(bounds);
    setSelectedDept({ code, nom, bounds });
    setSelectedArrondissement(null);
    setSelectedOffer(null);
    setDepartementFilter(code);

    setLoadingSubGeoJson(true);
    setSubGeoJson(null);

    fetchArrondissementsGeoJson(code, nom)
      .then((subData) => {
        setSubGeoJson(subData);
        setLoadingSubGeoJson(false);
      })
      .catch(() => {
        setLoadingSubGeoJson(false);
      });
  };

  const triggerGeolocation = (deptGeoJson) => {
    const targetGeo = deptGeoJson || departmentsGeoJson;
    if (!('geolocation' in navigator) || !targetGeo)
      return;

    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeolocating(false);
        const { latitude, longitude } = position.coords;
        const feature = findDepartmentAtPoint(targetGeo, [latitude, longitude]);
        if (feature && !selectedDept && !selectedOffer && !targetBounds) {
          applyDeptSelection(feature);
        }
      },
      () => setGeolocating(false),
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    if (!departmentsGeoJson || geolocationStartedRef.current)
      return;
    geolocationStartedRef.current = true;

    const storedConsent = localStorage.getItem('geoemploi_geolocation_consent');
    const userPref = user?.geolocation_enabled;

    if (storedConsent === 'granted' || userPref === true) {
      triggerGeolocation(departmentsGeoJson);
    } else if (storedConsent === 'denied' || userPref === false) {
      setShowConsentNotice(false);
    } else {
      setShowConsentNotice(true);
    }
  }, [departmentsGeoJson, user]);

  const handleAcceptGeolocation = () => {
    localStorage.setItem('geoemploi_geolocation_consent', 'granted');
    setShowConsentNotice(false);
    triggerGeolocation(departmentsGeoJson);
  };

  const handleDeclineGeolocation = () => {
    localStorage.setItem('geoemploi_geolocation_consent', 'denied');
    setShowConsentNotice(false);
  };

  const handleManualGeolocateClick = () => {
    const storedConsent = localStorage.getItem('geoemploi_geolocation_consent');
    const userPref = user?.geolocation_enabled;
    if (storedConsent === 'granted' || userPref === true) {
      triggerGeolocation(departmentsGeoJson);
    } else {
      setShowConsentNotice(true);
    }
  };

  const handleOfferSelect = (offer) => {
    if (!offer) {
      setSelectedOffer(null);
      return;
    }

    setSelectedOffer({ ...offer, _selectedAt: Date.now() });
  };

  useEffect(() => {
    const offerIdParam = searchParams.get('offerId') || searchParams.get('offer_id') || searchParams.get('id');
    if (!offerIdParam || jobOffers.length === 0) {
      return;
    }

    const targetOffer = jobOffers.find((o) => Number(o.id) === Number(offerIdParam));
    if (targetOffer && selectedOffer?.id !== targetOffer.id) {
      handleOfferSelect(targetOffer);
    }
  }, [searchParams, jobOffers, departmentsGeoJson]);

  const handleDeptClick = (feature) => {
    applyDeptSelection(feature);
  };

  const handleArrondissementClick = (feature, layer) => {
    const name = feature.properties?.nom || feature.properties?.name || 'Arrondissement';
    const bounds = layer.getBounds();
    setTargetBounds(bounds);
    setSelectedArrondissement({ name, feature, bounds });
    setSelectedOffer(null);
  };

  const handleResetMap = () => {
    setSelectedDept(null);
    setSubGeoJson(null);
    setSelectedArrondissement(null);
    setSelectedOffer(null);
    setTargetBounds(null);
    setDepartementFilter('');
  };

  const handleDeactivateOffer = async (offerId) => {
    if (!token)
      return;
    await moderateOfferApi(token, offerId, {
      action: 'close',
      reason: 'Désactivée depuis la carte par un administrateur',
    });
    setJobOffers((prev) => prev.filter((o) => o.id !== offerId));
    if (selectedOffer?.id === offerId) {
      setSelectedOffer(null);
    }
  };

  const isCandidateOrGuest = !user || user.role?.toLowerCase() === 'candidate';

  const handleOpenApplyModal = (offer) => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (!isCandidateOrGuest) {
      return;
    }
    setSelectedOfferForApply(offer);
  };

  return (
    <main className="flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-100">
      <JobsHeader
        jobOffersCount={visibleOffers.length}
        deptList={departmentsGeoJson ? departmentsGeoJson.features : []}
        selectedDept={selectedDept}
        selectedArrondissement={selectedArrondissement}
        contractFilter={contractFilter}
        setContractFilter={setContractFilter}
        departementFilter={departementFilter}
        setDepartementFilter={setDepartementFilter}
        handleResetMap={handleResetMap}
        favoritesOnly={favoritesOnly}
        setFavoritesOnly={handleToggleFavoritesOnly}
        favoritesCount={favoritesCount}
        canUseFavorites={canUseFavorites}
        onTriggerGeolocation={handleManualGeolocateClick}
        geolocating={geolocating}
      />

      {showConsentNotice && (
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="max-w-7xl mx-auto">
            <GeolocationConsentNotice
              onAccept={handleAcceptGeolocation}
              onDecline={handleDeclineGeolocation}
              onClose={() => setShowConsentNotice(false)}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row relative min-h-0 overflow-hidden">
        <JobsListPanel
          jobOffers={visibleOffers}
          selectedOffer={selectedOffer}
          onSelectOffer={handleOfferSelect}
          onApplyOffer={isCandidateOrGuest ? handleOpenApplyModal : null}
          selectedDept={selectedDept}
          onResetMap={handleResetMap}
          favoritesOnly={favoritesOnly}
          onResetFavorites={() => handleToggleFavoritesOnly(false)}
        />

        <JobsMap
          departmentsGeoJson={departmentsGeoJson}
          subGeoJson={subGeoJson}
          selectedDept={selectedDept}
          selectedArrondissement={selectedArrondissement}
          targetBounds={targetBounds}
          loadingGeoJson={loadingGeoJson}
          loadingSubGeoJson={loadingSubGeoJson}
          handleDeptClick={handleDeptClick}
          handleArrondissementClick={handleArrondissementClick}
          geolocating={geolocating}
          jobOffers={visibleOffers}
          selectedOffer={selectedOffer}
          onSelectOffer={handleOfferSelect}
          onApplyOffer={isCandidateOrGuest ? handleOpenApplyModal : null}
          isAdmin={isAdmin}
          onDeactivateOffer={handleDeactivateOffer}
          onResetMap={handleResetMap}
        />
      </div>

      <ApplyJobModal
        isOpen={Boolean(selectedOfferForApply)}
        onClose={() => setSelectedOfferForApply(null)}
        offer={selectedOfferForApply}
        token={token}
        user={user}
        onApplicationSuccess={() => {}}
      />
    </main>
  );
};
