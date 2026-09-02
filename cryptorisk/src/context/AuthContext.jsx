import { createContext, useContext, useState, useCallback } from 'react';

/**
 * AuthContext — stores the logged-in user (id, name, email, role).
 *
 * In this demo the user object comes from mockData (currentUser).
 * When the real backend is wired in, call login() with the API response.
 *
 * The admin role check is done in two places:
 *  1. AdminRoute guard (blocks direct URL access)
 *  2. Navbar (hides the Admin link for non-admins — UX only)
 */
import { currentUser } from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialise with the mock user so all existing pages keep working.
  // Replace this with null + a login() call when the real API is connected.
  const [user, setUser] = useState(currentUser);

  /**
   * Call this after a successful API login response.
   * { id, name, email, role } — role comes from the JWT payload.
   */
  const login = useCallback((userData) => {
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
