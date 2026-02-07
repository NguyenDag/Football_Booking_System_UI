import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { mockBookings, mockFields } from '../data/mockData';
import { TrendingUp, DollarSign, Calendar, BarChart3 } from 'lucide-react';

export function StatisticsPage() {
  const statistics = useMemo(() => {
    // Revenue statistics
    const totalRevenue = mockBookings
      .filter(b => b.status === 'COMPLETED')
      .reduce((sum, b) => sum + b.totalPrice, 0);

    const pendingRevenue = mockBookings
      .filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED')
      .reduce((sum, b) => sum + b.totalPrice, 0);

    // Booking by status
    const statusCounts = {
      PENDING: mockBookings.filter(b => b.status === 'PENDING').length,
      CONFIRMED: mockBookings.filter(b => b.status === 'CONFIRMED').length,
      COMPLETED: mockBookings.filter(b => b.status === 'COMPLETED').length,
      CANCELLED: mockBookings.filter(b => b.status === 'CANCELLED').length,
      REJECTED: mockBookings.filter(b => b.status === 'REJECTED').length,
    };

    // Bookings by field
    const fieldStats = mockFields.map(field => {
      const fieldBookings = mockBookings.filter(b => b.fieldId === field.id);
      const revenue = fieldBookings
        .filter(b => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + b.totalPrice, 0);
      
      return {
        name: field.name,
        bookings: fieldBookings.length,
        revenue: revenue,
        completed: fieldBookings.filter(b => b.status === 'COMPLETED').length,
        cancelled: fieldBookings.filter(b => b.status === 'CANCELLED' || b.status === 'REJECTED').length,
      };
    });

    // Monthly revenue (mock data for visualization)
    const monthlyRevenue = [
      { month: 'T1', revenue: 15000000, bookings: 45 },
      { month: 'T2', revenue: 18000000, bookings: 52 },
      { month: 'T3', revenue: 22000000, bookings: 63 },
      { month: 'T4', revenue: 20000000, bookings: 58 },
      { month: 'T5', revenue: 25000000, bookings: 71 },
      { month: 'T6', revenue: 28000000, bookings: 80 },
    ];

    // Peak hours (mock data)
    const peakHours = [
      { hour: '6-9h', bookings: 12 },
      { hour: '9-12h', bookings: 8 },
      { hour: '12-15h', bookings: 15 },
      { hour: '15-18h', bookings: 28 },
      { hour: '18-21h', bookings: 45 },
      { hour: '21-24h', bookings: 18 },
    ];

    const cancelRate = (statusCounts.CANCELLED + statusCounts.REJECTED) / mockBookings.length * 100;

    return {
      totalRevenue,
      pendingRevenue,
      statusCounts,
      fieldStats,
      monthlyRevenue,
      peakHours,
      cancelRate,
      totalBookings: mockBookings.length,
    };
  }, []);

  const statusData = [
    { name: 'Chờ xác nhận', value: statistics.statusCounts.PENDING, color: '#f59e0b' },
    { name: 'Đã xác nhận', value: statistics.statusCounts.CONFIRMED, color: '#10b981' },
    { name: 'Hoàn thành', value: statistics.statusCounts.COMPLETED, color: '#3b82f6' },
    { name: 'Đã hủy', value: statistics.statusCounts.CANCELLED + statistics.statusCounts.REJECTED, color: '#ef4444' },
  ];

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
              {statistics.totalRevenue.toLocaleString('vi-VN')}đ
            </div>
            <p className="text-xs text-muted-foreground">
              +{statistics.pendingRevenue.toLocaleString('vi-VN')}đ chờ thanh toán
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng booking</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.statusCounts.COMPLETED} hoàn thành
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ hủy</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.cancelRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {statistics.statusCounts.CANCELLED + statistics.statusCounts.REJECTED} lịch bị hủy
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
              {Math.round(statistics.totalRevenue / statistics.statusCounts.COMPLETED).toLocaleString('vi-VN')}đ
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
                <LineChart data={statistics.monthlyRevenue}>
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
              <CardDescription>Doanh thu và số lượng booking từng sân</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={statistics.fieldStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'Doanh thu') {
                        return `${value.toLocaleString('vi-VN')}đ`;
                      }
                      return value;
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="bookings" fill="#3b82f6" name="Số booking" />
                  <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Doanh thu" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 space-y-4">
                {statistics.fieldStats.map((field) => (
                  <div key={field.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{field.name}</p>
                      <p className="text-sm text-gray-600">
                        {field.bookings} booking • {field.completed} hoàn thành • {field.cancelled} hủy
                      </p>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      {field.revenue.toLocaleString('vi-VN')}đ
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

              <div className="mt-6 grid grid-cols-2 gap-4">
                {statusData.map((status) => (
                  <div
                    key={status.name}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: status.color }}
                    />
                    <div>
                      <p className="text-sm text-gray-600">{status.name}</p>
                      <p className="font-bold">{status.value}</p>
                    </div>
                  </div>
                ))}
              </div>
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
                <BarChart data={statistics.peakHours}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="bookings" fill="#10b981" name="Số booking" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 space-y-2">
                <h4 className="font-medium">Phân tích:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Khung giờ 18h-21h là cao điểm nhất với 45 booking</li>
                  <li>• Khung giờ sáng 9h-12h ít khách nhất</li>
                  <li>• Nên có chính sách ưu đãi cho khung giờ thấp điểm</li>
                  <li>• Cân nhắc tăng giá vào khung 18h-21h</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
