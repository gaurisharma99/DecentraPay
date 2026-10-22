import { createContext, useState, useEffect } from 'react';
import { DEMO_USERNAME, DEMO_PASSWORD } from '../utils/credentials';

export const AuthContext = createContext();

const STORAGE_KEY = 'decentrapay_demo_auth';

export function AuthProvider({ children }) {
  // Restore prior login so a refresh doesn't force re-login mid-demo.
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  );

  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem(STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [isLoggedIn]);

  // Demo-only credential check (see utils/credentials.js for the caveat).
  const login = (username, password) => {
    if (username.trim() === DEMO_USERNAME && password === DEMO_PASSWORD) {
      setIsLoggedIn(true);
      return { ok: true };
    }
    return { ok: false, error: 'Invalid username or password' };
  };

  const logout = () => setIsLoggedIn(false);

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
