import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Building2, Calendar, CheckCircle, Clock, TrendingUp, ChevronLeft, ChevronRight, Search, Eye, Info } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { pitchService, Field as ApiField } from '../api/pitch.service';
import { dashboardService, DashboardStatsResponse } from '../api/dashboard.service';
import { bookingService, BookingDetailResponse, BookingResponse } from '../api/booking.service';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

interface FlatBooking extends BookingDetailResponse {
  totalPrice: number;
  paymentStatus: string;
  notes?: string;
  createdAt: string;
}

export function DashboardPage() {
  const { user } = useAuth();

  const [cn] = React.useState(() => (...args: any[]) => args.filter(Boolean).join(' ')); // Simple cn helper

  const [fields, setFields] = React.useState<ApiField[]>([]);
  const [statsData, setStatsData] = React.useState<DashboardStatsResponse | null>(null);
  const [bookings, setBookings] = React.useState<FlatBooking[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Interaction states
  const [activeFilter, setActiveFilter] = React.useState<'UPCOMING' | 'TOTAL' | 'COMPLETED'>('UPCOMING');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedBooking, setSelectedBooking] = React.useState<FlatBooking | null>(null);

  const itemsPerPage = 5;

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fieldsData, dashboardData, bookingsRes] = await Promise.all([
        pitchService.getAllPitches(),
        dashboardService.getStats(),
        bookingService.getMyBookings()
      ]);
      setFields(fieldsData);
      setStatsData(dashboardData);

      // Flatten bookings
      const flat: FlatBooking[] = [];
      bookingsRes.forEach((b: BookingResponse) => {
        b.details.forEach((detail: BookingDetailResponse) => {
          flat.push({
            ...detail,
            totalPrice: b.totalAmount,
            paymentStatus: b.paymentStatus,
            notes: b.notes,
            createdAt: b.createdAt
          });
        });
      });
      setBookings(flat);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = React.useMemo(() => {
    return {
      totalFields: fields.filter(f => f.status === 'ACTIVE').length,
      totalBookings: statsData?.totalBookingsCount || 0,
      upcomingConfirmed: statsData?.upcomingConfirmedCount || 0,
      completedBookings: statsData?.completedBookingsCount || 0,
    };
  }, [fields, statsData]);

  const filteredBookings = React.useMemo(() => {
    const now = new Date();
    let result = bookings;
    
    if (activeFilter === 'UPCOMING') {
      result = bookings.filter(b => {
        const bookingDate = new Date(b.playDate + 'T' + b.startTime);
        return b.status.toUpperCase() === 'CONFIRMED' && bookingDate >= now;
      });
    } else if (activeFilter === 'COMPLETED') {
      result = bookings.filter(b => b.status.toUpperCase() === 'COMPLETED');
    }
    
    return result;
  }, [bookings, activeFilter]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage) || 1;
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  const recentBookings = statsData?.upcomingBookings || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      PENDING: { variant: 'outline', label: 'Chờ xác nhận' },
      CONFIRMED: { variant: 'default', label: 'Đã xác nhận' },
      COMPLETED: { variant: 'secondary', label: 'Hoàn thành' },
      CANCELLED: { variant: 'destructive', label: 'Đã hủy' },
      REJECTED: { variant: 'destructive', label: 'Từ chối' },
    };
    const config = variants[status] || variants.PENDING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const StatCard = ({ title, icon: Icon, value, description, bgColor, active, onClick }: any) => (
    <Card 
      className={cn(
        "relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer",
        bgColor,
        active ? "ring-2 ring-emerald-500 ring-offset-2 scale-[1.02]" : "opacity-90 hover:opacity-100"
      )}
      onClick={onClick}
    >
      <div className="absolute inset-0 opacity-0 hover:opacity-5 transition-opacity"></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold text-slate-700">{title}</CardTitle>
        <div className={cn("p-2 rounded-lg", active ? "bg-white" : "bg-white/50")}>
          <Icon className={cn("h-5 w-5", active ? "text-emerald-600" : "text-slate-600")} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-900">{value}</div>
        <p className="text-xs text-slate-600 mt-1">{description}</p>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (user?.role === 'ADMIN') {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard Admin
          </h1>
          <p className="text-slate-600">Tổng quan toàn bộ hệ thống đặt lịch sân bóng của bạn</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Tổng số sân"
            icon={Building2}
            value={stats.totalFields}
            description="Đ đang hoạt động"
            bgColor="bg-gradient-to-br from-emerald-50/80 to-emerald-100/50"
          />
          <StatCard
            title="Tổng booking"
            icon={Calendar}
            value={stats.totalBookings}
            description="Tất cả đặt lịch"
            bgColor="bg-gradient-to-br from-blue-50/80 to-blue-100/50"
          />
          <StatCard
            title="Lịch sắp tới"
            icon={Clock}
            value={stats.upcomingConfirmed}
            description="Đã xác nhận"
            bgColor="bg-gradient-to-br from-amber-50/80 to-amber-100/50"
          />
          <StatCard
            title="Hoàn thành"
            icon={CheckCircle}
            value={stats.completedBookings}
            description="Đã đá xong"
            bgColor="bg-gradient-to-br from-purple-50/80 to-purple-100/50"
          />
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Đặt lịch gần đây</CardTitle>
            <CardDescription>Các đặt lịch mới nhất trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div key={booking.detailId} className="flex items-center justify-between p-4 border border-slate-200/50 rounded-xl hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{booking.pitchName}</p>
                      {getStatusBadge(booking.status)}
                    </div>
                    <p className="text-sm text-slate-600">
                      👤 {booking.customerName} • 📅 {booking.playDate} • ⏰ {booking.startTime.substring(0, 5)} - {booking.endTime.substring(0, 5)}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-emerald-600 whitespace-nowrap ml-4">
                    {booking.price.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              ))}
              {recentBookings.length === 0 && (
                <p className="text-center py-8 text-slate-500">Chưa có đặt lịch nào</p>
              )}
            </div>
            <div className="mt-6">
              <Link to="/bookings" className="block">
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white">
                  Xem tất cả lịch đặt
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.role === 'STAFF') {
    const staffBookings = recentBookings.filter(b => b.status === 'PENDING');

    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard Nhân viên
          </h1>
          <p className="text-slate-600">Xin chào, {user.fullName}! 👋</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="Lịch sắp tới"
            icon={Calendar}
            value={stats.upcomingConfirmed}
            description="Đặt lịch đã xác nhận"
            bgColor="bg-gradient-to-br from-blue-50/80 to-blue-100/50"
          />
          <StatCard
            title="Tổng booking"
            icon={TrendingUp}
            value={stats.totalBookings}
            description="Tất cả đặt lịch"
            bgColor="bg-gradient-to-br from-amber-50/80 to-amber-100/50"
          />
          <StatCard
            title="Sân quản lý"
            icon={Building2}
            value={stats.totalFields}
            description="Đang hoạt động"
            bgColor="bg-gradient-to-br from-purple-50/80 to-purple-100/50"
          />
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Booking cần xử lý (Chờ xác nhận)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {staffBookings.map((booking) => (
                <div key={booking.detailId} className="flex items-center justify-between p-4 border border-amber-200/50 bg-amber-50/30 rounded-xl">
                  <div className="space-y-1 flex-1">
                    <p className="font-semibold text-slate-900">{booking.pitchName}</p>
                    <p className="text-sm text-slate-600">
                      👤 {booking.customerName} • 📅 {booking.playDate} • ⏰ {booking.startTime.substring(0, 5)}
                    </p>
                  </div>
                  <Link to="/bookings">
                    <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-emerald-600">
                      Xử lý
                    </Button>
                  </Link>
                </div>
              ))}
              {staffBookings.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Không có booking cần xử lý 🎉</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Customer Dashboard
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-slate-600">Xin chào, {user?.fullName}! 👋</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Lịch sắp tới"
          icon={Calendar}
          value={stats.upcomingConfirmed}
          description="Đã xác nhận & Sắp diễn ra"
          bgColor="bg-gradient-to-br from-blue-50/80 to-blue-100/50"
          active={activeFilter === 'UPCOMING'}
          onClick={() => setActiveFilter('UPCOMING')}
        />
        <StatCard
          title="Tổng booking"
          icon={TrendingUp}
          value={stats.totalBookings}
          description="Tất cả lịch của bạn"
          bgColor="bg-gradient-to-br from-orange-50/80 to-orange-100/50"
          active={activeFilter === 'TOTAL'}
          onClick={() => setActiveFilter('TOTAL')}
        />
        <StatCard
          title="Đã hoàn thành"
          icon={CheckCircle}
          value={stats.completedBookings}
          description="Đã hoàn thành thi đấu"
          bgColor="bg-gradient-to-br from-emerald-50/80 to-emerald-100/50"
          active={activeFilter === 'COMPLETED'}
          onClick={() => setActiveFilter('COMPLETED')}
        />
      </div>

      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-white border-b px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              {activeFilter === 'UPCOMING' && "Lịch đá sắp tới"}
              {activeFilter === 'TOTAL' && "Tất cả lịch đặt sân"}
              {activeFilter === 'COMPLETED' && "Lịch sử đã hoàn thành"}
            </CardTitle>
            <CardDescription>
              Hiển thị {filteredBookings.length} kết quả
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-white"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-medium min-w-[60px] text-center">
                Trang {currentPage} / {totalPages}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-white"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 border-b uppercase text-[10px] tracking-wider font-bold">
                  <th className="px-6 py-4">Thông tin sân</th>
                  <th className="px-6 py-4">Thời gian đá</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Giá tiền</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedBookings.map((b) => (
                  <tr key={b.detailId} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{b.pitchName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Mã: FB-{b.detailId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                        {format(new Date(b.playDate), 'dd/MM/yyyy')}
                      </div>
                      <div className="flex items-center gap-2 text-slate-50 text-slate-400 text-xs mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        {b.startTime.substring(0, 5)} - {b.endTime.substring(0, 5)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(b.status)}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {b.priceAtBooking.toLocaleString('vi-VN')}₫
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1.5 h-8"
                        onClick={() => setSelectedBooking(b)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Chi tiết
                      </Button>
                    </td>
                  </tr>
                ))}
                {paginatedBookings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                          <Search className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-slate-600 font-semibold italic text-sm">"Danh sách này đang trống..."</p>
                        <Link to="/book-field" className="mt-4">
                          <Button size="sm" variant="outline" className="text-xs border-dashed">
                            Đặt sân mới ngay
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-[425px] overflow-hidden p-0 border-0 shadow-2xl">
          {selectedBooking && (
            <div className="flex flex-col">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
                    {selectedBooking.status}
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold">{selectedBooking.pitchName}</h2>
                <p className="text-emerald-100 flex items-center gap-2 text-sm mt-1">
                  <Info className="w-4 h-4" />
                  Mã đặt sân: #FB-{selectedBooking.detailId}
                </p>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Ngày thi đấu</p>
                    <p className="font-semibold text-slate-900 flex items-center gap-2">
                       {format(new Date(selectedBooking.playDate), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Khung giờ</p>
                    <p className="font-semibold text-slate-900 flex items-center gap-2">
                       {selectedBooking.startTime.substring(0, 5)} - {selectedBooking.endTime.substring(0, 5)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Giá đặt sân</span>
                    <span className="font-bold text-slate-900">{selectedBooking.priceAtBooking.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Thời lượng</span>
                    <span className="font-bold text-slate-900">{selectedBooking.durationMinutes} phút</span>
                  </div>
                  <div className="pt-3 border-t flex justify-between items-center">
                    <span className="text-slate-900 font-bold">Tổng thanh toán</span>
                    <span className="text-xl font-black text-emerald-600">{selectedBooking.totalPrice.toLocaleString('vi-VN')}₫</span>
                  </div>
                </div>

                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
                   <p className="text-[10px] text-amber-600 uppercase font-bold tracking-wider mb-2">Ghi chú đặt lịch</p>
                   <p className="text-sm text-slate-600 italic">
                      {selectedBooking.notes || "Không có ghi chú nào từ bạn."}
                   </p>
                </div>

                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200" onClick={() => setSelectedBooking(null)}>
                  Đã hiểu
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
