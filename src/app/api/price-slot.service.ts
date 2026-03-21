import { apiClient } from './apiClient';

export interface PriceSlot {
  priceSlotId: number;
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
  pricePerHour: number;
  applyOn: 'WEEKDAY' | 'WEEKEND' | 'ALL';
  isPeakHour: boolean;
}

export interface PriceSlotRequest {
  priceSlotId?: number;
  startTime: string;
  endTime: string;
  pricePerHour: number;
  applyOn: 'WEEKDAY' | 'WEEKEND' | 'ALL';
  isPeakHour: boolean;
}

export const priceSlotService = {
  async getByPitchId(pitchId: string): Promise<PriceSlot[]> {
    const response = await apiClient(`/PriceSlots/pitch/${pitchId}`);
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Không thể tải danh sách khung giá');
  },

  async createSlot(pitchId: string, data: PriceSlotRequest): Promise<PriceSlot> {
    const response = await apiClient(`/PriceSlots/pitch/${pitchId}`, {
      method: 'POST',
      body: data,
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Không thể tạo khung giá');
  },

  async updateSlot(id: number, data: PriceSlotRequest): Promise<void> {
    const response = await apiClient(`/PriceSlots/${id}`, {
      method: 'PUT',
      body: data,
    });
    if (!response.success) {
      throw new Error(response.message || 'Không thể cập nhật khung giá');
    }
  },

  async deleteSlot(id: number): Promise<void> {
    const response = await apiClient(`/PriceSlots/${id}`, {
      method: 'DELETE',
    });
    if (!response.success) {
      throw new Error(response.message || 'Không thể xóa khung giá');
    }
  }
};
