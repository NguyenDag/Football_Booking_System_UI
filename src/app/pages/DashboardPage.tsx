import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Building2, Calendar, CheckCircle, Clock, TrendingUp, XCircle } from 'lucide-react';
import { mockBookings, mockFields } from '../data/mockData';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { pitchService, Field as ApiField } from '../api/pitch.service';

export function DashboardPage() {
  const { user } = useAuth();

  const [fields, setFields] = React.useState<ApiField[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchFields = async () => {
      try {
        const data = await pitchService.getAllPitches();
        setFields(data);
      } catch (error) {
        console.error('Failed to fetch fields for dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFields();
  }, []);

  const stats = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    return {
      totalFields: fields.filter(f => f.status === 'ACTIVE').length,
      totalBookings: mockBookings.length,
      pendingBookings: mockBookings.filter(b => b.status === 'PENDING').length,
      confirmedBookings: mockBookings.filter(b => b.status === 'CONFIRMED').length,
      todayBookings: mockBookings.filter(b => b.date === today).length,
      completedBookings: mockBookings.filter(b => b.status === 'COMPLETED').length,
    };
  }, [fields]);

  const recentBookings = mockBookings.slice(0, 5);

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

  const StatCard = ({ title, icon: Icon, value, description, bgColor }: any) => (
    <Card className={`relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all ${bgColor}`}>
      <div className="absolute inset-0 opacity-0 hover:opacity-5 transition-opacity"></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold text-slate-700">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-white/50">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-900">{value}</div>
        <p className="text-xs text-slate-600 mt-1">{description}</p>
      </CardContent>
    </Card>
  );

  if (user?.role === 'ADMIN') {
    return (
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard Admin
          </h1>
          <p className="text-slate-600">Tổng quan toàn bộ hệ thống đặt lịch sân bóng của bạn</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Tổng số sân"
            icon={Building2}
            value={stats.totalFields}
            description="Đang hoạt động"
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
            title="Chờ xác nhận"
            icon={Clock}
            value={stats.pendingBookings}
            description="Cần xử lý"
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

        {/* Recent Bookings */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Đặt lịch gần đây</CardTitle>
            <CardDescription>5 đặt lịch mới nhất trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBookings.map((booking) => {
                const field = fields.find(f => f.id === booking.fieldId);
                return (
                  <div key={booking.id} className="flex items-center justify-between p-4 border border-slate-200/50 rounded-xl hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{field?.name}</p>
                        {getStatusBadge(booking.status)}
                      </div>
                      <p className="text-sm text-slate-600">
                        👤 {booking.customerName} • 📅 {booking.date} • ⏰ {booking.startTime} - {booking.endTime}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-emerald-600 whitespace-nowrap ml-4">
                      {booking.totalPrice.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                );
              })}
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
    const staffBookings = mockBookings; // Fallback: show all bookings for now as assignedFields is missing from API
    const pendingCount = staffBookings.filter(b => b.status === 'PENDING').length;

    return (
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard Nhân viên
          </h1>
          <p className="text-slate-600">Xin chào, {user.fullName}! 👋</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="Booking hôm nay"
            icon={Calendar}
            value={stats.todayBookings}
            description="Đặt lịch trong ngày"
            bgColor="bg-gradient-to-br from-blue-50/80 to-blue-100/50"
          />
          <StatCard
            title="Chờ xác nhận"
            icon={Clock}
            value={pendingCount}
            description="Cần xử lý"
            bgColor="bg-gradient-to-br from-amber-50/80 to-amber-100/50"
          />
          <StatCard
            title="Sân quản lý"
            icon={Building2}
            value={0}
            description="Chưa gán sân"
            bgColor="bg-gradient-to-br from-purple-50/80 to-purple-100/50"
          />
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Booking cần xử lý</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {staffBookings.filter(b => b.status === 'PENDING').map((booking) => {
                const field = fields.find(f => f.id === booking.fieldId);
                return (
                  <div key={booking.id} className="flex items-center justify-between p-4 border border-amber-200/50 bg-amber-50/30 rounded-xl">
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold text-slate-900">{field?.name}</p>
                      <p className="text-sm text-slate-600">
                        👤 {booking.customerName} • 📅 {booking.date} • ⏰ {booking.startTime}
                      </p>
                    </div>
                    <Link to="/bookings">
                      <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-emerald-600">
                        Xử lý
                      </Button>
                    </Link>
                  </div>
                );
              })}
              {staffBookings.filter(b => b.status === 'PENDING').length === 0 && (
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
  const customerBookings = mockBookings.filter(b => b.customerId === user?.userId?.toString());
  const upcomingBookings = customerBookings.filter(b =>
    b.status === 'CONFIRMED' && new Date(b.date) >= new Date()
  );

  return (
    <div className="space-y-8">
      {/* Hero Section */}
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
          value={upcomingBookings.length}
          description="Đặt lịch chưa diễn ra"
          bgColor="bg-gradient-to-br from-emerald-50/80 to-emerald-100/50"
        />
        <StatCard
          title="Tổng booking"
          icon={TrendingUp}
          value={customerBookings.length}
          description="Tất cả lịch của bạn"
          bgColor="bg-gradient-to-br from-blue-50/80 to-blue-100/50"
        />
        <StatCard
          title="Đã hoàn thành"
          icon={CheckCircle}
          value={customerBookings.filter(b => b.status === 'COMPLETED').length}
          description="Đã đá xong"
          bgColor="bg-gradient-to-br from-purple-50/80 to-purple-100/50"
        />
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Lịch đặt sân sắp tới</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingBookings.map((booking) => {
              const field = fields.find(f => f.id === booking.fieldId);
              return (
                <div key={booking.id} className="flex items-center justify-between p-4 border border-emerald-200/50 bg-emerald-50/30 rounded-xl hover:shadow-md transition-shadow">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{field?.name}</p>
                      {getStatusBadge(booking.status)}
                    </div>
                    <p className="text-sm text-slate-600">
                      📅 {booking.date} • ⏰ {booking.startTime} - {booking.endTime}
                    </p>
                  </div>
                  <div className="text-right whitespace-nowrap ml-4">
                    <p className="font-bold text-lg text-emerald-600">
                      {booking.totalPrice.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>
              );
            })}
            {upcomingBookings.length === 0 && (
              <div className="text-center py-16">
                <div className="inline-block p-4 bg-gradient-to-br from-emerald-100 to-purple-100 rounded-full mb-4">
                  <Calendar className="w-12 h-12 text-emerald-600" />
                </div>
                <p className="text-slate-600 mb-4 font-medium">Bạn chưa có lịch đặt sân nào</p>
                <Link to="/book-field">
                  <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
                    🚀 Đặt sân ngay
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
