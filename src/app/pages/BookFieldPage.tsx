import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { CalendarIcon, Clock, MapPin, DollarSign, Zap, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useUnsplash } from '../hooks/useUnsplash';
import { pitchService, Field as ApiField } from '../api/pitch.service';
import { bookingService, AvailabilitySlot } from '../api/booking.service';
import { bookingService, type BookingDetailResponse, type BookingResponse } from '../api/booking.service';

export function BookFieldPage() {
  const [fields, setFields] = useState<ApiField[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [startTime, setStartTime] = useState<string>('');
  const [duration, setDuration] = useState<60 | 90 | 120>(90);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [existingBookings, setExistingBookings] = useState<BookingDetailResponse[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    if (selectedField && selectedDate) {
      fetchAvailability();
    } else {
      setAvailableSlots([]);
    }
    // Reset start time when field or date changes
    setStartTime('');
  }, [selectedField, selectedDate]);

  const fetchAvailability = async () => {
    try {
      setLoadingSlots(true);
      const dateStr = format(selectedDate!, 'yyyy-MM-dd');
      const slots = await bookingService.getAvailability(parseInt(selectedField), dateStr);
      setAvailableSlots(slots);
    } catch (error: any) {
      console.error('Failed to fetch availability:', error);
      toast.error('Không thể tải lịch trống cho ngày này');
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (selectedField && selectedDate) {
      fetchExistingBookings();
    }
  }, [selectedField, selectedDate]);

  const fetchExistingBookings = async () => {
    try {
      setIsCheckingAvailability(true);
      const data = await bookingService.getPitchBookingsByDate(
        parseInt(selectedField),
        format(selectedDate!, 'yyyy-MM-dd')
      );
      // Flatten
      const details: BookingDetailResponse[] = [];
      data.forEach(b => details.push(...b.details));
      setExistingBookings(details);
    } catch (error) {
      console.error('Failed to fetch existing bookings:', error);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const fetchFields = async () => {
    try {
      setLoading(true);
      const data = await pitchService.getAllPitches();
      setFields(data);
    } catch (error: any) {
      toast.error('Không thể tải danh sách sân');
    } finally {
      setLoading(false);
    }
  };

  const activeFields = fields.filter(f => f.status === 'ACTIVE');

  // Use available slots from backend
  const getAvailableTimeSlots = (): string[] => {
    return availableSlots.map(s => s.startTime.substring(0, 5));
  };

  const calculateEndTime = (start: string, dur: number): string => {
    const [hours, minutes] = start.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + dur;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const calculatePrice = (): number => {
    if (!selectedField || !startTime || !duration || availableSlots.length === 0) return 0;

    // We need to calculate price based on all 30-min blocks covered by the duration
    const startIdx = availableSlots.findIndex(s => s.startTime.startsWith(startTime));
    if (startIdx === -1) return 0;

    const blocksNeeded = duration / 30;
    let totalPrice = 0;

    for (let i = 0; i < blocksNeeded; i++) {
      const slot = availableSlots[startIdx + i];
      if (!slot) return 0; // Duration extends beyond available slots
      totalPrice += slot.price;
    }

    return totalPrice;
  };

  const isTimeSlotAvailable = (time: string): boolean => {
    if (!selectedField || !selectedDate || availableSlots.length === 0) return true;
    if (!selectedField || !selectedDate || isCheckingAvailability) return true;

    const startIdx = availableSlots.findIndex(s => s.startTime.startsWith(time));
    if (startIdx === -1) return false;

    const blocksNeeded = duration / 30;

    // Check if ALL blocks needed for the duration are available
    for (let i = 0; i < blocksNeeded; i++) {
      const slot = availableSlots[startIdx + i];
      if (!slot || !slot.isAvailable) return false;
    }
    const endTime = calculateEndTime(time, duration);

    // Check if any booking conflicts with this time slot
    const conflicts = existingBookings.filter(b => {
      // Check time overlap
      const bookingStart = b.startTime.substring(0, 5);
      const bookingEnd = b.endTime.substring(0, 5);

      return (
        (time >= bookingStart && time < bookingEnd) ||
        (endTime > bookingStart && endTime <= bookingEnd) ||
        (time <= bookingStart && endTime >= bookingEnd)
      );
    });

    return true;
  };

  const handleBooking = async () => {
    if (!selectedField || !selectedDate || !startTime) {
      toast.error('Vui lòng chọn đầy đủ thông tin');
      return;
    }

    if (!isTimeSlotAvailable(startTime)) {
      toast.error('Khung giờ này đã được đặt');
      return;
    }

    try {
      setIsSubmitting(true);
      const totalPrice = calculatePrice();

      const request = {
        pitchId: parseInt(selectedField),
        playDate: format(selectedDate, 'yyyy-MM-dd'),
        startTime: `${startTime}:00`, // Format to hh:mm:ss for backend TimeSpan
        durationMinutes: duration,
        notes: note
      };

      await bookingService.createBooking(request);

      toast.success(
        `Đặt sân thành công!\nTổng tiền: ${totalPrice.toLocaleString('vi-VN')}đ`
      );

      // Reset form
      setSelectedField('');
      setSelectedDate(undefined);
      setStartTime('');
      setDuration(90);
      setNote('');
    } catch (error: any) {
      toast.error(error.message || 'Đặt sân thất bại, vui lòng thử lại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedFieldData = activeFields.find(f => f.id === selectedField);
  const totalPrice = calculatePrice();
  const endTime = startTime ? calculateEndTime(startTime, duration) : '';

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
          ⚽ Đặt sân bóng yêu thích
        </h1>
        <p className="text-slate-600">Chọn sân, ngày giờ và bắt đầu trận đấu của bạn ngay</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Booking Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Select Field */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-500" />
                Chọn sân phù hợp
              </CardTitle>
              <CardDescription>Duyệt qua danh sách sân có sẵn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {loading ? (
                  <div className="col-span-full flex flex-col items-center py-10 space-y-3">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    <p className="text-sm text-slate-500">Đang tải danh sách sân...</p>
                  </div>
                ) : activeFields.length === 0 ? (
                  <div className="col-span-full text-center py-10 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-500">Không có sân nào sẵn sàng</p>
                  </div>
                ) : (
                  activeFields.map((field) => (
                    <div
                      key={field.id}
                      onClick={() => setSelectedField(field.id)}
                      className={`relative overflow-hidden rounded-xl p-4 cursor-pointer transition-all transform hover:scale-105 ${selectedField === field.id
                        ? 'border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100/50 ring-2 ring-emerald-400 shadow-lg'
                        : 'border-2 border-slate-200 hover:border-emerald-300 hover:shadow-md'
                        }`}
                    >
                      {selectedField === field.id && (
                        <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                      <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg overflow-hidden mb-3 shadow-md">
                        <FieldImage query={field.image} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-slate-900">{field.name}</h3>
                          <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                            {field.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">{field.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Select Date & Time */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-purple-500" />
                Chọn ngày giờ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Picker */}
              <div className="space-y-3">
                <Label className="text-slate-700 font-semibold">📅 Ngày đá</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const val = e.target.value;
                      setSelectedDate(val ? new Date(val) : undefined);
                    }}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="h-12 border-slate-200 hover:border-emerald-300 focus:border-emerald-400 pl-11 text-base font-medium transition-all"
                  />
                  <CalendarIcon className="absolute left-3.5 top-3.5 h-5 w-5 text-emerald-500 pointer-events-none" />
                  <div className="absolute right-3.5 top-3.5 text-xs text-slate-400 pointer-events-none font-medium uppercase tracking-wider">
                    {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Chọn ngày'}
                  </div>
                </div>
              </div>

              {/* Time Selection */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label className="text-slate-700 font-semibold">⏰ Giờ bắt đầu</Label>
                  <Select value={startTime} onValueChange={setStartTime} disabled={loadingSlots || !selectedDate}>
                    <SelectTrigger className="h-12 border-slate-200 hover:border-emerald-300">
                      <SelectValue placeholder={loadingSlots ? "Đang tải lịch..." : "Chọn giờ"} />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableTimeSlots().map((time) => {
                        const available = isTimeSlotAvailable(time);
                        return (
                          <SelectItem
                            key={time}
                            value={time}
                            disabled={!available}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{time}</span>
                              {!available && <span className="ml-2 text-[10px] text-red-500 font-bold uppercase">Hết chỗ</span>}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-slate-700 font-semibold">⏱️ Thời lượng</Label>
                  <Select
                    value={duration.toString()}
                    onValueChange={(value) => setDuration(parseInt(value) as 60 | 90 | 120)}
                  >
                    <SelectTrigger className="h-12 border-slate-200 hover:border-emerald-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">60 phút</SelectItem>
                      <SelectItem value="90">90 phút (Phổ biến ⭐)</SelectItem>
                      <SelectItem value="120">120 phút</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {startTime && (
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-purple-50 rounded-xl border border-emerald-200/50">
                  <p className="text-sm text-slate-600 mb-1">Thời gian đặt sân:</p>
                  <p className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
                    {startTime} - {endTime} ({duration} phút)
                  </p>
                </div>
              )}

              {/* Note */}
              <div className="space-y-3">
                <Label className="text-slate-700 font-semibold">📝 Ghi chú (không bắt buộc)</Label>
                <Textarea
                  placeholder="VD: Cần chuẩn bị bóng xịn, áo bộ..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="border-slate-200 hover:border-emerald-300 focus:border-emerald-400 rounded-lg resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Summary */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-xl sticky top-24 bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-purple-600 text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Thông tin đặt sân
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {selectedFieldData && (
                <div className="space-y-4">
                  {/* Field Info */}
                  <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200/50">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-600 font-semibold uppercase">Sân được chọn</p>
                        <p className="font-bold text-slate-900">{selectedFieldData.name}</p>
                        <p className="text-xs text-slate-600 mt-1">
                          Sân {selectedFieldData.type} người
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Date Info */}
                  {selectedDate && (
                    <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200/50">
                      <div className="flex items-start gap-3">
                        <CalendarIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-slate-600 font-semibold uppercase">Ngày</p>
                          <p className="font-bold text-slate-900">
                            {format(selectedDate, 'EEEE', { locale: vi })}, {format(selectedDate, 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Time Info */}
                  {startTime && (
                    <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-200/50">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-slate-600 font-semibold uppercase">Thời gian</p>
                          <p className="font-bold text-slate-900">
                            {startTime} - {endTime}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">{duration} phút</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                        <span className="text-sm text-slate-600 font-semibold">Tổng tiền</span>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-transparent bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text">
                          {totalPrice.toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!selectedFieldData && (
                <div className="text-center py-8 text-slate-500">
                  <Zap className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="font-medium">Chọn sân để xem chi tiết</p>
                </div>
              )}

              <Button
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                size="lg"
                onClick={handleBooking}
                disabled={!selectedField || !selectedDate || !startTime || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>🚀 Đặt sân ngay</>
                )}
              </Button>

              <div className="space-y-2 text-xs text-slate-600 bg-slate-50/50 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Hủy miễn phí trước 6 giờ</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Đến sớm 10-15 phút</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Hotline: 1900-xxxx</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FieldImage({ query }: { query: string }) {
  const imageUrl = useUnsplash(query);
  return (
    <ImageWithFallback
      src={imageUrl}
      alt="Football field"
      className="w-full h-full object-cover"
    />
  );
}
