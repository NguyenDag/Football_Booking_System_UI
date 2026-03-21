import { apiClient } from './apiClient';

export interface BookingCreateRequest {
  pitchId: number;
  playDate: string; // yyyy-MM-dd
  startTime: string; // HH:mm:ss
  durationMinutes: number;
  notes?: string;
}

export interface BookingResponse {
  bookingId: number;
  userId: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  notes?: string;
  createdAt: string;
  details: BookingDetailResponse[];
}

export interface BookingDetailResponse {
  detailId: number;
  pitchId: number;
  pitchName: string;
  playDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  priceAtBooking: number;
  status: string;
  cancellationReason?: string;
}

export const bookingService = {
  async createBooking(request: BookingCreateRequest): Promise<BookingResponse> {
    const response = await apiClient('/bookings', {
      method: 'POST',
      body: request,
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Đặt sân thất bại');
  },

  async getMyBookings(): Promise<BookingResponse[]> {
    const response = await apiClient('/bookings/my-bookings');
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Không thể tải danh sách đặt sân');
  },

  async getUpcomingBookings(): Promise<BookingResponse[]> {
    const response = await apiClient('/bookings/upcoming');
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Không thể tải danh sách booking sắp tới');
  },

  async getHistoryBookings(): Promise<BookingResponse[]> {
    const response = await apiClient('/bookings/history');
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Không thể tải lịch sử đặt sân');
  },

  async getStaffDailyBookings(date?: string): Promise<BookingResponse[]> {
    const response = await apiClient(`/bookings/staff/daily?date=${date || ''}`);
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Không thể tải lịch sân theo ngày');
  },

  async getStaffPendingBookings(): Promise<BookingResponse[]> {
    const response = await apiClient('/bookings/staff/pending');
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Không thể tải danh sách chờ xử lý');
  },

  async cancelBooking(detailId: number, reason: string): Promise<boolean> {
    const response = await apiClient(`/bookings/details/${detailId}/cancel`, {
      method: 'PUT',
      body: { reason },
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Hủy đặt sân thất bại');
  },

  async confirmBooking(detailId: number): Promise<boolean> {
    const response = await apiClient(`/bookings/staff/details/${detailId}/confirm`, {
      method: 'PUT',
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Xác nhận đặt sân thất bại');
  },

  async rejectBooking(detailId: number, reason: string): Promise<boolean> {
    const response = await apiClient(`/bookings/staff/reject/${detailId}`, {
      method: 'POST',
      body: { reason }
    });
    return response.data;
  },

  getPitchBookingsByDate: async (pitchId: number, date: string): Promise<BookingResponse[]> => {
    const response = await apiClient(`/bookings/pitch/${pitchId}/date/${date}`);
    return response.data;
  }
};
