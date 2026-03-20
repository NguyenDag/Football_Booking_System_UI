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

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export const authService = {
  async login(credentials: any): Promise<AuthResponse> {
    const response = await apiClient('/auth/login', {
      method: 'POST',
      body: credentials,
    });
    
    if (response.success) {
      const authData = response.data;
      localStorage.setItem('accessToken', authData.accessToken);
      localStorage.setItem('refreshToken', authData.refreshToken);
      return authData;
    }
    throw new Error(response.message || 'Đăng nhập thất bại');
  },

  async register(data: RegisterRequest): Promise<any> {
    const response = await apiClient('/auth/register', {
      method: 'POST',
      body: data,
    });

    if (response.success) {
      return response.data;
    }
    
    if (response.errors && response.errors.length > 0) {
      throw new Error(response.errors.join('. '));
    }
    
    throw new Error(response.message || 'Đăng ký thất bại');
  },

  async getProfile(): Promise<UserProfile> {
    const response = await apiClient('/auth/me');
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Không thể lấy thông tin người dùng');
  },

  async forgotPassword(email: string): Promise<any> {
    const response = await apiClient('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
    if (response.success) {
      return response;
    }
    throw new Error(response.message || 'Yêu cầu đặt lại mật khẩu thất bại');
  },

  async resetPassword(data: ResetPasswordRequest): Promise<any> {
    const response = await apiClient('/auth/reset-password', {
      method: 'POST',
      body: data,
    });
    if (response.success) {
      return response;
    }
    throw new Error(response.message || 'Đặt lại mật khẩu thất bại');
  },

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await apiClient('/auth/me', {
      method: 'PUT',
      body: data,
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Cập nhật thông tin thất bại');
  },

  async changePassword(data: ChangePasswordRequest): Promise<any> {
    const response = await apiClient('/auth/change-password', {
      method: 'POST',
      body: data,
    });
    if (response.success) {
      return response;
    }
    throw new Error(response.message || 'Đổi mật khẩu thất bại');
  },

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  getToken() {
    return localStorage.getItem('accessToken');
  },
};
