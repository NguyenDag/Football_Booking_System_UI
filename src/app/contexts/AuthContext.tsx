import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface User {
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: any) => Promise<{ success: boolean; message?: string }>;
  sendOtp: (email: string) => Promise<{ success: boolean; message?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; data?: string; message?: string }>;
  resetPassword: (data: any) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (data: any) => Promise<{ success: boolean; message?: string }>;
  changePassword: (data: any) => Promise<{ success: boolean; message?: string }>;
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

  const register = async (data: any): Promise<{ success: boolean; message?: string }> => {
    try {
      await authService.register(data);
      return { success: true };
    } catch (error: any) {
      console.error('Register error:', error);
      const errorMessage = error.message || 'Đăng ký không thành công';
      return { success: false, message: errorMessage };
    }
  };

  const sendOtp = async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      await authService.sendOtp(email);
      return { success: true };
    } catch (error: any) {
      console.error('Send OTP error:', error);
      const errorMessage = error.message || 'Yêu cầu gửi mã OTP không thành công';
      return { success: false, message: errorMessage };
    }
  };

  const verifyOtp = async (email: string, otp: string): Promise<{ success: boolean; data?: string; message?: string }> => {
    try {
      const resetToken = await authService.verifyOtp(email, otp);
      return { success: true, data: resetToken };
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      const errorMessage = error.message || 'Xác minh OTP không thành công';
      return { success: false, message: errorMessage };
    }
  };

  const resetPassword = async (data: any): Promise<{ success: boolean; message?: string }> => {
    try {
      await authService.resetPassword(data);
      return { success: true };
    } catch (error: any) {
      console.error('Reset password error:', error);
      const errorMessage = error.message || 'Đặt lại mật khẩu không thành công';
      return { success: false, message: errorMessage };
    }
  };

  const updateProfile = async (data: any): Promise<{ success: boolean; message?: string }> => {
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser as unknown as User);
      return { success: true };
    } catch (error: any) {
      console.error('Update profile error:', error);
      const errorMessage = error.message || 'Cập nhật thông tin không thành công';
      return { success: false, message: errorMessage };
    }
  };

  const changePassword = async (data: any): Promise<{ success: boolean; message?: string }> => {
    try {
      await authService.changePassword(data);
      return { success: true };
    } catch (error: any) {
      console.error('Change password error:', error);
      const errorMessage = error.message || 'Đổi mật khẩu không thành công';
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
        register,
        sendOtp,
        verifyOtp,
        resetPassword,
        updateProfile,
        changePassword,
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
