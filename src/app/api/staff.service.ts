import { apiClient } from './apiClient';

export interface StaffSummary {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  totalAssignedPitches: number;
  totalShifts: number;
}

export interface AssignedPitch {
  assignmentId: number;
  pitchId: number;
  pitchName: string;
  pitchType: string;
  status: string;
  assignedAt: string;
}

export interface Shift {
  shiftId: number;
  staffId: number;
  staffName: string;
  pitchId: number;
  pitchName: string;
  dayOfWeek: number;
  dayOfWeekName: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface StaffDetail {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  assignedPitches: AssignedPitch[];
  shifts: Shift[];
}

export interface CreateStaffRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface UpdateStaffRequest {
  fullName: string;
  phone?: string;
  isActive: boolean;
}

export interface AssignPitchRequest {
  pitchId: number;
}

export interface CreateShiftRequest {
  pitchId: number;
  dayOfWeek: number;
  startTime: string; // "HH:mm:ss"
  endTime: string;   // "HH:mm:ss"
}

export interface UpdateShiftRequest {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export const staffService = {
  // Staff Accounts
  async getAllStaff(): Promise<StaffSummary[]> {
    const response = await apiClient('/admin/staff');
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Không thể lấy danh sách nhân viên');
  },

  async getStaffById(id: number): Promise<StaffDetail> {
    const response = await apiClient(`/admin/staff/${id}`);
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Không thể lấy thông tin nhân viên');
  },

  async createStaff(data: CreateStaffRequest): Promise<StaffDetail> {
    const response = await apiClient('/admin/staff', {
      method: 'POST',
      body: data,
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Tạo nhân viên thất bại');
  },

  async updateStaff(id: number, data: UpdateStaffRequest): Promise<StaffDetail> {
    const response = await apiClient(`/admin/staff/${id}`, {
      method: 'PUT',
      body: data,
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Cập nhật nhân viên thất bại');
  },

  async deleteStaff(id: number): Promise<void> {
    const response = await apiClient(`/admin/staff/${id}`, {
      method: 'DELETE',
    });
    if (!response.success) {
      throw new Error(response.message || 'Xóa nhân viên thất bại');
    }
  },

  // Pitch Assignments
  async getAssignedPitches(staffId: number): Promise<AssignedPitch[]> {
    const response = await apiClient(`/admin/staff/${staffId}/pitches`);
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Không thể lấy danh sách sân phân công');
  },

  async assignPitch(staffId: number, data: AssignPitchRequest): Promise<AssignedPitch> {
    const response = await apiClient(`/admin/staff/${staffId}/pitches`, {
      method: 'POST',
      body: data,
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Phân công sân thất bại');
  },

  async unassignPitch(staffId: number, pitchId: number): Promise<void> {
    const response = await apiClient(`/admin/staff/${staffId}/pitches/${pitchId}`, {
      method: 'DELETE',
    });
    if (!response.success) {
      throw new Error(response.message || 'Thu hồi phân công sân thất bại');
    }
  },

  // Shift Management
  async getShifts(staffId: number): Promise<Shift[]> {
    const response = await apiClient(`/admin/staff/${staffId}/shifts`);
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Không thể lấy danh sách ca làm việc');
  },

  async createShift(staffId: number, data: CreateShiftRequest): Promise<Shift> {
    const response = await apiClient(`/admin/staff/${staffId}/shifts`, {
      method: 'POST',
      body: data,
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Tạo ca làm việc thất bại');
  },

  async updateShift(staffId: number, shiftId: number, data: UpdateShiftRequest): Promise<Shift> {
    const response = await apiClient(`/admin/staff/${staffId}/shifts/${shiftId}`, {
      method: 'PUT',
      body: data,
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Cập nhật ca làm việc thất bại');
  },

  async deleteShift(staffId: number, shiftId: number): Promise<void> {
    const response = await apiClient(`/admin/staff/${staffId}/shifts/${shiftId}`, {
      method: 'DELETE',
    });
    if (!response.success) {
      throw new Error(response.message || 'Xóa ca làm việc thất bại');
    }
  },
};
