import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Calendar, Check, X, Filter, Search } from 'lucide-react';
import { mockBookings, mockFields, type Booking } from '../data/mockData';
import { toast } from 'sonner';

export function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState(mockBookings);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionDialog, setActionDialog] = useState<'confirm' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter bookings based on user role
  const filteredBookings = React.useMemo(() => {
    let filtered = bookings;

    if (user?.role === 'STAFF') {
      filtered = filtered.filter(b => user.assignedFields?.includes(b.fieldId));
    }

    if (searchTerm) {
      filtered = filtered.filter(b =>
        b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mockFields.find(f => f.id === b.fieldId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [bookings, user, searchTerm]);

  const handleConfirm = () => {
    if (!selectedBooking) return;

    setBookings(bookings.map(b =>
      b.id === selectedBooking.id ? { ...b, status: 'CONFIRMED' } : b
    ));
    toast.success('Đã xác nhận booking');
    setActionDialog(null);
    setSelectedBooking(null);
  };

  const handleReject = () => {
    if (!selectedBooking || !rejectReason) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    setBookings(bookings.map(b =>
      b.id === selectedBooking.id
        ? { ...b, status: 'REJECTED', cancelReason: rejectReason }
        : b
    ));
    toast.success('Đã từ chối booking');
    setActionDialog(null);
    setSelectedBooking(null);
    setRejectReason('');
  };

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

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const field = mockFields.find(f => f.id === booking.fieldId);
    const canManage = user?.role === 'ADMIN' || user?.role === 'STAFF';

    return (
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">{field?.name}</p>
              {getStatusBadge(booking.status)}
            </div>
            <p className="text-sm text-gray-600">ID: {booking.id}</p>
          </div>
          <p className="text-lg font-bold text-green-600">
            {booking.totalPrice.toLocaleString('vi-VN')}đ
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-600">Khách hàng</p>
            <p className="font-medium">{booking.customerName}</p>
          </div>
          <div>
            <p className="text-gray-600">Ngày đặt</p>
            <p className="font-medium">{booking.date}</p>
          </div>
          <div>
            <p className="text-gray-600">Giờ</p>
            <p className="font-medium">{booking.startTime} - {booking.endTime}</p>
          </div>
          <div>
            <p className="text-gray-600">Thời lượng</p>
            <p className="font-medium">{booking.duration} phút</p>
          </div>
        </div>

        {booking.note && (
          <div className="text-sm">
            <p className="text-gray-600">Ghi chú:</p>
            <p className="text-gray-800">{booking.note}</p>
          </div>
        )}

        {booking.cancelReason && (
          <div className="text-sm">
            <p className="text-gray-600">Lý do hủy:</p>
            <p className="text-red-600">{booking.cancelReason}</p>
          </div>
        )}

        {canManage && booking.status === 'PENDING' && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="flex-1 gap-2"
              onClick={() => {
                setSelectedBooking(booking);
                setActionDialog('confirm');
              }}
            >
              <Check className="w-4 h-4" />
              Xác nhận
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1 gap-2"
              onClick={() => {
                setSelectedBooking(booking);
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

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm theo tên khách hàng hoặc sân..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            Tất cả ({filteredBookings.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Chờ xác nhận ({filteredBookings.filter(b => b.status === 'PENDING').length})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Đã xác nhận ({filteredBookings.filter(b => b.status === 'CONFIRMED').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Hoàn thành ({filteredBookings.filter(b => b.status === 'COMPLETED').length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Đã hủy ({filteredBookings.filter(b => b.status === 'CANCELLED' || b.status === 'REJECTED').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {filteredBookings.map(booking => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Không có booking nào</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {filteredBookings.filter(b => b.status === 'PENDING').map(booking => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
          {filteredBookings.filter(b => b.status === 'PENDING').length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Không có booking chờ xác nhận</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4 mt-6">
          {filteredBookings.filter(b => b.status === 'CONFIRMED').map(booking => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {filteredBookings.filter(b => b.status === 'COMPLETED').map(booking => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4 mt-6">
          {filteredBookings.filter(b => b.status === 'CANCELLED' || b.status === 'REJECTED').map(booking => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </TabsContent>
      </Tabs>

      {/* Confirm Dialog */}
      <Dialog open={actionDialog === 'confirm'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận booking</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xác nhận booking này?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button className="w-full" onClick={handleConfirm}>
              Xác nhận
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setActionDialog(null)}>
              Hủy
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
              Vui lòng nhập lý do từ chối booking
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Lý do từ chối</Label>
              <Textarea
                placeholder="VD: Sân đang bảo trì, thời tiết xấu..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
            <Button className="w-full" variant="destructive" onClick={handleReject}>
              Từ chối booking
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setActionDialog(null)}>
              Hủy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
