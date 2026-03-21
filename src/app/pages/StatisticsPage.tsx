import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import { dashboardService, type AdminAdvancedStatsResponse } from '../api/dashboard.service';
import { toast } from 'sonner';
import { format, subMonths } from 'date-fns';

export function StatisticsPage() {
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<AdminAdvancedStatsResponse | null>(null);

  React.useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getAdminStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  const statusData = React.useMemo(() => {
    if (!stats) return [];
    // Note: statusCounts was in mock, but AdminAdvancedStatsResponse has totalBookings and cancellationRate
    // For a better UI, we can calculate some generic distribution or wait for better BE stats.
    // However, for now, let's use what we have or adapt.
    // The previous mock had: PENDING, CONFIRMED, COMPLETED, CANCELLED, REJECTED.
    // Let's stick to simple ones for now.
    return [
      { name: 'Hoàn thành', value: stats.totalBookings - Math.round(stats.totalBookings * stats.cancellationRate / 100), color: '#3b82f6' },
      { name: 'Đã hủy/từ chối', value: Math.round(stats.totalBookings * stats.cancellationRate / 100), color: '#ef4444' },
    ];
  }, [stats]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const avgPrice = stats.totalBookings > 0 ? stats.totalRevenue / stats.totalBookings : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Thống kê & Báo cáo</h1>
        <p className="text-gray-600 mt-1">Phân tích doanh thu và hoạt động hệ thống</p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu hoàn thành</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalRevenue.toLocaleString('vi-VN')}đ
            </div>
            <p className="text-xs text-muted-foreground">
              Toàn bộ thời gian
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng booking</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              Tất cả trạng thái
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ hủy</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancellationRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(stats.totalBookings * stats.cancellationRate / 100)} lịch bị hủy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trung bình/booking</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(avgPrice).toLocaleString('vi-VN')}đ
            </div>
            <p className="text-xs text-muted-foreground">Giá trị trung bình</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
          <TabsTrigger value="fields">Theo sân</TabsTrigger>
          <TabsTrigger value="status">Trạng thái</TabsTrigger>
          <TabsTrigger value="hours">Giờ cao điểm</TabsTrigger>
        </TabsList>

        {/* Monthly Revenue */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Doanh thu theo tháng</CardTitle>
              <CardDescription>Biểu đồ doanh thu 6 tháng gần nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={stats.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `${value.toLocaleString('vi-VN')}đ`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Doanh thu"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Field Statistics */}
        <TabsContent value="fields">
          <Card>
            <CardHeader>
              <CardTitle>Thống kê theo sân</CardTitle>
              <CardDescription>Doanh thu từng sân</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats.revenueByPitch}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="pitchName" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `${value.toLocaleString('vi-VN')}đ`}
                  />
                  <Legend />
                  <Bar dataKey="totalRevenue" fill="#10b981" name="Doanh thu" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 space-y-4">
                {stats.revenueByPitch.map((field) => (
                  <div key={field.pitchId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{field.pitchName}</p>
                      <p className="text-sm text-gray-600">
                        ID: {field.pitchId}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      {field.totalRevenue.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Distribution */}
        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Phân bố trạng thái booking</CardTitle>
              <CardDescription>Tỷ lệ các trạng thái đặt lịch</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) =>
                      `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Peak Hours */}
        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Khung giờ cao điểm</CardTitle>
              <CardDescription>Số lượng booking theo khung giờ trong ngày</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats.peakHours}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hourRange" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="bookingsCount" fill="#10b981" name="Số booking" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 space-y-2">
                <h4 className="font-medium">Phân tích:</h4>
                <p className="text-sm text-gray-600">
                  Thống kê dựa trên dữ liệu thực tế từ hệ thống.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
