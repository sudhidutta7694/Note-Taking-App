'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  verified: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setAuth: (auth: { token: string; user: User }) => void;
  isAuthenticated: boolean;
}

// Cookie helper functions
function setCookie(name: string, value: string, days: number = 7) {
  if (typeof window === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;samesite=lax;secure=${window.location.protocol === 'https:'}`;
  
  console.log('🍪 Cookie set:', name, 'Value exists:', !!value);
}

function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;
  
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      const value = c.substring(nameEQ.length, c.length);
      console.log('🍪 Cookie read:', name, 'Value exists:', !!value);
      return value;
    }
  }
  
  console.log('🍪 Cookie not found:', name);
  return null;
}

function deleteCookie(name: string) {
  if (typeof window === 'undefined') return;
  
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;samesite=lax`;
  console.log('🍪 Cookie deleted:', name);
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize auth state from localStorage AND cookies
  const [auth, setAuthState] = useState<{ user: User | null; token: string | null }>(() => {
    if (typeof window !== 'undefined') {
      // Try localStorage first, then cookies as fallback
      const token = localStorage.getItem('authToken') || getCookie('authToken');
      const userData = localStorage.getItem('userData');
      
      console.log('🔍 Auth initialization - Token exists:', !!token, 'UserData exists:', !!userData);
      
      if (token && userData) {
        try {
          const user = JSON.parse(userData) as User;
          console.log('✅ Auth initialized from storage:', { userId: user.id, tokenExists: !!token });
          return { token, user };
        } catch (error) {
          console.error('❌ Failed to parse stored user data:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          deleteCookie('authToken');
        }
      }
    }
    return { user: null, token: null };
  });

  const [isLoading, setIsLoading] = useState(true);

  // ✅ Sync auth state with localStorage, cookies, and API client
  useEffect(() => {
    if (auth.token && auth.user) {
      console.log('🔄 Syncing auth state - Setting storage and API token');
      
      // Store in localStorage
      localStorage.setItem('authToken', auth.token);
      localStorage.setItem('userData', JSON.stringify(auth.user));
      
      // Store in cookies for middleware access
      setCookie('authToken', auth.token, 7); // 7 days expiration
      
      // ✅ Set API client header - now works with custom ApiService
      api.setAuthToken(auth.token);
    } else {
      console.log('🔄 Syncing auth state - Clearing storage and API token');
      
      // Clear from localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      // Clear from cookies
      deleteCookie('authToken');
      
      // ✅ Clear API client header - now works with custom ApiService
      api.removeAuthToken();
    }
  }, [auth]);

  // ✅ Verify token on app startup
  useEffect(() => {
    const verifyToken = async () => {
      console.log('🔍 Token verification - Token exists:', !!auth.token, 'User exists:', !!auth.user);
      
      if (auth.token && !auth.user) {
        setIsLoading(true);
        console.log('🔍 Verifying token with server...');
        
        try {
          // ✅ Fixed: Use the correct method and handle response properly
          const user = await api.getProfile();
          console.log('✅ Token verified successfully:', user.id);
          setAuthState(prev => ({ ...prev, user }));
        } catch (error) {
          console.error('❌ Token verification failed:', error);
          setAuthState({ user: null, token: null });
        } finally {
          setIsLoading(false);
        }
      } else {
        // No token to verify or user already loaded
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [auth.token, auth.user]);

  // ✅ Updated login method for passwordless auth
  const login = async (email: string, password: string) => {
    console.log('🔐 Login attempt for:', email);
    setIsLoading(true);
    
    try {
      // ✅ Fixed: Handle response properly with correct typing
      const loginData = await api.login(email, password);
      const { token, user } = loginData;
      
      console.log('✅ Login successful:', user.id);
      setAuthState({ token, user });
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Add setAuth method for external auth state updates (like OTP verification)
  const setAuth = ({ token, user }: { token: string; user: User }) => {
    console.log('🔐 Setting auth state externally:', { email: user.email, tokenExists: !!token });
    setAuthState({ token, user });
  };

  const logout = () => {
    console.log('🚪 Logging out user');
    setAuthState({ user: null, token: null });
  };

  const value: AuthContextType = {
    user: auth.user,
    token: auth.token,
    isLoading,
    login,
    logout,
    setAuth,
    isAuthenticated: !!auth.user && !!auth.token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
