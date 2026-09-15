import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { auth as authApi, token as tokenStore } from '../api/api';

/**
 * AuthContext — single source of truth for the logged-in user.
 *
 * user shape: { id, name, email }
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while hydrating from token

  // On mount: if a token exists in localStorage, decode it to restore the
  // session without requiring a full login page reload.
  useEffect(() => {
    const t = tokenStore.get();
    if (t) {
      try {
        const payload = JSON.parse(atob(t.split('.')[1]));
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          setUser({ id: payload.id, email: payload.email, name: payload.name ?? payload.email });
        } else {
          tokenStore.clear();
        }
      } catch {
        tokenStore.clear();
      }
    }
    setLoading(false);
  }, []);

  /**
   * login — calls POST /api/auth/login, stores token, sets user.
   * Returns the user object on success; throws on failure.
   */
  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    tokenStore.set(data.accessToken);
    setUser(data.user);  // { id, name, email }
    return data.user;
  }, []);

  /**
   * register — calls POST /api/auth/register, stores token, sets user.
   */
  const register = useCallback(async (name, email, password) => {
    const data = await authApi.register(name, email, password);
    tokenStore.set(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  /**
   * logout — clears token + user state, redirects to login.
   */
  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    tokenStore.clear();
    setUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
