import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Check current session on mount
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(formatUser(session.user));
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  function formatUser(supabaseUser) {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email,
      role: supabaseUser.user_metadata?.role || 'doctor',
      // للمرضى: الـ admin يضيف patient_id في user_metadata لربط الحساب بالملف
      patient_id: supabaseUser.user_metadata?.patient_id || null,
    };
  }

  async function checkSession() {
    try {
      setIsLoadingAuth(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(formatUser(session.user));
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setAuthError({ type: 'auth_required', message: 'يرجى تسجيل الدخول' });
      }
    } catch (error) {
      setAuthError({ type: 'unknown', message: error.message });
    } finally {
      setIsLoadingAuth(false);
    }
  }

  async function logout(shouldRedirect = true) {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) window.location.href = '/login';
  }

  function navigateToLogin() {
    window.location.href = '/login';
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      logout,
      navigateToLogin,
      checkAppState: checkSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
