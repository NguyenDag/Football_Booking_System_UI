import { apiClient } from './apiClient';

export interface UserProfile {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: string;
  user: UserProfile;
}

export const authService = {
  async login(credentials: any): Promise<AuthResponse> {
    const response = await apiClient('/auth/login', {
      method: 'POST',
      body: credentials,
    });
    // The C# ApiResponse wrapper: { success: true, data: { ... }, message: "..." }
    if (response.success) {
      const authData = response.data;
      localStorage.setItem('accessToken', authData.accessToken);
      localStorage.setItem('refreshToken', authData.refreshToken);
      return authData;
    }
    throw new Error(response.message || 'Login failed');
  },

  async getProfile(): Promise<UserProfile> {
    const response = await apiClient('/auth/me');
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch profile');
  },

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  getToken() {
    return localStorage.getItem('accessToken');
  },
};
