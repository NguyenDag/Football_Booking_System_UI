import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Calendar, Clock, XCircle, Search, Zap, QrCode, AlertCircle, RefreshCw, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { pitchService, Field as ApiField } from '../api/pitch.service';
import { bookingService, type BookingResponse, type BookingDetailResponse } from '../api/booking.service';
import { paymentService } from '../api/payment.service';
import { walletService } from '../api/wallet.service';

interface FlatBooking extends BookingDetailResponse {
  bookingId: number;
  paymentStatus: string;
  totalPrice: number;
  userId: number;
  createdAt: string;
  note?: string;
  cancellationReason?: string;
}

const ITEMS_PER_PAGE = 6;

const parseUTCDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  if (!dateStr.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'Z');
  }
  return new Date(dateStr);
};

export function MyBookingsPage() {
  const { user } = useAuth();
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000); // Update every second for countdown
    return () => clearInterval(timer);
  }, []);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [upcoming, setUpcoming] = useState<FlatBooking[]>([]);
  const [history, setHistory] = useState<FlatBooking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [cancelDialog, setCancelDialog] = useState<FlatBooking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState<FlatBooking | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{ accountNumber: string; bankName: string; accountName: string } | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'BANK'>('BANK');
  const [isPayingWallet, setIsPayingWallet] = useState(false);

  React.useEffect(() => {
    fetchData();
    fetchPaymentInfo();
  }, []);

  const fetchPaymentInfo = async () => {
    try {
      const info = await paymentService.getPaymentInfo();
      setPaymentInfo(info);
    } catch (error) {
      console.error('Failed to fetch payment info:', error);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const data = await walletService.getMyWallet();
      setWalletBalance(data.balance);
      if (paymentDialog && data.balance >= paymentDialog.totalPrice) {
        setPaymentMethod('WALLET');
      }
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
    }
  };

  const handleWalletPayment = async () => {
    if (!paymentDialog) return;
    try {
      setIsPayingWallet(true);
      await walletService.payBooking(paymentDialog.bookingId);
      toast.success('Thanh toán bằng ví thành công!');
      setPaymentDialog(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Thanh toán thất bại');
    } finally {
      setIsPayingWallet(false);
    }
  };

  React.useEffect(() => {
    if (paymentDialog) {
      fetchWalletBalance();
      // Default to WALLET if enough balance, else BANK
      setPaymentMethod('BANK'); 
    }
  }, [paymentDialog]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [upcomingData, historyData] = await Promise.all([
        bookingService.getUpcomingBookings(),
        bookingService.getHistoryBookings()
      ]);

      setUpcoming(flattenBookings(upcomingData));
      setHistory(flattenBookings(historyData));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const flattenBookings = (bookings: BookingResponse[]): FlatBooking[] => {
    const flat: FlatBooking[] = [];
    bookings.forEach((b: BookingResponse) => {
      b.details.forEach(detail => {
        flat.push({
          ...detail,
          bookingId: b.bookingId,
          paymentStatus: b.paymentStatus,
          totalPrice: b.totalAmount,
          userId: b.userId,
          createdAt: b.createdAt,
          note: b.notes,
          cancellationReason: detail.cancellationReason
        });
      });
    });
    return flat;
  };

  const processList = (list: FlatBooking[]) => {
    let result = [...list];

    // Search
    if (searchTerm) {
      result = result.filter(b => 
        b.pitchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `BK-${b.detailId}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status Filter
    if (statusFilter !== 'ALL') {
      result = result.filter(b => b.status.toUpperCase() === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortConfig.key === 'date') {
        aVal = new Date(a.playDate + 'T' + a.startTime).getTime();
        bVal = new Date(b.playDate + 'T' + b.startTime).getTime();
      } else if (sortConfig.key === 'price') {
        aVal = a.priceAtBooking;
        bVal = b.priceAtBooking;
      } else {
        aVal = a.pitchName;
        bVal = b.pitchName;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  };

  const paginatedList = (list: FlatBooking[]) => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return list.slice(start, start + ITEMS_PER_PAGE);
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortConfig]);

  const stats = useMemo(() => {
    const all = [...upcoming, ...history];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const matchesThisMonth = all.filter(b => {
      const d = new Date(b.playDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const pitchCounts: Record<string, number> = {};
    all.forEach(b => {
      pitchCounts[b.pitchName] = (pitchCounts[b.pitchName] || 0) + 1;
    });

    const favoritePitch = Object.entries(pitchCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Chưa có';

    return { matchesThisMonth, favoritePitch };
  }, [upcoming, history]);

  const handleCancel = async () => {
    if (!cancelDialog) return;

    const bookingDate = new Date(cancelDialog.playDate + 'T' + cancelDialog.startTime);
    const now = new Date();
    const hoursUntil = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil < 6) {
      toast.error('Không thể hủy lịch trước 6 giờ!');
      setCancelDialog(null);
      return;
    }

    try {
      setIsCancelling(true);
      await bookingService.cancelBooking(cancelDialog.detailId, cancelReason || 'Khách hàng hủy');
      toast.success('Đã hủy booking thành công');
      setCancelDialog(null);
      setCancelReason('');
      fetchData(); // Refresh list
    } catch (error: any) {
      toast.error(error.message || 'Hủy thất bại');
    } finally {
      setIsCancelling(false);
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

  const getPaymentBadge = (status: string) => {
    if (status?.toUpperCase() === 'PAID') {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Đã thanh toán</Badge>;
    }
    return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Chờ thanh toán</Badge>;
  };

  const BookingCard = ({ booking }: { booking: FlatBooking }) => {
    const bookingDate = new Date(booking.playDate + 'T' + booking.startTime);
    const canCancel = (booking.status === 'PENDING' || booking.status === 'CONFIRMED') && !booking.cancellationReason;
    const hoursUntil = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Payment Timeout Logic (10 minutes)
    const createdAtDate = parseUTCDate(booking.createdAt);
    const tenMinTimeout = 10 * 60 * 1000;
    const timeSinceCreated = now.getTime() - createdAtDate.getTime();
    const isPaymentExpiring = 
      booking.paymentStatus?.toUpperCase() !== 'PAID' && 
      booking.paymentStatus?.toUpperCase() !== 'REFUNDED' &&
      booking.status?.toUpperCase() === 'PENDING' && 
      timeSinceCreated < tenMinTimeout &&
      !booking.cancellationReason;
    const minsRemaining = Math.max(0, Math.floor((tenMinTimeout - timeSinceCreated) / 60000));
    const secsRemaining = Math.max(0, Math.floor(((tenMinTimeout - timeSinceCreated) % 60000) / 1000));

    // Time Alerts
    const isImminent = hoursUntil > 0 && hoursUntil < 2 && booking.status === 'CONFIRMED'; 
    const isLateConfirmation = hoursUntil > 0 && hoursUntil <= 1 && booking.status === 'PENDING';
    const minsUntilAutoCancel = hoursUntil !== null ? Math.floor(hoursUntil * 60 - 30) : 0;

    let cardBorder = 'border-l-emerald-500';
    if (isImminent) cardBorder = 'border-l-orange-500 animate-pulse-subtle';
    if (isLateConfirmation) cardBorder = 'border-l-red-500 !border-2 !border-red-500/50 shadow-red-100';

    return (
      <Card className={`hover:shadow-lg transition-all duration-300 border-l-4 ${cardBorder}`}>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-800">{booking.pitchName}</h3>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {getStatusBadge(booking.status)}
                    {getPaymentBadge(booking.paymentStatus)}
                    {isImminent && (
                      <Badge className="bg-orange-100 text-orange-600 border-none animate-bounce h-5 px-1.5 py-0 text-[10px] font-bold"> SẮP ĐÁ! </Badge>
                    )}
                    {isLateConfirmation && (
                      <Badge variant="destructive" className="animate-pulse h-5 px-1.5 py-0 text-[10px] whitespace-nowrap"> CHỜ XÁC NHẬN MUỘN! </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">ID: BK-{booking.detailId}</p>
              </div>
              <p className="text-xl font-bold text-green-600">
                {booking.priceAtBooking.toLocaleString('vi-VN')}đ
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-400 font-semibold mb-0.5">Ngày đá</p>
                  <p className="font-medium text-sm">
                    {format(new Date(booking.playDate), 'PPP', { locale: vi })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-400 font-semibold mb-0.5">Thời gian</p>
                  <p className="font-medium text-sm">
                    {booking.startTime.substring(0, 5)} - {booking.endTime.substring(0, 5)}
                  </p>
                </div>
              </div>
            </div>

            {booking.note && (
              <div className="text-sm p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Ghi chú của bạn:</p>
                <p className="text-gray-700">{booking.note}</p>
              </div>
            )}

            {booking.cancellationReason && (
              <div className="text-sm p-3 bg-red-50 rounded-lg border border-red-100/50">
                <p className="text-[10px] uppercase text-red-500 font-semibold mb-1">Lý do hủy/từ chối:</p>
                <p className="text-red-700 italic">{booking.cancellationReason}</p>
              </div>
            )}

            {isPaymentExpiring && (
              <div className="p-3 bg-orange-500 rounded-xl shadow-lg shadow-orange-100 flex items-center justify-between animate-pulse">
                <p className="text-white text-[11px] font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  HẾT HẠN THANH TOÁN SAU:
                </p>
                <div className="bg-white/20 px-2 py-1 rounded text-sm text-white font-black font-mono">
                  {minsRemaining.toString().padStart(2, '0')}:{secsRemaining.toString().padStart(2, '0')}
                </div>
              </div>
            )}

            {isLateConfirmation && !isPaymentExpiring && (
              <div className="text-sm p-4 bg-red-50/80 rounded-xl border border-red-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <p className="text-xs uppercase text-red-600 font-black tracking-tight">Sắp đến giờ đá nhưng chưa được xác nhận</p>
                  </div>
                  {minsUntilAutoCancel > 0 && (
                    <div className="bg-red-600 text-white text-[10px] px-2 py-1 rounded-lg font-black animate-pulse">
                      HỦY SAU: {minsUntilAutoCancel}'
                    </div>
                  )}
                </div>
                <p className="text-red-800 text-[13px] leading-relaxed">
                  Vui lòng liên hệ Hotline: <span className="font-bold underline text-red-900">1900-XXXX</span> ngay để được hỗ trợ, hoặc hủy lịch để tìm sân khác. Hệ thống sẽ tự động hủy và hoàn tiền nếu quá giờ.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="text-[10px] text-gray-400 uppercase font-medium">
                Đặt lúc: {format(parseUTCDate(booking.createdAt), 'HH:mm dd/MM/yyyy')}
              </div>
              <div className="flex items-center gap-2">
                {booking.paymentStatus === 'UNPAID' && (booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                  <Button
                    size="sm"
                    className="h-8 bg-orange-600 hover:bg-orange-700 gap-2 font-semibold shadow-sm"
                    onClick={() => setPaymentDialog(booking)}
                  >
                    <QrCode className="w-4 h-4" />
                    Thanh toán
                  </Button>
                )}
                {booking.status === 'COMPLETED' && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-emerald-100 text-emerald-600 hover:bg-emerald-50 gap-2 font-semibold rounded-lg"
                      onClick={() => navigate(`/book-field?pitchId=${booking.pitchId}`)}
                    >
                      Đặt lại nhanh
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-slate-500 hover:text-emerald-600 gap-2 font-medium"
                      onClick={() => toast.info('Tính năng đánh giá đang được phát triển')}
                    >
                      Đánh giá
                    </Button>
                  </div>
                )}

                {canCancel && (
                  <div className="flex items-center gap-3">
                    {hoursUntil < 6 && (
                      <span className="text-[10px] font-bold text-red-500 uppercase">Hết hạn hủy</span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 gap-2 font-semibold"
                      onClick={() => setCancelDialog(booking)}
                      disabled={hoursUntil < 6}
                    >
                      <XCircle className="w-4 h-4" />
                      Hủy lịch
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const processedUpcoming = processList(upcoming);
  const processedHistory = processList(history);

  const totalUpcomingPages = Math.ceil(processedUpcoming.length / ITEMS_PER_PAGE) || 1;
  const totalHistoryPages = Math.ceil(processedHistory.length / ITEMS_PER_PAGE) || 1;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold italic bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">Lịch đặt sân của tôi</h1>
          <p className="text-gray-600 mt-1">Quản lý và theo dõi các lịch đặt sân của bạn</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-emerald-500/50 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Tìm theo tên sân hoặc mã..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 h-10 w-64 text-sm rounded-xl border border-emerald-100 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all bg-white shadow-sm"
            />
          </div>
          
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-10 px-3 text-sm rounded-xl border border-emerald-100 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-white shadow-sm font-medium text-slate-700"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>

          <select 
            value={`${sortConfig.key}-${sortConfig.direction}`}
            onChange={e => {
              const [key, direction] = e.target.value.split('-');
              setSortConfig({ key, direction: direction as 'asc' | 'desc' });
            }}
            className="h-10 px-3 text-sm rounded-xl border border-emerald-100 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-white shadow-sm font-medium text-slate-700"
          >
            <option value="date-desc">Mới nhất trước</option>
            <option value="date-asc">Cũ nhất trước</option>
            <option value="price-desc">Giá cao đến thấp</option>
            <option value="price-asc">Giá thấp đến cao</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
          <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider mb-1">Trận trong tháng</p>
          <p className="text-4xl font-black mb-2">{stats.matchesThisMonth}</p>
          <div className="h-1 w-12 bg-white/30 rounded-full" />
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Sân yêu thích nhất</p>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <Zap className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-xl font-bold text-slate-800 line-clamp-1">{stats.favoritePitch}</p>
          </div>
        </div>

        <div className="hidden lg:block bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Thành viên</p>
          <p className="text-xl font-bold italic line-clamp-1">{user?.fullName || 'Khách hàng'}</p>
          <p className="text-xs text-emerald-400 mt-1">Hạng Vàng ⭐</p>
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="w-full" onValueChange={() => setCurrentPage(1)}>
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6">
          <TabsTrigger value="upcoming" className="relative h-10 font-semibold">
            Sắp đá
            {upcoming.length > 0 && (
              <Badge className="ml-2 bg-primary/10 text-primary hover:bg-primary/20 border-none px-1.5 py-0 min-w-5 justify-center">
                {upcoming.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="h-10 font-semibold">
            Lịch sử
            {history.length > 0 && (
              <Badge variant="secondary" className="ml-2 px-1.5 py-0 min-w-5 justify-center">
                {history.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 outline-none">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {paginatedList(processedUpcoming).map(booking => (
                  <BookingCard key={booking.detailId} booking={booking} />
                ))}
              </div>

              {totalUpcomingPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8 py-4 border-t border-emerald-50">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-xl border-emerald-100 text-emerald-700 hover:bg-emerald-50"
                  >
                    Trước
                  </Button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalUpcomingPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === p ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-emerald-50'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.min(totalUpcomingPages, p + 1))}
                    disabled={currentPage === totalUpcomingPages}
                    className="rounded-xl border-emerald-100 text-emerald-700 hover:bg-emerald-50"
                  >
                    Sau
                  </Button>
                </div>
              )}
              {upcoming.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed rounded-xl bg-gray-50 items-center justify-center flex flex-col px-4">
                  <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                    <Calendar className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-1">Chưa có lịch sắp tới</h3>
                  <p className="text-gray-500 mb-6 text-sm max-w-xs">Hãy chọn ngay sân bóng ưa thích và tận hưởng những giây phút sảng khoái trên sân!</p>
                  <Button onClick={() => window.location.href = '/book-field'} className="font-semibold shadow-lg shadow-primary/20">
                    Đặt sân ngay
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 outline-none">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {paginatedList(processedHistory).map(booking => (
                  <BookingCard key={booking.detailId} booking={booking} />
                ))}
              </div>

              {totalHistoryPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8 py-4 border-t border-emerald-50">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-xl border-emerald-100 text-emerald-700 hover:bg-emerald-50"
                  >
                    Trước
                  </Button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === p ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-emerald-50'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.min(totalHistoryPages, p + 1))}
                    disabled={currentPage === totalHistoryPages}
                    className="rounded-xl border-emerald-100 text-emerald-700 hover:bg-emerald-50"
                  >
                    Sau
                  </Button>
                </div>
              )}
              {history.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed rounded-xl bg-gray-50 items-center justify-center flex flex-col px-4">
                  <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                    <Calendar className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-1">Chưa có lịch sử đặt sân</h3>
                  <p className="text-gray-500 text-sm">Lịch sử các trận đấu đã hoàn thành hoặc bị hủy sẽ xuất hiện tại đây.</p>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancelDialog} onOpenChange={() => setCancelDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận hủy đặt lịch</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn hủy đặt lịch này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {cancelDialog && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                <p><span className="font-medium">Sân:</span> {cancelDialog.pitchName}</p>
                <p><span className="font-medium">Ngày:</span> {cancelDialog.playDate}</p>
                <p><span className="font-medium">Giờ:</span> {cancelDialog.startTime.substring(0, 5)} - {cancelDialog.endTime.substring(0, 5)}</p>
                <p><span className="font-medium">Tiền:</span> {cancelDialog.priceAtBooking.toLocaleString('vi-VN')}đ</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Lý do hủy (bắt buộc):</label>
              <textarea
                className="w-full min-h-[80px] p-2 border rounded-md text-sm focus:ring-2 focus:ring-red-500 outline-none"
                placeholder="Vui lòng nhập lý do bạn muốn hủy lịch..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <Button
              variant="destructive"
              className="w-full"
              onClick={handleCancel}
              disabled={isCancelling || !cancelReason.trim()}
            >
              {isCancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setCancelDialog(null)} disabled={isCancelling}>
              Giữ lại booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={!!paymentDialog} onOpenChange={() => setPaymentDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Thanh toán đơn hàng</DialogTitle>
            <DialogDescription className="text-center">
              Chọn phương thức thanh toán phù hợp với bạn
            </DialogDescription>
          </DialogHeader>
          
          {paymentDialog && (
            <div className="space-y-4">
              <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="WALLET" className="font-bold gap-2">
                    <Wallet className="w-4 h-4" />
                    Ví của tôi
                  </TabsTrigger>
                  <TabsTrigger value="BANK" className="font-bold gap-2">
                    <QrCode className="w-4 h-4" />
                    Chuyển khoản
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="WALLET" className="space-y-4 outline-none">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center space-y-3">
                    <p className="text-sm text-slate-500 font-medium">Số dư ví hiện tại</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-black text-slate-900">
                        {walletBalance !== null ? walletBalance.toLocaleString('vi-VN') : '...'}
                      </span>
                      <span className="text-sm font-bold text-slate-500">VNĐ</span>
                    </div>
                    <div className="pt-2">
                      <div className="flex justify-between text-sm py-2 border-t border-slate-200/50">
                        <span className="text-slate-500">Số tiền cần thanh toán:</span>
                        <span className="font-bold text-red-600">{paymentDialog.totalPrice.toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  </div>

                  {walletBalance !== null && walletBalance >= paymentDialog.totalPrice ? (
                    <div className="space-y-3">
                      <Button 
                        className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold h-12 shadow-lg shadow-emerald-200 gap-2"
                        onClick={handleWalletPayment}
                        disabled={isPayingWallet}
                      >
                        {isPayingWallet ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        Xác nhận thanh toán ngay
                      </Button>
                      <p className="text-[10px] text-center text-slate-400">
                        * Tiền sẽ được trừ trực tiếp từ số dư ví của bạn.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-3 items-start">
                      <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-orange-700 uppercase">Số dư không đủ</p>
                        <p className="text-xs text-orange-600 leading-relaxed">
                          Vui lòng chọn phương thức <strong>"Chuyển khoản"</strong> để nạp thêm tiền và tự động thanh toán đơn hàng này.
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="BANK" className="space-y-4 outline-none">
                  <div className="flex justify-center bg-white p-4 rounded-xl shadow-inner border">
                    {(() => {
                      const bankMap: Record<string, string> = {
                        'TPBank': 'TPB',
                        'Vietinbank': 'ICB',
                        'VietinBank': 'ICB'
                      };
                      const provider = bankMap[paymentInfo?.bankName || ''] || 'ICB';
                      return (
                        <img 
                          src={`https://img.vietqr.io/image/${provider}-${paymentInfo?.accountNumber || '107600118119'}-compact2.png?amount=${paymentDialog.totalPrice}&addInfo=DH${paymentDialog.bookingId}&accountName=${encodeURIComponent(paymentInfo?.accountName || 'Football Booking')}`}
                          alt="VietQR"
                          className="w-64 h-64 object-contain shadow-sm"
                        />
                      );
                    })()}
                  </div>

                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl text-[13px] border border-slate-100">
                    <div className="flex justify-between pb-1.5 border-b border-slate-200/50">
                      <span className="text-slate-500 italic">Số tiền:</span>
                      <span className="font-black text-emerald-600 underline text-sm">{paymentDialog.totalPrice.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 italic">Nội dung:</span>
                      <span className="font-black text-blue-600 px-2 py-0.5 bg-blue-50 rounded uppercase">DH{paymentDialog.bookingId}</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg flex gap-3 items-start border border-blue-100">
                    <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      Quét mã để nạp tiền vào ví và thanh toán đơn hàng. Hệ thống tự động xác nhận sau 1-2 phút.
                    </p>
                  </div>

                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 font-bold h-11"
                    onClick={async () => {
                      try {
                        setIsSyncing(true);
                        const result = await paymentService.syncSePay();
                        const isPaid = result.paidBookingIds.includes(paymentDialog.bookingId);
                        const isPartial = result.partiallyPaidBookingIds.includes(paymentDialog.bookingId);

                        if (isPaid) {
                          toast.success("Thanh toán thành công! Đơn hàng đã được xác nhận.");
                          await fetchData();
                          setPaymentDialog(null);
                        } else if (isPartial) {
                          toast.warning("Đã ghi nhận giao dịch! Tiền đã vào ví nhưng chưa đủ để thanh toán đơn hàng. Vui lòng nạp thêm.");
                          await fetchData();
                          fetchWalletBalance();
                        } else {
                          toast.info("Chưa tìm thấy giao dịch mới. Vui lòng đợi 1-2 phút.");
                          await fetchData();
                        }
                      } catch (error) {
                        toast.error("Lỗi khi kết nối với máy chủ.");
                      } finally {
                        setIsSyncing(false);
                      }
                    }}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        Đang kiểm tra...
                      </>
                    ) : (
                      'Đã chuyển khoản, kiểm tra ngay'
                    )}
                  </Button>
                </TabsContent>
              </Tabs>

              <Button 
                variant="ghost" 
                className="w-full h-10 text-slate-500 hover:bg-slate-50 rounded-xl" 
                onClick={() => setPaymentDialog(null)}
              >
                Đóng lại
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
