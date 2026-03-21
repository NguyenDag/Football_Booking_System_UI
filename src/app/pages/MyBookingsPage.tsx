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
  const [loading, setLoading] = useState(true);
  const [upcoming, setUpcoming] = useState<FlatBooking[]>([]);
  const [history, setHistory] = useState<FlatBooking[]>([]);
  const [cancelDialog, setCancelDialog] = useState<FlatBooking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  React.useEffect(() => {
    fetchData();
  }, []);

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
          totalPrice: b.totalAmount,
          userId: b.userId,
          createdAt: b.createdAt,
          note: b.notes,
          cancellationReason: detail.cancellationReason
        });
      });
    });
    return flat.sort((a, b) => new Date(b.playDate + 'T' + b.startTime).getTime() - new Date(a.playDate + 'T' + a.startTime).getTime());
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
    const config = variants[status?.toUpperCase()] || variants.PENDING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const BookingCard = ({ booking }: { booking: FlatBooking }) => {
    const bookingDate = new Date(booking.playDate + 'T' + booking.startTime);
    const now = new Date();
    const canCancel = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
    const hoursUntil = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    return (
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-800">{booking.pitchName}</h3>
                  {getStatusBadge(booking.status)}
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

            <div className="flex items-center justify-between pt-2">
               <div className="text-[10px] text-gray-400 uppercase font-medium">
                Đặt lúc: {format(new Date(booking.createdAt), 'HH:mm dd/MM/yyyy')}
              </div>
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

      <Tabs defaultValue="upcoming" className="w-full">
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
              {upcoming.map(booking => (
                <BookingCard key={booking.detailId} booking={booking} />
              ))}
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
              {history.map(booking => (
                <BookingCard key={booking.detailId} booking={booking} />
              ))}
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
    </div>
  );
}
