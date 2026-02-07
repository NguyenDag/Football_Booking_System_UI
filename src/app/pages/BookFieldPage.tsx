import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { CalendarIcon, Clock, MapPin, DollarSign, Zap, Check } from 'lucide-react';
import { mockFields, availableTimeSlots, getPriceForTimeSlot, mockBookings } from '../data/mockData';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useUnsplash } from '../hooks/useUnsplash';

export function BookFieldPage() {
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [startTime, setStartTime] = useState<string>('');
  const [duration, setDuration] = useState<60 | 90 | 120>(90);
  const [note, setNote] = useState('');

  const activeFields = mockFields.filter(f => f.status === 'ACTIVE');

  const calculateEndTime = (start: string, dur: number): string => {
    const [hours, minutes] = start.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + dur;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const calculatePrice = (): number => {
    if (!selectedField || !startTime || !duration) return 0;

    const pricePerHour = getPriceForTimeSlot(selectedField, startTime);
    return Math.round((pricePerHour * duration) / 60);
  };

  const isTimeSlotAvailable = (time: string): boolean => {
    if (!selectedField || !selectedDate) return true;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const endTime = calculateEndTime(time, duration);

    // Check if any booking conflicts with this time slot
    const conflicts = mockBookings.filter(b => {
      if (b.fieldId !== selectedField || b.date !== dateStr) return false;
      if (b.status === 'CANCELLED' || b.status === 'REJECTED') return false;

      // Check time overlap
      const bookingStart = b.startTime;
      const bookingEnd = b.endTime;

      return (
        (time >= bookingStart && time < bookingEnd) ||
        (endTime > bookingStart && endTime <= bookingEnd) ||
        (time <= bookingStart && endTime >= bookingEnd)
      );
    });

    return conflicts.length === 0;
  };

  const handleBooking = () => {
    if (!selectedField || !selectedDate || !startTime) {
      toast.error('Vui lòng chọn đầy đủ thông tin');
      return;
    }

    if (!isTimeSlotAvailable(startTime)) {
      toast.error('Khung giờ này đã được đặt');
      return;
    }

    const totalPrice = calculatePrice();
    const endTime = calculateEndTime(startTime, duration);

    toast.success(
      `Đặt sân thành công!\nTổng tiền: ${totalPrice.toLocaleString('vi-VN')}đ`
    );

    // Reset form
    setSelectedField('');
    setSelectedDate(undefined);
    setStartTime('');
    setDuration(90);
    setNote('');
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
                {activeFields.map((field) => (
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
                ))}
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal h-12 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50"
                    >
                      <CalendarIcon className="mr-2 h-5 w-5 text-emerald-500" />
                      {selectedDate ? (
                        <span className="font-medium">{format(selectedDate, 'PPP', { locale: vi })}</span>
                      ) : (
                        <span className="text-slate-400">Chọn ngày đá</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 shadow-lg border-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Selection */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label className="text-slate-700 font-semibold">⏰ Giờ bắt đầu</Label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger className="h-12 border-slate-200 hover:border-emerald-300">
                      <SelectValue placeholder="Chọn giờ" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimeSlots.map((time) => {
                        const available = isTimeSlotAvailable(time);
                        return (
                          <SelectItem
                            key={time}
                            value={time}
                            disabled={!available}
                          >
                            {time} {!available && '❌ (Đã đặt)'}
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
                disabled={!selectedField || !selectedDate || !startTime}
              >
                🚀 Đặt sân ngay
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
