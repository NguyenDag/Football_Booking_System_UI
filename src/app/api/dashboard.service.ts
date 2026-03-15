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

export const dashboardService = {
  getStats: async (): Promise<DashboardStatsResponse> => {
    const response = await apiClient('/dashboard/stats');
    return response.data;
  },
};
