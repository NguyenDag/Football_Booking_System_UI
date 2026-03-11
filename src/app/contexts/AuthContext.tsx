import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface User {
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { authService } from '../api/auth.service';
import { useEffect } from 'react';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();
      if (token) {
        try {
          const profile = await authService.getProfile();
          setUser(profile as unknown as User);
        } catch (error) {
          console.error('Failed to restore session:', error);
          authService.logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      console.log('Attempting login for:', email);
      const authResponse = await authService.login({ email, password });
      console.log('Login success:', authResponse);
      setUser(authResponse.user as unknown as User);
      return { success: true };
    } catch (error: any) {
      console.error('Login error details:', error);
      const errorMessage = error.message || (typeof error === 'string' ? error : 'Đăng nhập không thành công');
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
