import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, Building2, MapPin, DollarSign, Briefcase, Calendar, Ban, ArrowLeft, X, Heart, Send } from 'lucide-react';
import { TILE_LAYER_URL } from '../../api/geoApi';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useFavorites } from '../../context/FavoritesContext';

const createCustomIcon = () => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue text-white shadow-lg border-2 border-white font-bold text-xs hover:scale-110 transition-transform">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const formatSalary = (min, max) => {
  if (min && max) {
    return `${min.toLocaleString('fr-FR')} € - ${max.toLocaleString('fr-FR')} €`;
  }
  if (min) {
    return `À partir de ${min.toLocaleString('fr-FR')} €`;
  }
  if (max) {
    return `Jusqu'à ${max.toLocaleString('fr-FR')} €`;
  }
  return null;
};

const formatExperience = (years) => {
  if (years === null || years === undefined) {
    return 'Tous niveaux';
  }
  if (years === 0) {
    return 'Débutant accepté';
  }
  return `${years} an${years > 1 ? 's' : ''} d'exp.`;
};

const formatLocation = (offer) => {
  const parts = [];
  if (offer.city) {
    parts.push(offer.city);
  }
  if (offer.postal_code) {
    parts.push(`(${offer.postal_code})`);
  } else if (offer.departement_code) {
    parts.push(`(${offer.departement_code})`);
  }
  return parts.length > 0 ? parts.join(' ') : 'France';
};

const getAdjustedPosition = (offer, allOffers) => {
  const sameCoordOffers = allOffers.filter(
    (o) =>
      Math.abs(Number(o.latitude) - Number(offer.latitude)) < 0.00001 &&
      Math.abs(Number(o.longitude) - Number(offer.longitude)) < 0.00001
  );
  if (sameCoordOffers.length <= 1) {
    return [offer.latitude, offer.longitude];
  }
  const index = sameCoordOffers.findIndex((o) => o.id === offer.id);
  if (index === 0) {
    return [offer.latitude, offer.longitude];
  }
  const angle = (2 * Math.PI * index) / sameCoordOffers.length;
  const offsetDistance = 0.00015;
  const latOffset = offsetDistance * Math.cos(angle);
  const lngOffset = (offsetDistance / Math.cos((offer.latitude * Math.PI) / 180)) * Math.sin(angle);
  return [Number(offer.latitude) + latOffset, Number(offer.longitude) + lngOffset];
};

const MapBoundsHandler = ({ bounds, center, zoom, selectedOffer }) => {
  const map = useMap();
  const prevBoundsRef = useRef(null);
  const prevOfferIdRef = useRef(null);

  useEffect(() => {
    // When an individual offer is selected, let the offer centering logic handle the view
    if (selectedOffer) return;

    if (bounds && bounds !== prevBoundsRef.current) {
      prevBoundsRef.current = bounds;
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 12, animate: true });
    } else if (!bounds && center && prevBoundsRef.current) {
      prevBoundsRef.current = null;
      map.setView(center, zoom, { animate: true });
    }
  }, [bounds, center, zoom, selectedOffer, map]);

  useEffect(() => {
    if (selectedOffer && selectedOffer.latitude && selectedOffer.longitude) {
      if (selectedOffer.id !== prevOfferIdRef.current) {
        prevOfferIdRef.current = selectedOffer.id;
        // Smooth and moderate zoom (level 12) to avoid jarring leaps while keeping city context
        map.flyTo([selectedOffer.latitude + 0.003, selectedOffer.longitude], 12, {
          animate: true,
          duration: 0.6,
        });
      }
    } else {
      prevOfferIdRef.current = null;
    }
  }, [selectedOffer, map]);

  return null;
};

export const JobsMap = ({
  departmentsGeoJson,
  subGeoJson,
  selectedDept,
  selectedArrondissement,
  targetBounds,
  loadingGeoJson,
  loadingSubGeoJson,
  handleDeptClick,
  handleArrondissementClick,
  geolocating = false,
  jobOffers = [],
  selectedOffer,
  onSelectOffer,
  onApplyOffer,
  isAdmin = false,
  onDeactivateOffer,
  onResetMap,
}) => {
  const franceCenter = [46.603354, 1.888334];
  const defaultZoom = 6;
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite, canUseFavorites } = useFavorites();

  const deptGeoJsonRef = useRef(null);
  const subGeoJsonRef = useRef(null);
  const markerRefs = useRef({});
  const [deactivatingId, setDeactivatingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [deactivateError, setDeactivateError] = useState(null);

  const selectedOfferRef = useRef(selectedOffer);
  selectedOfferRef.current = selectedOffer;
  const isSwitchingOfferRef = useRef(false);
  const isUnmountingRef = useRef(false);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    return () => {
      isUnmountingRef.current = true;
    };
  }, []);

  const handleMarkerClick = (offer) => {
    isSwitchingOfferRef.current = true;
    if (onSelectOffer) {
      onSelectOffer(offer);
    }
    setTimeout(() => {
      isSwitchingOfferRef.current = false;
    }, 400);
  };

  useEffect(() => {
    if (!selectedOffer)
      return;
    if (markerRefs.current[selectedOffer.id]) {
      markerRefs.current[selectedOffer.id].openPopup();
    } else {
      const timer = setTimeout(() => {
        if (markerRefs.current[selectedOffer.id]) {
          markerRefs.current[selectedOffer.id].openPopup();
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [selectedOffer, jobOffers]);

  const deptStyle = {
    fillColor: '#2563eb',
    weight: 1.5,
    opacity: 0.8,
    color: '#2563eb',
    fillOpacity: 0.1,
  };

  const subDeptStyle = {
    fillColor: '#1d4ed8',
    weight: 1.5,
    opacity: 0.9,
    color: '#1d4ed8',
    fillOpacity: selectedArrondissement ? 0.4 : 0.25,
    dashArray: '3',
  };

  const onEachDeptFeature = (feature, layer) => {
    layer.on({
      click: (e) => {
        handleDeptClick(feature, e.target);
      },
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({
          fillOpacity: 0.35,
          weight: 2.5,
          color: '#1d4ed8',
        });
      },
      mouseout: (e) => {
        if (deptGeoJsonRef.current) {
          deptGeoJsonRef.current.resetStyle(e.target);
        }
      },
    });

    if (feature.properties && feature.properties.nom) {
      layer.bindTooltip(
        `<div class="font-sans text-xs font-bold text-blue">${feature.properties.nom} (${feature.properties.code})</div>`,
        { sticky: true }
      );
    }
  };

  const onEachSubFeature = (feature, layer) => {
    layer.on({
      click: (e) => {
        handleArrondissementClick(feature, e.target);
      },
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({
          fillOpacity: 0.55,
          weight: 2.5,
          color: '#2563eb',
        });
      },
      mouseout: (e) => {
        if (subGeoJsonRef.current) {
          subGeoJsonRef.current.resetStyle(e.target);
        }
      },
    });

    const name = feature.properties?.nom || feature.properties?.name || 'Arrondissement';
    layer.bindTooltip(
      `<div class="font-sans text-xs font-semibold text-slate-800">${name}</div>`,
      { sticky: true }
    );
  };

  return (
    <div 
      className="flex-1 w-full h-full relative bg-slate-200 min-h-0"
      role="application"
      aria-label="Carte interactive des offres d'emploi en France"
    >
      {(loadingGeoJson || loadingSubGeoJson) && (
        <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-full shadow-md border border-slate-200 text-xs font-semibold text-blue flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" />
          <span>Chargement du découpage territorial...</span>
        </div>
      )}

      {geolocating && (
        <div className="absolute top-16 right-4 z-20 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-full shadow-md border border-slate-200 text-xs font-semibold text-blue flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" />
          <span>Localisation en cours...</span>
        </div>
      )}

      {(selectedDept || selectedArrondissement || selectedOffer) && (
        <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-white/95 backdrop-blur-xs p-1.5 pr-2 rounded-xl shadow-md border border-slate-200 max-w-[calc(100%-2rem)]">
          {selectedDept && (
            <span className="text-xs font-bold text-blue px-2.5 py-1 bg-blue-light rounded-lg flex items-center gap-1.5 border border-blue/20">
              <MapPin size={13} className="text-blue shrink-0" />
              <span className="truncate">{selectedDept.nom} ({selectedDept.code})</span>
            </span>
          )}
          {selectedArrondissement && (
            <span className="text-xs font-semibold text-slate-600 px-2 py-1 bg-slate-100 rounded-lg truncate">
              {selectedArrondissement.name}
            </span>
          )}
          {selectedDept && onResetMap && (
            <Button
              variant="secondary"
              size="sm"
              icon={<ArrowLeft size={13} />}
              onClick={onResetMap}
              className="text-xs font-semibold py-1 px-2.5 h-auto bg-white hover:bg-slate-100 text-blue border border-slate-300 shadow-xs"
            >
              Sortir du département
            </Button>
          )}
          {selectedOffer && onSelectOffer && (
            <Button
              variant="ghost"
              size="sm"
              icon={<X size={12} />}
              onClick={() => onSelectOffer(null)}
              className="text-xs text-slate-600 hover:text-slate-900 py-1 px-2 h-auto"
            >
              Désélectionner l'offre
            </Button>
          )}
        </div>
      )}

      <MapContainer
        center={franceCenter}
        zoom={defaultZoom}
        zoomControl={false}
        closePopupOnClick={false}
        style={{ height: '100%', width: '100%', position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.geoportail.gouv.fr/" target="_blank" rel="noopener noreferrer">IGN - Géoplateforme</a>'
          url={TILE_LAYER_URL}
          maxZoom={19}
        />
        <ZoomControl position="bottomright" />

        <MapBoundsHandler
          bounds={targetBounds}
          center={!targetBounds && !selectedOffer ? franceCenter : null}
          zoom={defaultZoom}
          selectedOffer={selectedOffer}
        />

        {departmentsGeoJson && !subGeoJson && (
          <GeoJSON
            key="departments-layer"
            ref={deptGeoJsonRef}
            data={departmentsGeoJson}
            style={deptStyle}
            onEachFeature={onEachDeptFeature}
          />
        )}

        {subGeoJson && (
          <GeoJSON
            key={`sub-layer-${selectedDept?.code}-${selectedArrondissement?.name || 'all'}`}
            ref={subGeoJsonRef}
            data={
              selectedArrondissement
                ? { type: 'FeatureCollection', features: [selectedArrondissement.feature] }
                : subGeoJson
            }
            style={subDeptStyle}
            onEachFeature={onEachSubFeature}
          />
        )}

        {jobOffers.map((offer) => (
          <Marker
            key={offer.id}
            ref={(ref) => {
              if (ref)
                markerRefs.current[offer.id] = ref;
            }}
            position={getAdjustedPosition(offer, jobOffers)}
            icon={createCustomIcon()}
            eventHandlers={{
              click: () => handleMarkerClick(offer),
            }}
          >
            <Popup
              className="custom-leaflet-popup"
              minWidth={300}
              maxWidth={340}
              autoPan={true}
              autoPanPaddingTopLeft={[30, 110]}
              autoPanPaddingBottomRight={[30, 30]}
              closeOnClick={false}
              eventHandlers={{
                remove: () => {
                  if (isUnmountingRef.current || isSwitchingOfferRef.current || isNavigatingRef.current) {
                    return;
                  }
                  if (selectedOfferRef.current && selectedOfferRef.current.id === offer.id) {
                    if (onSelectOffer) {
                      onSelectOffer(null);
                    }
                  }
                },
              }}
            >
              <div className="p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 pr-8">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="gov" size="sm">
                      {offer.contract_type}
                    </Badge>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!canUseFavorites) {
                          isNavigatingRef.current = true;
                          navigate('/login', { state: { returnTo: '/jobs', offerId: offer.id } });
                        } else {
                          toggleFavorite(offer);
                        }
                      }}
                      className={`p-1 rounded-full transition-colors cursor-pointer ${
                        !canUseFavorites
                          ? 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                          : isFavorite(offer.id)
                          ? 'text-rose-500 hover:bg-rose-50'
                          : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100'
                      }`}
                      title={
                        !canUseFavorites
                          ? 'Connectez-vous pour ajouter cette offre à vos favoris'
                          : isFavorite(offer.id)
                          ? 'Retirer des favoris'
                          : 'Ajouter aux favoris'
                      }
                      aria-label={
                        !canUseFavorites
                          ? 'Connectez-vous pour ajouter cette offre à vos favoris'
                          : isFavorite(offer.id)
                          ? 'Retirer des favoris'
                          : 'Ajouter aux favoris'
                      }
                    >
                      <Heart
                        size={15}
                        className={isFavorite(offer.id) ? 'fill-rose-500 text-rose-500' : 'text-current'}
                      />
                    </button>
                  </div>
                  {offer.published_at && (
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                      <Calendar size={11} className="text-slate-400" />
                      {new Date(offer.published_at).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-blue text-sm leading-snug pr-4">
                    {offer.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold mt-1">
                    <Building2 size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{offer.company_name}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 text-xs text-slate-600 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-blue shrink-0" />
                    <span className="truncate font-medium">{formatLocation(offer)}</span>
                  </div>

                  {formatSalary(offer.salary_min, offer.salary_max) && (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <DollarSign size={12} className="shrink-0" />
                      <span>{formatSalary(offer.salary_min, offer.salary_max)}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Briefcase size={12} className="text-slate-400 shrink-0" />
                    <span>{formatExperience(offer.experience_years)}</span>
                  </div>
                </div>

                {offer.description && (
                  <div
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                    className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 max-h-28 overflow-y-auto font-normal whitespace-pre-line text-left scrollbar-thin select-text"
                  >
                    {offer.description}
                  </div>
                )}

                {onApplyOffer && (
                  <div className="pt-2 border-t border-slate-100">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Send size={13} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplyOffer(offer);
                      }}
                      className="w-full py-1.5 text-xs font-semibold shadow-xs justify-center"
                    >
                      Postuler à cette offre
                    </Button>
                  </div>
                )}

                {isAdmin && onDeactivateOffer && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        Admin
                      </span>
                      {confirmId !== offer.id ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Ban size={12} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmId(offer.id);
                            setDeactivateError(null);
                          }}
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 py-1 px-2.5 h-auto font-medium"
                        >
                          Désactiver l'offre
                        </Button>
                      ) : null}
                    </div>

                    {confirmId === offer.id && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-2 space-y-2">
                        <p className="text-xs text-red-800 font-medium leading-tight">
                          Désactiver cette offre de la carte publique ?
                        </p>
                        {deactivateError && (
                          <p className="text-[11px] text-red-600 font-medium">{deactivateError}</p>
                        )}
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmId(null);
                              setDeactivateError(null);
                            }}
                            disabled={deactivatingId === offer.id}
                            className="text-xs text-slate-600 hover:bg-slate-200/60 py-1 px-2 h-auto"
                          >
                            Annuler
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={deactivatingId === offer.id ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
                            onClick={async (e) => {
                              e.stopPropagation();
                              setDeactivatingId(offer.id);
                              setDeactivateError(null);
                              try {
                                await onDeactivateOffer(offer.id);
                                setConfirmId(null);
                              } catch (err) {
                                setDeactivateError(err.message || 'Erreur lors de la désactivation');
                              } finally {
                                setDeactivatingId(null);
                              }
                            }}
                            disabled={deactivatingId === offer.id}
                            className="text-xs bg-red-600 hover:bg-red-700 text-white border-none py-1 px-2 h-auto font-medium shadow-none"
                          >
                            {deactivatingId === offer.id ? 'En cours...' : 'Confirmer'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
