import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { fetchSavedOffersApi, saveOfferApi, unsaveOfferApi } from '../api/offersApi';

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const canUseFavorites = Boolean(token);

  const [favorites, setFavorites] = useState([]);
  const [favoriteOffers, setFavoriteOffers] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  const loadBackendFavorites = useCallback(async () => {
    if (!token) {
      setFavorites([]);
      setFavoriteOffers([]);
      return;
    }
    setLoadingFavorites(true);
    try {
      const serverOffers = await fetchSavedOffersApi(token);
      const serverIds = serverOffers.map((o) => Number(o.id));
      setFavorites(serverIds);
      setFavoriteOffers(serverOffers);
    } catch (err) {
      console.error('Erreur chargement favoris backend:', err);
    } finally {
      setLoadingFavorites(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadBackendFavorites();
    } else {
      setFavorites([]);
      setFavoriteOffers([]);
    }
  }, [token, loadBackendFavorites]);

  const isFavorite = useCallback(
    (offerId) => {
      if (!canUseFavorites || !offerId)
        return false;
      return favorites.includes(Number(offerId));
    },
    [canUseFavorites, favorites]
  );

  const toggleFavorite = useCallback(
    async (offer) => {
      if (!canUseFavorites || !offer) {
        return { requiresAuth: true };
      }

      const offerId = Number(typeof offer === 'object' ? offer.id : offer);
      const exists = favorites.includes(offerId);

      if (exists) {
        setFavorites((prev) => prev.filter((id) => id !== offerId));
        setFavoriteOffers((prev) => prev.filter((o) => Number(o.id) !== offerId));

        try {
          await unsaveOfferApi(offerId, token);
        } catch (err) {
          console.error('Erreur suppression favori backend:', err);
        }
        return { success: true, isFavorite: false };
      } else {
        setFavorites((prev) => [...prev, offerId]);
        if (typeof offer === 'object') {
          setFavoriteOffers((prev) => {
            const filtered = prev.filter((o) => Number(o.id) !== offerId);
            return [offer, ...filtered];
          });
        }

        try {
          await saveOfferApi(offerId, token);
        } catch (err) {
          console.error('Erreur ajout favori backend:', err);
        }
        return { success: true, isFavorite: true };
      }
    },
    [canUseFavorites, favorites, token]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteOffers,
        favoritesCount: canUseFavorites ? favorites.length : 0,
        isFavorite,
        toggleFavorite,
        canUseFavorites,
        isAuthenticated,
        loadingFavorites,
        reloadFavorites: loadBackendFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites doit être utilisé au sein d\'un FavoritesProvider');
  }
  return context;
};
