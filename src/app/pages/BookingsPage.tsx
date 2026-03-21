import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Calendar as CalendarIcon, Check, X, Filter, Search, RotateCcw } from 'lucide-react';
import { bookingService, type BookingResponse, type BookingDetailResponse } from '../api/booking.service';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function BookingsPage() {
  const { user } = useAuth();
  const [dailyBookings, setDailyBookings] = useState<BookingResponse[]>([]);
  const [pendingBookings, setPendingBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<BookingDetailResponse | null>(null);
  const [actionDialog, setActionDialog] = useState<'confirm' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [daily, pending] = await Promise.all([
        bookingService.getStaffDailyBookings(selectedDate),
        bookingService.getStaffPendingBookings()
      ]);
      setDailyBookings(daily);
      setPendingBookings(pending);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('Không thể tải danh sách đặt sân');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedBookingDetail) return;

    try {
      await bookingService.confirmBooking(selectedBookingDetail.detailId);
      toast.success('Đã xác nhận booking');
      fetchData();
      setActionDialog(null);
      setSelectedBookingDetail(null);
    } catch (error) {
      toast.error('Xác nhận thất bại');
    }
  };

  const handleReject = async () => {
    if (!selectedBookingDetail || !rejectReason) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      await bookingService.rejectBooking(selectedBookingDetail.detailId, rejectReason);
      toast.success('Đã từ chối booking');
      fetchData();
      setActionDialog(null);
      setSelectedBookingDetail(null);
      setRejectReason('');
    } catch (error) {
      toast.error('Từ chối thất bại');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      PENDING: { variant: 'outline', label: 'Chờ xác nhận' },
      CONFIRMED: { variant: 'default', label: 'Đã xác nhận' },
      COMPLETED: { variant: 'secondary', label: 'Hoàn thành' },
      CANCELLED: { variant: 'destructive', label: 'Đã hủy' },
      REJECTED: { variant: 'destructive', label: 'Từ chối' },
    };
    const config = variants[status?.toUpperCase()] || variants.PENDING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const BookingCard = ({ booking }: { booking: BookingResponse }) => {
    const detail = booking.details[0]; // Assuming for display we show first detail
    const canManage = user?.role === 'ADMIN' || user?.role === 'STAFF';

    return (
      <div className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-lg">{detail?.pitchName || 'Sân bóng'}</p>
              {getStatusBadge(detail?.status || booking.status)}
            </div>
            <p className="text-xs text-gray-500 font-mono uppercase">Mã: BK-{booking.bookingId}</p>
          </div>
          <p className="text-xl font-bold text-green-600">
            {booking.totalAmount.toLocaleString('vi-VN')}đ
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-2 border-y border-gray-50">
          <div>
            <p className="text-[10px] uppercase text-gray-400 font-semibold mb-0.5">Khách hàng</p>
            <p className="font-medium text-sm">USER-{booking.userId}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-gray-400 font-semibold mb-0.5">Ngày đá</p>
            <p className="font-medium text-sm">{detail?.playDate}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-gray-400 font-semibold mb-0.5">Thời gian</p>
            <p className="font-medium text-sm">{detail?.startTime.substring(0, 5)} - {detail?.endTime.substring(0, 5)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-gray-400 font-semibold mb-0.5">Thời lượng</p>
            <p className="font-medium text-sm">{detail?.durationMinutes} phút</p>
          </div>
        </div>

        {booking.notes && (
          <div className="text-sm bg-gray-50 p-2 rounded">
            <p className="text-xs text-gray-500 font-semibold">Ghi chú:</p>
            <p className="text-gray-700">{booking.notes}</p>
          </div>
        )}

        {detail?.cancellationReason && (
          <div className="text-sm bg-red-50 p-2 rounded">
            <p className="text-xs text-red-500 font-semibold">Lý do hủy:</p>
            <p className="text-red-700 italic">{detail.cancellationReason}</p>
          </div>
        )}

        {canManage && (detail?.status === 'PENDING') && (
          <div className="flex gap-3 pt-3">
            <Button
              size="sm"
              className="flex-1 h-9 gap-2 font-semibold"
              onClick={() => {
                setSelectedBookingDetail(detail);
                setActionDialog('confirm');
              }}
            >
              <Check className="w-4 h-4" />
              Xác nhận
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-9 gap-2 font-semibold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => {
                setSelectedBookingDetail(detail);
                setActionDialog('reject');
              }}
            >
              <X className="w-4 h-4" />
              Từ chối
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Quản lý đặt lịch</h1>
        <p className="text-gray-600 mt-1">Xem và xử lý các đặt lịch sân</p>
      </div>

      {/* Search and Date Picker */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tìm kiếm nhanh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm theo ID hoặc khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Chọn ngày xem lịch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))} title="Hôm nay">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Tabs */}
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6">
          <TabsTrigger value="daily" className="relative">
            Lịch sân ngày {format(new Date(selectedDate), 'dd/MM')}
            {dailyBookings.length > 0 && (
              <Badge className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-1.5 py-0 min-w-5 justify-center">
                {dailyBookings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Chờ xử lý
            {pendingBookings.length > 0 && (
              <Badge variant="destructive" className="ml-2 px-1.5 py-0 min-w-5 justify-center">
                {pendingBookings.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4 mt-2">
          {loading ? (
             <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {dailyBookings
                .filter(b => b.bookingId.toString().includes(searchTerm) || b.userId.toString().includes(searchTerm))
                .map(booking => (
                  <BookingCard key={booking.bookingId} booking={booking} />
                ))}
              {dailyBookings.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed rounded-xl bg-gray-50">
                  <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Không có lịch đặt trong ngày này</p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-2">
           {loading ? (
             <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {pendingBookings
                .filter(b => b.bookingId.toString().includes(searchTerm) || b.userId.toString().includes(searchTerm))
                .map(booking => (
                  <BookingCard key={booking.bookingId} booking={booking} />
                ))}
              {pendingBookings.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed rounded-xl bg-gray-50">
                  <Check className="w-12 h-12 text-green-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Tuyệt vời! Không còn booking nào chờ xử lý</p>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirm Dialog */}
      <Dialog open={actionDialog === 'confirm'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận booking</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xác nhận đặt sân lúc <strong>{selectedBookingDetail?.startTime.substring(0, 5)}</strong> ngày <strong>{selectedBookingDetail?.playDate}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setActionDialog(null)}>
              Hủy
            </Button>
            <Button className="flex-1" onClick={handleConfirm}>
              Xác nhận ngay
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={actionDialog === 'reject'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối booking</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối để thông báo cho khách hàng
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs font-bold uppercase text-gray-500">Lý do từ chối</Label>
              <Textarea
                placeholder="VD: Sân đang bảo trì, thời tiết xấu..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="mt-1.5"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setActionDialog(null)}>
                Quay lại
              </Button>
              <Button className="flex-1" variant="destructive" onClick={handleReject}>
                Gửi từ chối
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
