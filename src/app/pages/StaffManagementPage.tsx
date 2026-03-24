import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  UserPlus,
  Loader2,
  Eye,
  Trash2,
  ShieldOff,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  AlertTriangle,
  RefreshCcw,
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
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Label } from '../components/ui/label';
import { staffService, StaffSummary } from '../api/staff.service';
import { toast } from 'sonner';

type SortField = 'fullName' | 'totalAssignedPitches' | 'totalShifts';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

const PAGE_SIZE = 6;

const VN_PHONE_REGEX = /^(0[3|5|7|8|9])[0-9]{8}$/;

function validatePhone(phone: string): string | null {
  if (!phone) return null; // optional
  if (!VN_PHONE_REGEX.test(phone.replace(/\s/g, ''))) {
    return 'Số điện thoại không hợp lệ.';
  }
  return null;
}

export function StaffManagementPage() {
  const navigate = useNavigate();
  const [staffs, setStaffs] = useState<StaffSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Deactivate Dialog
  const [deactivateId, setDeactivateId] = useState<number | null>(null);
  const [deactivateName, setDeactivateName] = useState('');
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);

  // Hard Delete Dialog
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Sort & Pagination
  const [sortField, setSortField] = useState<SortField>('fullName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Add Staff form state
  const [newStaff, setNewStaff] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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

  useEffect(() => { fetchStaffs(); }, []);

  // ── Sort + Filter + Paginate (client-side) ──────────────────────
  const processedStaffs = useMemo(() => {
    let list = staffs.filter(s => {
      const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || 
                            (statusFilter === 'ACTIVE' && s.isActive) || 
                            (statusFilter === 'INACTIVE' && !s.isActive);
      return matchesSearch && matchesStatus;
    });
    
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'fullName') cmp = a.fullName.localeCompare(b.fullName, 'vi');
      else if (sortField === 'totalAssignedPitches') cmp = a.totalAssignedPitches - b.totalAssignedPitches;
      else cmp = a.totalShifts - b.totalShifts;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [staffs, searchTerm, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processedStaffs.length / PAGE_SIZE));
  const pagedStaffs = processedStaffs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page when search/sort/filter changes
  useEffect(() => setCurrentPage(1), [searchTerm, statusFilter, sortField, sortDir]);

  // ── Handlers ──────────────────────────────────────────────────
  const handlePhoneChange = (val: string) => {
    setNewStaff({ ...newStaff, phone: val });
    setPhoneError(validatePhone(val));
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validatePhone(newStaff.phone);
    if (err) { setPhoneError(err); return; }
    setAddLoading(true);
    try {
      await staffService.createStaff(newStaff);
      toast.success('Thêm nhân viên thành công!');
      setIsAddDialogOpen(false);
      setNewStaff({ fullName: '', email: '', password: '', phone: '' });
      setPhoneError(null);
      fetchStaffs();
    } catch (error: any) {
      toast.error(error.message || 'Thêm nhân viên thất bại');
    } finally {
      setAddLoading(false);
    }
  };

  const onDeactivateClick = (id: number, name: string) => {
    setDeactivateId(id);
    setDeactivateName(name);
    setIsDeactivateDialogOpen(true);
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateId) return;
    setActionLoading(true);
    try {
      await staffService.deleteStaff(deactivateId);
      toast.success(`Đã vô hiệu hóa nhân viên "${deactivateName}"`);
      setIsDeactivateDialogOpen(false);
      fetchStaffs();
    } catch (error: any) {
      toast.error(error.message || 'Vô hiệu hóa thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const onDeleteClick = (id: number, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      await staffService.hardDeleteStaff(deleteId);
      toast.success(`Đã xóa vĩnh viễn nhân viên "${deleteName}" khỏi hệ thống`);
      setIsDeleteDialogOpen(false);
      fetchStaffs();
    } catch (error: any) {
      toast.error(error.message || 'Xóa vĩnh viễn thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Users className="w-8 h-8 text-emerald-600" />
            </div>
            Quản lý Nhân viên
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">Quản lý tài khoản, phân công và ca làm việc</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) { setNewStaff({ fullName: '', email: '', password: '', phone: '' }); setPhoneError(null); } }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 h-12 shadow-lg shadow-emerald-200 transition-all gap-2">
              <UserPlus className="w-5 h-5" />
              Thêm Nhân viên
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900">Tạo tài khoản Staff</DialogTitle>
              <DialogDescription>Nhập thông tin cơ bản để tạo tài khoản nhân viên mới.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddStaff} className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="font-bold text-slate-700">Họ và tên</Label>
                  <Input
                    id="fullName"
                    value={newStaff.fullName}
                    onChange={e => setNewStaff({ ...newStaff, fullName: e.target.value })}
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
                    onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
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
                    onChange={e => handlePhoneChange(e.target.value)}
                    placeholder="09xx xxx xxx"
                    className={`rounded-xl border-slate-200 h-12 ${phoneError ? 'border-red-400 focus:ring-red-400/10' : ''}`}
                  />
                  {phoneError && <p className="text-sm text-red-500 font-medium">{phoneError}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pass" className="font-bold text-slate-700">Mật khẩu ban đầu</Label>
                  <Input
                    id="pass"
                    type="password"
                    value={newStaff.password}
                    onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                    placeholder="••••••••"
                    className="rounded-xl border-slate-200 h-12"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={addLoading || !!phoneError}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                >
                  {addLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Xác nhận tạo tài khoản'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter, Search & Sort bar */}
      <div className="flex flex-col xl:flex-row gap-4 xl:items-center">
        {/* Search */}
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          <Input
            placeholder="Tìm theo tên hoặc email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-12 h-12 rounded-2xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/10 transition-all bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'ACTIVE', label: 'Đang hoạt động' },
              { id: 'INACTIVE', label: 'Tạm khóa' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as StatusFilter)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${statusFilter === f.id ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          {/* Sort */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <Select value={`${sortField}-${sortDir}`} onValueChange={v => { const [f, d] = v.split('-'); setSortField(f as SortField); setSortDir(d as SortDir); }}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200 text-sm w-44 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="fullName-asc">Tên A → Z</SelectItem>
                <SelectItem value="fullName-desc">Tên Z → A</SelectItem>
                <SelectItem value="totalAssignedPitches-desc">Nhiều sân nhất</SelectItem>
                <SelectItem value="totalAssignedPitches-asc">Ít sân nhất</SelectItem>
                <SelectItem value="totalShifts-desc">Nhiều ca nhất</SelectItem>
                <SelectItem value="totalShifts-asc">Ít ca nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="ghost" size="icon" onClick={fetchStaffs} className="h-11 w-11 rounded-xl text-slate-400 hover:text-emerald-600">
            <RefreshCcw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Summary */}
      {!loading && (
        <p className="text-sm text-slate-500 font-medium -mt-4">
          Hiển thị {pagedStaffs.length} / {processedStaffs.length} nhân viên
          {searchTerm && ` (kết quả tìm kiếm: "${searchTerm}")`}
        </p>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
          <p className="text-slate-500 font-medium">Đang tải danh sách nhân viên...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pagedStaffs.map((staff) => (
              <Card key={staff.userId} className="group border-none shadow-lg hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
                <div className={`h-2 w-full ${staff.isActive ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                      <Users className="w-6 h-6" />
                    </div>
                    <Badge variant={staff.isActive ? 'default' : 'secondary'} className={`rounded-lg font-bold ${staff.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-100 text-amber-700 hover:bg-amber-100'}`}>
                      {staff.isActive ? 'Đang hoạt động' : 'Tạm khóa'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 mt-4 group-hover:text-emerald-600 transition-colors truncate">
                    {staff.fullName}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 text-slate-500 font-medium truncate">
                    <Mail className="w-4 h-4" /> {staff.email}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Số sân</p>
                      <p className="text-lg font-extrabold text-slate-700">{staff.totalAssignedPitches}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Số ca làm</p>
                      <p className="text-lg font-extrabold text-slate-700">{staff.totalShifts}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Phone className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold">{staff.phone || 'Chưa cập nhật'}</span>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/staff/${staff.userId}`)}
                      className="flex-1 h-11 rounded-xl border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 font-bold transition-all gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Chi tiết
                    </Button>

                    {staff.isActive ? (
                      <Button
                        variant="outline"
                        onClick={() => onDeactivateClick(staff.userId, staff.fullName)}
                        className="w-11 h-11 rounded-xl border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-all p-0"
                        title="Vô hiệu hóa"
                      >
                        <ShieldOff className="w-5 h-5" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => onDeleteClick(staff.userId, staff.fullName)}
                        className="w-11 h-11 rounded-xl border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all p-0"
                        title="Xóa vĩnh viễn"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {pagedStaffs.length === 0 && (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Search className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Không tìm thấy nhân viên nào</h3>
                <p className="text-slate-500 mt-2">Thử đổi bộ lọc hoặc thêm nhân viên mới.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl border-slate-200"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${page === currentPage ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                className="rounded-xl border-slate-200"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-4">
              <ShieldOff className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl font-bold">Vô hiệu hóa nhân viên?</DialogTitle>
            <DialogDescription className="text-base py-2">
              Bạn có chắc chắn muốn tạm dừng hoạt động của nhân viên <span className="font-bold text-slate-900">"{deactivateName}"</span>? 
              Tài khoản này sẽ không thể đăng nhập vào hệ thống cho đến khi được mở khóa lại.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsDeactivateDialogOpen(false)} className="rounded-xl h-12 px-6">Huỷ</Button>
            <Button 
              onClick={handleDeactivateConfirm} 
              disabled={actionLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-12 px-6 font-bold flex-1 sm:flex-none"
            >
              {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Xác nhận khóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hard Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl font-bold text-red-600">Xóa vĩnh viễn nhân viên?</DialogTitle>
            <DialogDescription className="text-base py-2 text-slate-600">
              CẢNH BÁO: Bạn đang thực hiện xóa vĩnh viễn nhân viên <span className="font-bold text-slate-900">"{deleteName}"</span>. 
              Mọi dữ liệu liên quan sẽ bị xóa hoặc ẩn danh. Hành động này <span className="font-bold text-red-600 underline">KHÔNG THỂ HOÀN TÁC</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-xl h-12 px-6">Huỷ bỏ</Button>
            <Button 
              onClick={handleDeleteConfirm} 
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 px-6 font-bold flex-1 sm:flex-none"
            >
              {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tôi đã hiểu, hãy xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
