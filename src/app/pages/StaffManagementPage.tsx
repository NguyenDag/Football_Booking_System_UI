import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Shield, 
  MoreVertical, 
  Eye, 
  UserPlus,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { staffService, StaffSummary } from '../api/staff.service';
import { toast } from 'sonner';

export function StaffManagementPage() {
  const navigate = useNavigate();
  const [staffs, setStaffs] = useState<StaffSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Add Staff form state
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: ''
  });
  const [addLoading, setAddLoading] = useState(false);

  const fetchStaffs = async () => {
    try {
      setLoading(true);
      const data = await staffService.getAllStaff();
      setStaffs(data);
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffs();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await staffService.createStaff(newStaff);
      toast.success('Thêm nhân viên thành công!');
      setIsAddDialogOpen(false);
      setNewStaff({ fullName: '', email: '', password: '', phone: '' });
      fetchStaffs();
    } catch (error: any) {
      toast.error(error.message || 'Thêm nhân viên thất bại');
    } finally {
      setAddLoading(false);
    }
  };

  const filteredStaffs = staffs.filter(s => 
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Users className="w-8 h-8 text-emerald-600" />
            </div>
            Quản lý Nhân viên
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">Danh sách nhân viên vận hành hệ thống</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 h-12 shadow-lg shadow-emerald-200 transition-all gap-2">
              <UserPlus className="w-5 h-5" />
              Thêm Nhân viên mới
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900">Tạo tài khoản Staff</DialogTitle>
              <DialogDescription>
                Nhập thông tin cơ bản để tạo tài khoản nhân viên mới.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddStaff} className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="font-bold text-slate-700">Họ và tên</Label>
                  <Input 
                    id="fullName"
                    value={newStaff.fullName}
                    onChange={e => setNewStaff({...newStaff, fullName: e.target.value})}
                    placeholder="Nguyễn Văn A" 
                    className="rounded-xl border-slate-200 h-12"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold text-slate-700">Email công việc</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={newStaff.email}
                    onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                    placeholder="staff@football.com" 
                    className="rounded-xl border-slate-200 h-12"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-bold text-slate-700">Số điện thoại</Label>
                  <Input 
                    id="phone"
                    value={newStaff.phone}
                    onChange={e => setNewStaff({...newStaff, phone: e.target.value})}
                    placeholder="09xx xxx xxx" 
                    className="rounded-xl border-slate-200 h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pass" className="font-bold text-slate-700">Mật khẩu ban đầu</Label>
                  <Input 
                    id="pass"
                    type="password"
                    value={newStaff.password}
                    onChange={e => setNewStaff({...newStaff, password: e.target.value})}
                    placeholder="••••••••" 
                    className="rounded-xl border-slate-200 h-12"
                    required 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={addLoading}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                >
                  {addLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Xác nhận tạo tài khoản'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter & Search */}
      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
        <Input 
          placeholder="Tìm kiếm nhân viên bằng tên hoặc email..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-12 h-12 rounded-2xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/10 transition-all bg-white"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
          <p className="text-slate-500 font-medium">Đang tải danh sách nhân viên...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaffs.map((staff) => (
            <Card key={staff.userId} className="group border-none shadow-lg hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
              <div className={`h-2 w-full ${staff.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                    <Users className="w-6 h-6" />
                  </div>
                  <Badge variant={staff.isActive ? "default" : "secondary"} className={`rounded-lg font-bold ${staff.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}`}>
                    {staff.isActive ? 'Đang hoạt động' : 'Tạm khóa'}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 mt-4 group-hover:text-emerald-600 transition-colors">
                  {staff.fullName}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-slate-500 font-medium">
                  <Mail className="w-4 h-4" /> {staff.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Số sân phụ trách</p>
                    <p className="text-lg font-extrabold text-slate-700">{staff.totalAssignedPitches}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Số ca làm việc</p>
                    <p className="text-lg font-extrabold text-slate-700">{staff.totalShifts}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  <span className="font-semibold">{staff.phone || 'Chưa cập nhật'}</span>
                </div>

                <Button 
                  variant="outline" 
                   onClick={() => navigate(`/staff/${staff.userId}`)}
                  className="w-full h-11 rounded-xl border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 font-bold transition-all mt-2 gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Chi tiết & Phân công
                </Button>
              </CardContent>
            </Card>
          ))}

          {filteredStaffs.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
               <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Search className="w-10 h-10 text-slate-300" />
               </div>
               <h3 className="text-xl font-bold text-slate-900">Không tìm thấy nhân viên nào</h3>
               <p className="text-slate-500 mt-2">Hãy thử đổi từ khóa tìm kiếm hoặc thêm nhân viên mới.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
