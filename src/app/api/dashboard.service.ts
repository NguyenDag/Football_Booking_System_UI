import { apiClient } from './apiClient';

export interface UpcomingBookingDto {
  detailId: number;
  pitchName: string;
  playDate: string;
  startTime: string;
  endTime: string;
  price: number;
  status: string;
  customerName?: string;
}

export interface DashboardStatsResponse {
  upcomingConfirmedCount: number;
  totalBookingsCount: number;
  completedBookingsCount: number;
  rejectedBookingsCount: number;
  upcomingBookings: UpcomingBookingDto[];
}

export interface BookingsByDateDto {
  dateLabel: string;
  bookingsCount: number;
}

export interface RevenueByPitchDto {
  pitchId: number;
  pitchName: string;
  totalRevenue: number;
}

export interface MonthlyRevenueDto {
  month: string;
  revenue: number;
  bookings: number;
}

export interface PeakHourDto {
  hourRange: string;
  bookingsCount: number;
}

export interface AdminAdvancedStatsResponse {
  totalBookings: number;
  totalRevenue: number;
  cancellationRate: number;
  bookingsByDate: BookingsByDateDto[];
  revenueByPitch: RevenueByPitchDto[];
  monthlyRevenue: MonthlyRevenueDto[];
  peakHours: PeakHourDto[];
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStatsResponse> => {
    const response = await apiClient('/dashboard/stats');
    return response.data;
  },

  getAdminStats: async (fromDate?: string, toDate?: string): Promise<AdminAdvancedStatsResponse> => {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    
    const response = await apiClient(`/dashboard/admin-stats?${params.toString()}`);
    return response.data;
  },
};
