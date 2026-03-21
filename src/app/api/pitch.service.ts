import { apiClient } from './apiClient';

export interface PriceSlot {
  id: string;
  fieldId: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  price: number;
  type: 'PEAK' | 'OFF_PEAK' | 'WEEKEND';
}

export interface Field {
  id: string;
  name: string;
  type: '5' | '7' | '11';
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  description: string;
  image: string;
  priceSlots?: PriceSlot[];
}

export interface CreatePitchRequest {
  pitchName: string;
  pitchType: string;
  status: string;
  description?: string;
}

export interface UpdatePitchRequest {
  pitchName?: string;
  pitchType?: string;
  status?: string;
  description?: string;
}

// Map backend PitchType string to frontend type
const mapPitchType = (backendType: string): '5' | '7' | '11' => {
  if (backendType.includes('5')) return '5';
  if (backendType.includes('7')) return '7';
  if (backendType.includes('11')) return '11';
  return '5'; // fallback
};

// Map backend TimeSpan (00:00:00) to HH:mm
const formatTimeSpan = (timeSpan: string): string => {
  return timeSpan.substring(0, 5);
};

export const pitchService = {
  async getAllPitches(): Promise<Field[]> {
    const response = await apiClient('/pitches');
    if (response.success) {
      return response.data.map((p: any) => ({
        id: p.pitchId.toString(),
        name: p.pitchName,
        type: mapPitchType(p.pitchType),
        status: p.status as Field['status'],
        description: p.description || '',
        image: `football field ${mapPitchType(p.pitchType)} players`, // Use name/type for Unsplash query
        priceSlots: p.priceSlots?.map((ps: any) => ({
          id: ps.priceSlotId.toString(),
          fieldId: p.pitchId.toString(),
          startTime: formatTimeSpan(ps.startTime),
          endTime: formatTimeSpan(ps.endTime),
          price: ps.pricePerHour,
          type: ps.isPeakHour ? 'PEAK' : 'OFF_PEAK'
        }))
      }));
    }
    throw new Error(response.message || 'Failed to fetch pitches');
  },

  async getPitchById(id: string): Promise<Field> {
    const response = await apiClient(`/pitches/${id}`);
    if (response.success) {
      const p = response.data;
      return {
        id: p.pitchId.toString(),
        name: p.pitchName,
        type: mapPitchType(p.pitchType),
        status: p.status as Field['status'],
        description: p.description || '',
        image: `football field ${mapPitchType(p.pitchType)} players`,
        priceSlots: p.priceSlots?.map((ps: any) => ({
          id: ps.priceSlotId.toString(),
          fieldId: p.pitchId.toString(),
          startTime: formatTimeSpan(ps.startTime),
          endTime: formatTimeSpan(ps.endTime),
          price: ps.pricePerHour,
          type: ps.isPeakHour ? 'PEAK' : 'OFF_PEAK'
        }))
      };
    }
    throw new Error(response.message || 'Failed to fetch pitch');
  },

  async createPitch(data: CreatePitchRequest): Promise<Field> {
    const response = await apiClient('/pitches', {
      method: 'POST',
      body: data,
    });
    if (response.success) {
      // Map back to Field
      const p = response.data;
      return {
        id: p.pitchId.toString(),
        name: p.pitchName,
        type: mapPitchType(p.pitchType),
        status: p.status as Field['status'],
        description: p.description || '',
        image: `football field ${mapPitchType(p.pitchType)} players`
      };
    }
    throw new Error(response.message || 'Failed to create pitch');
  },

  async updatePitch(id: string, data: UpdatePitchRequest): Promise<void> {
    const response = await apiClient(`/pitches/${id}`, {
      method: 'PUT',
      body: data,
    });
    if (!response.success) {
      throw new Error(response.message || 'Failed to update pitch');
    }
  },

  async deletePitch(id: string): Promise<void> {
    const response = await apiClient(`/pitches/${id}`, {
      method: 'DELETE',
    });
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete pitch');
    }
  }
};
