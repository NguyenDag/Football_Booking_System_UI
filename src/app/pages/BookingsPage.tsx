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
  const [pendingBookings, setPendingBookings] = useState<BookingResponse[]>([]);
  const [allBookings, setAllBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<BookingDetailResponse | null>(null);
  const [actionDialog, setActionDialog] = useState<'confirm' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const activeBookings = React.useMemo(() => {
    let base = activeTab === 'pending' ? pendingBookings : allBookings;
    const term = searchTerm.toLowerCase();
    
    if (term) {
      base = base.filter(b => 
        b.bookingId.toString().includes(term) ||
        (b.customerName && b.customerName.toLowerCase().includes(term)) ||
        (b.customerPhone && b.customerPhone.includes(term))
      );
    }
    return base;
  }, [activeTab, pendingBookings, allBookings, searchTerm]);

  const totalPages = Math.ceil(activeBookings.length / itemsPerPage) || 1;
  const paginatedBookings = activeBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pending, all] = await Promise.all([
        bookingService.getStaffPendingBookings(),
        bookingService.getStaffAllBookings(selectedDate)
      ]);
      setPendingBookings(pending);
      setAllBookings(all);
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
            <p className="font-medium text-sm">
              {booking.customerName || `USER-${booking.userId}`}
              {booking.customerPhone && <span className="ml-1 text-gray-400 font-mono text-xs">({booking.customerPhone})</span>}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-gray-400 font-semibold mb-0.5">Ngày đá</p>
            <p className="font-medium text-sm">{detail?.playDate ? format(new Date(detail.playDate), 'dd/MM/yyyy') : 'N/A'}</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md border-emerald-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-600" />
              Chọn ngày xem lịch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setSelectedDate('')}
                title="Xem tất cả"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Tìm kiếm nhanh
            </CardTitle>
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
      </div>

      {/* Bookings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto mb-6">
          <TabsTrigger value="all" className="relative">
            Tất cả lịch
            {allBookings.length > 0 && (
              <Badge variant="outline" className="ml-2 px-1.5 py-0 min-w-5 justify-center">
                {allBookings.length}
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



        <TabsContent value="pending" className="space-y-4 mt-2">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {activeTab === 'pending' && paginatedBookings.map(booking => (
                <BookingCard key={booking.bookingId} booking={booking} />
              ))}
              {activeTab === 'pending' && activeBookings.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed rounded-xl bg-gray-50">
                  <Check className="w-12 h-12 text-green-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Tuyệt vời! Không còn booking nào chờ xử lý</p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-2">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {activeTab === 'all' && paginatedBookings.map(booking => (
                <BookingCard key={booking.bookingId} booking={booking} />
              ))}
              {activeTab === 'all' && activeBookings.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed rounded-xl bg-gray-50">
                  <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Chưa có dữ liệu đặt sân nào</p>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {!loading && activeBookings.length > itemsPerPage && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            Hiển thị trang <span className="font-medium text-slate-900">{currentPage}</span> / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={actionDialog === 'confirm'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận booking</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xác nhận đặt sân lúc <strong>{selectedBookingDetail?.startTime.substring(0, 5)}</strong> ngày <strong>{selectedBookingDetail?.playDate ? format(new Date(selectedBookingDetail.playDate), 'dd/MM/yyyy') : 'N/A'}</strong>?
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
