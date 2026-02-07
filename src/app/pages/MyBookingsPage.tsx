import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Calendar, Clock, MapPin, XCircle } from 'lucide-react';
import { mockBookings, mockFields, type Booking } from '../data/mockData';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState(mockBookings.filter(b => b.customerId === user?.id));
  const [cancelDialog, setCancelDialog] = useState<Booking | null>(null);

  const handleCancel = () => {
    if (!cancelDialog) return;

    const bookingDate = new Date(cancelDialog.date + 'T' + cancelDialog.startTime);
    const now = new Date();
    const hoursUntil = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil < 6) {
      toast.error('Không thể hủy lịch trước 6 giờ!');
      setCancelDialog(null);
      return;
    }

    setBookings(bookings.map(b =>
      b.id === cancelDialog.id
        ? { ...b, status: 'CANCELLED', cancelReason: 'Khách hàng hủy' }
        : b
    ));
    toast.success('Đã hủy booking thành công');
    setCancelDialog(null);
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

  const upcomingBookings = bookings.filter(b =>
    (b.status === 'CONFIRMED' || b.status === 'PENDING') &&
    new Date(b.date) >= new Date()
  );

  const pastBookings = bookings.filter(b =>
    b.status === 'COMPLETED' || new Date(b.date) < new Date()
  );

  const cancelledBookings = bookings.filter(b =>
    b.status === 'CANCELLED' || b.status === 'REJECTED'
  );

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const field = mockFields.find(f => f.id === booking.fieldId);
    const bookingDate = new Date(booking.date + 'T' + booking.startTime);
    const now = new Date();
    const canCancel = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
    const hoursUntil = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">{field?.name}</h3>
                  {getStatusBadge(booking.status)}
                </div>
                <p className="text-sm text-gray-600">Sân {field?.type} người</p>
              </div>
              <p className="text-xl font-bold text-green-600">
                {booking.totalPrice.toLocaleString('vi-VN')}đ
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Ngày đá</p>
                  <p className="font-medium">
                    {format(new Date(booking.date), 'PPP', { locale: vi })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Thời gian</p>
                  <p className="font-medium">
                    {booking.startTime} - {booking.endTime}
                  </p>
                </div>
              </div>
            </div>

            {booking.note && (
              <div className="text-sm p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Ghi chú:</p>
                <p className="text-gray-800">{booking.note}</p>
              </div>
            )}

            {booking.cancelReason && (
              <div className="text-sm p-3 bg-red-50 rounded-lg">
                <p className="text-red-600 font-medium">Lý do hủy:</p>
                <p className="text-red-800">{booking.cancelReason}</p>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Đặt lúc: {format(new Date(booking.createdAt), 'PPP HH:mm', { locale: vi })}
            </div>

            {canCancel && hoursUntil >= 6 && (
              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={() => setCancelDialog(booking)}
              >
                <XCircle className="w-4 h-4" />
                Hủy đặt lịch
              </Button>
            )}

            {canCancel && hoursUntil < 6 && (
              <p className="text-sm text-red-600 text-center py-2">
                Không thể hủy lịch trước 6 giờ
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Lịch đặt sân của tôi</h1>
        <p className="text-gray-600 mt-1">Quản lý các lịch đặt sân của bạn</p>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">
            Sắp tới ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Đã đá ({pastBookings.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Đã hủy ({cancelledBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-6">
          {upcomingBookings.map(booking => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
          {upcomingBookings.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Bạn chưa có lịch đặt sân nào sắp tới</p>
                  <Button onClick={() => window.location.href = '/book-field'}>
                    Đặt sân ngay
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4 mt-6">
          {pastBookings.map(booking => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
          {pastBookings.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có lịch sử đặt sân</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4 mt-6">
          {cancelledBookings.map(booking => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
          {cancelledBookings.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Không có booking bị hủy</p>
                </div>
              </CardContent>
            </Card>
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
                <p><span className="font-medium">Sân:</span> {mockFields.find(f => f.id === cancelDialog.fieldId)?.name}</p>
                <p><span className="font-medium">Ngày:</span> {cancelDialog.date}</p>
                <p><span className="font-medium">Giờ:</span> {cancelDialog.startTime} - {cancelDialog.endTime}</p>
                <p><span className="font-medium">Tiền:</span> {cancelDialog.totalPrice.toLocaleString('vi-VN')}đ</p>
              </div>
            )}
            <Button variant="destructive" className="w-full" onClick={handleCancel}>
              Xác nhận hủy
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setCancelDialog(null)}>
              Giữ lại booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
