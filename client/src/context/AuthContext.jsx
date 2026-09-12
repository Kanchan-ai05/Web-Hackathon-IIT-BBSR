import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { localRealmEngine } from '../services/localRealmEngine';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize with Guest Hero from localRealmEngine so app boots instantly without login
  const [hero, setHero] = useState(() => {
    return localRealmEngine.getHero();
  });
  const [token, setToken] = useState(localStorage.getItem('liferpg_token') || 'guest_realm_token');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Sync token with localStorage
  useEffect(() => {
    if (token && token !== 'guest_realm_token') {
      localStorage.setItem('liferpg_token', token);
    } else {
      localStorage.removeItem('liferpg_token');
    }
  }, [token]);

  // Load current user profile
  useEffect(() => {
    const fetchCurrentHero = async () => {
      // If user has a dedicated cloud token, attempt to verify it
      if (token && token !== 'guest_realm_token') {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setHero(res.data.user || res.data.hero);
          } else {
            setHero(localRealmEngine.getHero());
          }
        } catch (err) {
          console.warn('Cloud auth check fallback to Local Realm:', err.message);
          setHero(localRealmEngine.getHero());
        }
      } else {
        setHero(localRealmEngine.getHero());
      }
      setLoading(false);
    };

    fetchCurrentHero();

    const handleLogoutEvent = () => {
      setToken('guest_realm_token');
      setHero(localRealmEngine.getHero());
    };

    window.addEventListener('liferpg_logout', handleLogoutEvent);
    return () => window.removeEventListener('liferpg_logout', handleLogoutEvent);
  }, [token]);

  /**
   * Signup (Register)
   */
  const signup = async (username, email, password, heroClass = 'Warrior', avatar = 'warrior', equippedTheme = 'dark-fantasy') => {
    setAuthError(null);
    try {
      const res = await api.post('/auth/signup', {
        username,
        email,
        password,
        heroClass,
        avatar,
        equippedTheme
      });

      if (res.data.success) {
        setToken(res.data.token);
        const user = res.data.user || res.data.hero;
        setHero(user);
        return { success: true, hero: user, user };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to enlist Hero.';
      setAuthError(msg);
      return { success: false, message: msg };
    }
  };

  /**
   * Login
   */
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        setToken(res.data.token);
        const user = res.data.user || res.data.hero;
        setHero(user);
        return { success: true, hero: user, user };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid hero credentials.';
      setAuthError(msg);
      return { success: false, message: msg };
    }
  };

  /**
   * Logout
   */
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    }
    setToken('guest_realm_token');
    const guestHero = localRealmEngine.getHero();
    setHero(guestHero);
    localStorage.removeItem('liferpg_token');
  };

  /**
   * Update Theme
   */
  const updateTheme = async (theme) => {
    try {
      const res = await api.patch('/auth/theme', { theme });
      if (res.data.success) {
        const user = res.data.user || res.data.hero;
        setHero((prev) => ({ ...prev, equippedTheme: theme, ...user }));
        return { success: true };
      }
    } catch (err) {
      console.error('Failed to equip theme:', err);
      return { success: false, message: err.message };
    }
  };

  const updateHero = (updatedHeroData) => {
    setHero((prev) => ({ ...prev, ...updatedHeroData }));
  };

  return (
    <AuthContext.Provider
      value={{
        hero,
        user: hero, // Alias user to hero
        token,
        loading,
        authError,
        signup,
        register: signup,
        login,
        logout,
        updateTheme,
        updateHero,
        isAuthenticated: true, // Always true: instant access to all pages without login
        isGuest: !token || token === 'guest_realm_token'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
