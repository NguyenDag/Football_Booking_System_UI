import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Calendar, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { pitchService, Field as ApiField } from '../api/pitch.service';
import { bookingService, type BookingResponse, type BookingDetailResponse } from '../api/booking.service';

interface FlatBooking extends BookingDetailResponse {
  totalPrice: number;
  userId: number;
  createdAt: string;
  note?: string;
  cancellationReason?: string;
}

export function MyBookingsPage() {
  const { user } = useAuth();
  const [fields, setFields] = useState<ApiField[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<FlatBooking[]>([]);
  const [cancelDialog, setCancelDialog] = useState<FlatBooking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fieldsData, bookingsData] = await Promise.all([
        pitchService.getAllPitches(),
        bookingService.getMyBookings()
      ]);
      
      setFields(fieldsData);
      
      // Flatten bookings for the UI
      const flat: FlatBooking[] = [];
      bookingsData.forEach((b: BookingResponse) => {
        b.details.forEach(detail => {
          flat.push({
            ...detail,
            totalPrice: b.totalAmount,
            userId: b.userId,
            createdAt: b.createdAt,
            note: b.notes,
            cancellationReason: detail.cancellationReason
          });
        });
      });
      
      setBookings(flat);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

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
    const config = variants[status] || variants.PENDING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const now = new Date();

  const upcomingBookings = bookings.filter(b => {
    const bookingDate = new Date(b.playDate + 'T' + b.startTime);
    return b.status.toUpperCase() === 'CONFIRMED' && bookingDate >= now;
  });

  const pastBookings = bookings.filter(b => 
    b.status.toUpperCase() === 'COMPLETED'
  );

  const cancelledBookings = bookings.filter(b =>
    b.status.toUpperCase() === 'CANCELLED' || b.status.toUpperCase() === 'REJECTED'
  );

  const BookingCard = ({ booking }: { booking: FlatBooking }) => {
    const field = fields.find(f => f.id === booking.pitchId.toString());
    const bookingDate = new Date(booking.playDate + 'T' + booking.startTime);
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
                  <h3 className="text-lg font-medium">{booking.pitchName}</h3>
                  {getStatusBadge(booking.status)}
                </div>
                <p className="text-sm text-gray-600">Sân {field?.type || '...'} người</p>
              </div>
              <p className="text-xl font-bold text-green-600">
                {booking.priceAtBooking.toLocaleString('vi-VN')}đ
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Ngày đá</p>
                  <p className="font-medium">
                    {format(new Date(booking.playDate), 'PPP', { locale: vi })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Thời gian</p>
                  <p className="font-medium">
                    {booking.startTime.substring(0, 5)} - {booking.endTime.substring(0, 5)}
                  </p>
                </div>
              </div>
            </div>

            {booking.note && (
              <div className="text-sm p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600 font-medium">Ghi chú từ khách hàng:</p>
                <p className="text-gray-800">{booking.note}</p>
              </div>
            )}

            {booking.cancellationReason && (
              <div className="text-sm p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-red-600 font-medium">Lý do hủy/từ chối:</p>
                <p className="text-red-800 italic">{booking.cancellationReason}</p>
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
            <BookingCard key={booking.detailId} booking={booking} />
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
            <BookingCard key={booking.detailId} booking={booking} />
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
            <BookingCard key={booking.detailId} booking={booking} />
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
    </div>
  );
}
