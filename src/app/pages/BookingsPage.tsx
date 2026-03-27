import React, { useState, useEffect } from 'react';
// Simple cn helper for conditional classes
const cn = (...args: (string | boolean | undefined)[]) => args.filter(Boolean).join(' ');
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
import { pitchService, type Field } from '../api/pitch.service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { signalRService } from '../api/signalr.service';

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
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [pitchFilter, setPitchFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('NEWEST');
  const [pitches, setPitches] = useState<Field[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    signalRService.startConnection();

    const handleNewBooking = (booking: BookingResponse) => {
      toast.info(`🔔 Booking mới từ khách hàng ${booking.customerName || 'vãng lai'}!`, {
        description: `Sân: ${booking.details[0]?.pitchName || 'Sân bóng'} - ${booking.totalAmount.toLocaleString()}đ`,
        duration: 8000
      });
      fetchData(); // Full refresh to ensure consistency
    };

    const handleStatusUpdate = () => {
      fetchData();
    };

    signalRService.on('NewBooking', handleNewBooking);
    signalRService.on('BookingStatusChanged', handleStatusUpdate);

    return () => {
      signalRService.off('NewBooking', handleNewBooking);
      signalRService.off('BookingStatusChanged', handleStatusUpdate);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const activeBookings = React.useMemo(() => {
    let base = allBookings;

    if (activeTab === 'pending') {
      base = pendingBookings;
    } else if (activeTab === 'urgent') {
      base = pendingBookings.filter(b => {
        const detail = b.details[0];
        if (!detail) return false;
        const bookingDate = new Date(detail.playDate + 'T' + detail.startTime);
        const hoursUntil = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursUntil > 0 && hoursUntil <= 2;
      });
    }

    // Filter by Status
    if (statusFilter !== 'ALL') {
      base = base.filter(b => b.status === statusFilter);
    }

    // Filter by Pitch
    if (pitchFilter !== 'ALL') {
      base = base.filter(b => b.details.some(d => d.pitchId.toString() === pitchFilter));
    }

    // Search
    const term = searchTerm.toLowerCase();
    if (term) {
      base = base.filter(b =>
        b.bookingId.toString().includes(term) ||
        (b.customerName && b.customerName.toLowerCase().includes(term)) ||
        (b.customerPhone && b.customerPhone.includes(term))
      );
    }

    // Sort
    const sorted = [...base].sort((a, b) => {
      switch (sortBy) {
        case 'NEWEST':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'OLDEST':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'PRICE_DESC':
          return b.totalAmount - a.totalAmount;
        case 'PRICE_ASC':
          return a.totalAmount - b.totalAmount;
        case 'PLAY_DATE':
          const dateA = a.details[0] ? new Date(a.details[0].playDate + 'T' + a.details[0].startTime).getTime() : 0;
          const dateB = b.details[0] ? new Date(b.details[0].playDate + 'T' + b.details[0].startTime).getTime() : 0;
          return dateA - dateB;
        default:
          return 0;
      }
    });

    return sorted;
  }, [activeTab, pendingBookings, allBookings, searchTerm, statusFilter, pitchFilter, sortBy, now]);

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

  const fetchPitches = async () => {
    try {
      const data = await pitchService.getAllPitches();
      setPitches(data);
    } catch (error) {
      console.error('Failed to fetch pitches:', error);
    }
  };

  useEffect(() => {
    fetchPitches();
  }, []);

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

    const bookingDate = detail ? new Date(detail.playDate + 'T' + detail.startTime) : null;
    const hoursUntil = bookingDate ? (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60) : null;
    const isLate = detail?.status === 'PENDING' && hoursUntil !== null && hoursUntil > 0 && hoursUntil <= 1;
    const minsUntilAutoCancel = hoursUntil !== null ? Math.floor(hoursUntil * 60 - 30) : 0;

    return (
      <div className={cn(
        "border rounded-lg p-4 space-y-3 transition-all",
        isLate ? "border-red-400 bg-red-50 ring-2 ring-red-100 shadow-lg shadow-red-100/50 animate-pulse-subtle" : "bg-white shadow-sm border-gray-200"
      )}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-lg text-slate-900">{detail?.pitchName || 'Sân bóng'}</p>
              {getStatusBadge(detail?.status || booking.status)}
              {isLate && (
                <Badge variant="destructive" className="animate-bounce h-5 px-1.5 py-0 text-[10px] font-black uppercase shadow-sm">Khẩn cấp</Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 font-mono uppercase">Mã: BK-{booking.bookingId}</p>
          </div>
          <p className="text-xl font-black text-emerald-600">
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
          <div className="text-sm bg-red-50 p-3 rounded-lg border border-red-100">
            <p className="text-[10px] uppercase text-red-500 font-bold mb-1">Lý do hủy:</p>
            <p className="text-red-700 italic text-xs">{detail.cancellationReason}</p>
          </div>
        )}

        {isLate && (
          <div className="p-3 bg-red-600 rounded-xl shadow-lg shadow-red-200 flex items-center justify-between">
            <p className="text-white text-xs font-bold flex items-center gap-2">
              <X className="w-4 h-4" />
              SẮP QUÁ HẠN: Cần xử lý ngay!
            </p>
            {minsUntilAutoCancel > 0 && (
              <div className="bg-white/20 px-2 py-1 rounded text-[10px] text-white font-black uppercase">
                Hủy sau: {minsUntilAutoCancel}'
              </div>
            )}
            {minsUntilAutoCancel <= 0 && (
              <div className="bg-white/20 px-2 py-1 rounded text-[10px] text-white font-black uppercase">
                Sắp bị hủy!
              </div>
            )}
          </div>
        )}

        {canManage && (detail?.status === 'PENDING' || detail?.status === 'CONFIRMED') && (
          <div className="flex gap-3 pt-3">
            {detail?.status === 'PENDING' && (
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
            )}
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
              {detail?.status === 'CONFIRMED' ? 'Hủy & Hoàn tiền' : 'Từ chối'}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-emerald-100">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
              <CalendarIcon className="w-3 h-3" /> Ngày đá
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9 text-xs"
              />
              {selectedDate && (
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setSelectedDate('')}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
              <Search className="w-3 h-3" /> Tìm kiếm
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                placeholder="ID, tên, SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
              <Filter className="w-3 h-3" /> Bộ lọc & Sắp xếp
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="grid grid-cols-3 gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value="PENDING">Chờ xác nhận</SelectItem>
                  <SelectItem value="CONFIRMED">Đã xác nhận</SelectItem>
                  <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                  <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                  <SelectItem value="REJECTED">Từ chối</SelectItem>
                </SelectContent>
              </Select>

              <Select value={pitchFilter} onValueChange={setPitchFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Sân bóng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả sân</SelectItem>
                  {pitches.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEWEST">Mới nhất</SelectItem>
                  <SelectItem value="OLDEST">Cũ nhất</SelectItem>
                  <SelectItem value="PLAY_DATE">Ngày đá gần nhất</SelectItem>
                  <SelectItem value="PRICE_DESC">Giá cao nhất</SelectItem>
                  <SelectItem value="PRICE_ASC">Giá thấp nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8 bg-slate-100/50 p-1 rounded-xl">
          <TabsTrigger value="all" className="relative h-10 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Tất cả
            {activeTab !== 'all' && allBookings.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full font-medium">{allBookings.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending" className="relative h-10 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Chờ xử lý
            {pendingBookings.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">{pendingBookings.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="urgent" className="relative h-10 rounded-lg text-red-500 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-red-600">
            Ưu tiên 🔥
            {pendingBookings.filter(b => {
              const d = b.details[0];
              if (!d) return false;
              const date = new Date(d.playDate + 'T' + d.startTime);
              const hrs = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
              return hrs > 0 && hrs <= 2;
            }).length > 0 && (
                <span className="ml-1.5 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full animate-pulse">
                  {pendingBookings.filter(b => {
                    const d = b.details[0];
                    if (!d) return false;
                    const date = new Date(d.playDate + 'T' + d.startTime);
                    const hrs = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
                    return hrs > 0 && hrs <= 2;
                  }).length}
                </span>
              )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="urgent" className="space-y-4 mt-2">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'urgent' && paginatedBookings.map(booking => (
                <BookingCard key={booking.bookingId} booking={booking} />
              ))}
              {activeTab === 'urgent' && activeBookings.length === 0 && (
                <div className="text-center py-24 border-2 border-dashed rounded-2xl bg-slate-50 border-slate-200">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <p className="text-slate-900 font-bold text-lg">Hệ thống đang an toàn!</p>
                  <p className="text-slate-500 text-sm mt-1">Không có booking nào sắp hết hạn xác nhận.</p>
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
