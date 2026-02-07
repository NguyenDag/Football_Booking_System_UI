export interface Field {
  id: string;
  name: string;
  type: '5' | '7' | '11';
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  description: string;
  image: string;
}

export interface PriceSlot {
  id: string;
  fieldId: string;
  startTime: string;
  endTime: string;
  price: number;
  type: 'PEAK' | 'OFF_PEAK' | 'WEEKEND';
}

export interface TimeSlot {
  id: string;
  fieldId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: 60 | 90 | 120;
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

export interface Booking {
  id: string;
  fieldId: string;
  customerId: string;
  customerName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
  note?: string;
  cancelReason?: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  assignedFields: string[];
  schedules: StaffSchedule[];
}

export interface StaffSchedule {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string;
  endTime: string;
}

// Mock data
export const mockFields: Field[] = [
  {
    id: '1',
    name: 'Sân A',
    type: '5',
    status: 'ACTIVE',
    description: 'Sân 5 người - Cỏ nhân tạo cao cấp',
    image: 'football field 5 players',
  },
  {
    id: '2',
    name: 'Sân B',
    type: '7',
    status: 'ACTIVE',
    description: 'Sân 7 người - Có mái che',
    image: 'football field 7 players',
  },
  {
    id: '3',
    name: 'Sân C',
    type: '11',
    status: 'ACTIVE',
    description: 'Sân 11 người - Sân chuẩn thi đấu',
    image: 'football field 11 players',
  },
  {
    id: '4',
    name: 'Sân D',
    type: '5',
    status: 'MAINTENANCE',
    description: 'Sân 5 người - Đang bảo trì',
    image: 'football field maintenance',
  },
];

export const mockPriceSlots: PriceSlot[] = [
  // Sân A - 5 người
  { id: 'p1', fieldId: '1', startTime: '06:00', endTime: '16:00', price: 300000, type: 'OFF_PEAK' },
  { id: 'p2', fieldId: '1', startTime: '16:00', endTime: '22:00', price: 500000, type: 'PEAK' },
  { id: 'p3', fieldId: '1', startTime: '22:00', endTime: '24:00', price: 350000, type: 'OFF_PEAK' },

  // Sân B - 7 người
  { id: 'p4', fieldId: '2', startTime: '06:00', endTime: '16:00', price: 500000, type: 'OFF_PEAK' },
  { id: 'p5', fieldId: '2', startTime: '16:00', endTime: '22:00', price: 700000, type: 'PEAK' },
  { id: 'p6', fieldId: '2', startTime: '22:00', endTime: '24:00', price: 550000, type: 'OFF_PEAK' },

  // Sân C - 11 người
  { id: 'p7', fieldId: '3', startTime: '06:00', endTime: '16:00', price: 800000, type: 'OFF_PEAK' },
  { id: 'p8', fieldId: '3', startTime: '16:00', endTime: '22:00', price: 1200000, type: 'PEAK' },
  { id: 'p9', fieldId: '3', startTime: '22:00', endTime: '24:00', price: 900000, type: 'OFF_PEAK' },
];

export const mockBookings: Booking[] = [
  {
    id: 'b1',
    fieldId: '1',
    customerId: '3',
    customerName: 'Trần Văn B',
    date: '2026-02-08',
    startTime: '17:00',
    endTime: '19:00',
    duration: 120,
    totalPrice: 1000000,
    status: 'CONFIRMED',
    createdAt: '2026-02-05T10:30:00',
    note: 'Cần chuẩn bị bóng',
  },
  {
    id: 'b2',
    fieldId: '2',
    customerId: '3',
    customerName: 'Lê Thị C',
    date: '2026-02-07',
    startTime: '18:00',
    endTime: '19:30',
    duration: 90,
    totalPrice: 1050000,
    status: 'PENDING',
    createdAt: '2026-02-06T14:20:00',
  },
  {
    id: 'b3',
    fieldId: '1',
    customerId: '3',
    customerName: 'Phạm Văn D',
    date: '2026-02-10',
    startTime: '19:00',
    endTime: '20:30',
    duration: 90,
    totalPrice: 750000,
    status: 'CONFIRMED',
    createdAt: '2026-02-06T09:15:00',
  },
  {
    id: 'b4',
    fieldId: '3',
    customerId: '3',
    customerName: 'Nguyễn Văn E',
    date: '2026-02-05',
    startTime: '17:00',
    endTime: '19:00',
    duration: 120,
    totalPrice: 2400000,
    status: 'COMPLETED',
    createdAt: '2026-02-03T16:00:00',
  },
  {
    id: 'b5',
    fieldId: '2',
    customerId: '3',
    customerName: 'Hoàng Văn F',
    date: '2026-02-06',
    startTime: '20:00',
    endTime: '21:00',
    duration: 60,
    totalPrice: 700000,
    status: 'CANCELLED',
    createdAt: '2026-02-04T11:00:00',
    cancelReason: 'Khách hủy do thời tiết xấu',
  },
];

export const mockStaffs: Staff[] = [
  {
    id: '2',
    name: 'Nguyễn Văn A',
    email: 'staff@football.com',
    phone: '0901234567',
    assignedFields: ['1', '2'],
    schedules: [
      { dayOfWeek: 1, startTime: '08:00', endTime: '17:00' },
      { dayOfWeek: 2, startTime: '08:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '08:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '08:00', endTime: '17:00' },
      { dayOfWeek: 5, startTime: '08:00', endTime: '17:00' },
    ],
  },
];

// Utility functions
export function getFieldById(id: string): Field | undefined {
  return mockFields.find((f) => f.id === id);
}

export function getPriceForTimeSlot(fieldId: string, time: string): number {
  const priceSlot = mockPriceSlots.find((ps) => {
    if (ps.fieldId !== fieldId) return false;
    const slotStart = parseInt(ps.startTime.replace(':', ''));
    const slotEnd = parseInt(ps.endTime.replace(':', ''));
    const checkTime = parseInt(time.replace(':', ''));
    return checkTime >= slotStart && checkTime < slotEnd;
  });
  return priceSlot?.price || 0;
}

export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 6; hour < 24; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
}

export const availableTimeSlots = generateTimeSlots();
