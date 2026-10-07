import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const normalizeUserData = (data) => {
  if (!data) 
    return null;
  if (data.user && typeof data.user === 'object') {
    const profile = data.profile ?? data.user.profile ?? null;
    const stats = data.stats ?? data.user.stats ?? {};
    return {
      ...(profile || {}),
      ...data.user,
      profile,
      stats,
    };
  }
  return data;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('geoemploi_user');
    if (!savedUser) 
      return null;
    try {
      const parsed = JSON.parse(savedUser);
      return normalizeUserData(parsed);
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('geoemploi_token') || null;
  });

  const loginState = (userData, userToken) => {
    const normalized = normalizeUserData(userData);
    setUser(normalized);
    setToken(userToken);
    localStorage.setItem('geoemploi_user', JSON.stringify(normalized));
    localStorage.setItem('geoemploi_token', userToken);
  };

  const logoutState = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('geoemploi_user');
    localStorage.removeItem('geoemploi_token');
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      logoutState();
    };

    window.addEventListener('geoemploi:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('geoemploi:unauthorized', handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!isMounted) return;
        if (res.status === 401 || res.status === 403) {
          logoutState();
        } else if (res.ok) {
          const resData = await res.json().catch(() => null);
          if (resData && isMounted) {
            const normalized = normalizeUserData(resData);
            setUser(normalized);
            localStorage.setItem('geoemploi_user', JSON.stringify(normalized));
          }
        }
      })
      .catch(() => {
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loginState, logoutState, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé au sein d\'un AuthProvider');
  }
  return context;
};
