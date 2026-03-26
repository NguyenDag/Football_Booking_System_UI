import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pitchService, Field } from '../api/pitch.service';
import { bookingService, AvailabilitySlot } from '../api/booking.service';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Users, Info, ArrowRight, ShieldCheck, Zap, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '../components/ui/pagination';

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [pitches, setPitches] = useState<Field[]>([]);
  const [selectedPitch, setSelectedPitch] = useState<Field | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchPitches();
  }, []);

  const fetchPitches = async () => {
    try {
      setLoading(true);
      const data = await pitchService.getAllPitches();
      setPitches(data);
      if (data.length > 0) {
        setSelectedPitch(data[0]);
      }
    } catch (error: any) {
      toast.error('Không thể tải danh sách sân: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = () => {
    if (isAuthenticated) {
      navigate('/book-field', { state: { pitchId: selectedPitch?.id, date: selectedDate } });
    } else {
      toast.info('Vui lòng đăng nhập để thực hiện đặt sân');
      navigate('/login');
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(pitches.length / itemsPerPage);
  const currentPitches = pitches.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const listElement = document.getElementById('pitch-list-container');
    if (listElement) {
      listElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl">
        <img 
          src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000&auto=format&fit=crop" 
          alt="Football Field" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/80 to-transparent flex flex-col justify-center px-12 text-white">
          <Badge className="w-fit mb-4 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 backdrop-blur-md">
            Hệ thống đặt sân hiện đại #1
          </Badge>
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight leading-tight">
            Sân Bóng Đẳng Cấp <br /> 
            <span className="text-emerald-400">Trải Nghiệm Đỉnh Cao</span>
          </h1>
          <p className="text-lg text-emerald-50/80 mb-8 max-w-lg">
            Hệ thống sân cỏ nhân tạo tiêu chuẩn quốc tế, đèn chiếu sáng cao cấp và dịch vụ chuyên nghiệp. Đặt lịch ngay chỉ trong 30 giây!
          </p>
          <div className="flex gap-4">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20" onClick={handleBookClick}>
              Đặt sân ngay <Zap className="ml-2 w-4 h-4 fill-current" />
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md">
              Tìm hiểu thêm
            </Button>
          </div>
        </div>
      </section>

      {/* Stats/Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: ShieldCheck, title: "Uy tín & Tin cậy", desc: "Đảm bảo đúng sân, đúng giờ, không lo trùng lịch" },
          { icon: Zap, title: "Tiện lợi & Nhanh chóng", desc: "Thanh toán đa dạng, xác nhận ngay trong tích tắc" },
          { icon: Users, title: "Cộng đồng sôi động", desc: "Hơn 5000+ người chơi đã tin tưởng sử dụng" }
        ].map((feat, i) => (
          <Card key={i} className="border-none bg-white shadow-md hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                <feat.icon className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-lg">{feat.title}</CardTitle>
                <CardDescription>{feat.desc}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </section>

      {/* Pitch Selection & Availability */}
      <section className="grid lg:grid-cols-12 gap-8">
        {/* Pitch List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="text-emerald-500" /> Danh sách sân
            </h2>
          </div>
          <div id="pitch-list-container" className="grid gap-4">
            {currentPitches.map(pitch => (
              <div 
                key={pitch.id}
                onClick={() => setSelectedPitch(pitch)}
                className={`p-4 rounded-2xl cursor-pointer border-2 transition-all duration-300 flex items-center gap-4 ${
                  selectedPitch?.id === pitch.id 
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-4 ring-emerald-500/10' 
                    : 'border-slate-100 bg-white hover:border-emerald-200 hover:shadow-sm'
                }`}
              >
                <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 relative group/img">
                  <img 
                    src={pitch.image} 
                    alt={pitch.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=200&auto=format&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{pitch.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] py-0">
                      Sân {pitch.type} người
                    </Badge>
                    <Badge variant="outline" className={pitch.status === 'ACTIVE' ? 'text-emerald-600 border-emerald-100' : 'text-orange-500 border-orange-100'}>
                      {pitch.status === 'ACTIVE' ? 'Đang hoạt động' : 'Bảo trì'}
                    </Badge>
                  </div>
                </div>
                <ArrowRight className={`w-5 h-5 transition-transform ${selectedPitch?.id === pitch.id ? 'translate-x-1 text-emerald-500' : 'text-slate-300'}`} />
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-emerald-50 text-emerald-600 transition-colors'}
                    >
                      Trang trước
                    </PaginationPrevious>
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={currentPage === page}
                        className={
                          currentPage === page 
                            ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600' 
                            : 'cursor-pointer hover:bg-emerald-50 text-slate-600 transition-colors'
                        }
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-emerald-50 text-emerald-600 transition-colors'}
                    >
                      Trang sau
                    </PaginationNext>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>

        {/* Availability Calendar & Prices */}
        <div className="lg:col-span-7">
          <Card className="border-none shadow-xl bg-white overflow-hidden rounded-3xl">
            <CardHeader className="bg-slate-900 text-white p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-400" /> 
                    Giá tiền & Lịch sân
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {selectedPitch?.name} • Sân {selectedPitch?.type} người
                  </CardDescription>
                </div>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white gap-2 rounded-xl">
                      <CalendarIcon className="w-4 h-4" />
                      {format(selectedDate, 'dd/MM/yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {selectedPitch?.priceSlots?.filter(slot => {
                  const day = selectedDate.getDay();
                  const isWeekend = day === 0 || day === 6;
                  return slot.applyOn === 'ALL' || (isWeekend ? slot.applyOn === 'WEEKEND' : slot.applyOn === 'WEEKDAY');
                }).map((slot, i) => (
                  <div 
                    key={i}
                    className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{slot.startTime} - {slot.endTime}</div>
                        <div className="text-xs text-slate-500">{slot.type === 'PEAK' ? 'Khung giờ vàng' : 'Khung giờ thường'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-600">
                        {slot.price.toLocaleString('vi-VN')}đ
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">/ 1 tiếng</div>
                    </div>
                  </div>
                ))}

                {selectedPitch?.priceSlots?.length === 0 && (
                  <div className="text-center py-12 text-slate-400 italic">
                    Chưa có thông tin giá cho sân này.
                  </div>
                )}
              </div>

              <div className="mt-8 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-800 leading-relaxed">
                  <strong>Thông tin:</strong> Giá trên áp dụng cho mỗi 1 tiếng. Khung giờ vàng (16:00 - 22:00) thường có mức giá cao hơn. Vui lòng đăng nhập để thực hiện đặt sân theo nhu cầu (60, 90, 120 phút).
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 p-6 flex justify-between items-center">
              <div className="hidden sm:block">
                <p className="text-xs text-slate-500">Giờ hoạt động</p>
                <p className="text-sm font-bold text-slate-700 italic">06:00 - 22:00</p>
              </div>
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 px-8 rounded-xl" onClick={handleBookClick}>
                Tiến hành đặt sân <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
}
