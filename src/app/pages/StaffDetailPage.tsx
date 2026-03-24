import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Clock,
  Save,
  Plus,
  Trash2,
  ShieldCheck,
  Mail,
  Phone,
  Timer,
  Building2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { staffService, StaffDetail, AssignedPitch, Shift } from '../api/staff.service';
import { pitchService, Field } from '../api/pitch.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';

// ── Helpers ──────────────────────────────────────────────────────
const VN_PHONE_REGEX = /^(0[3|5|7|8|9])[0-9]{8}$/;

function validatePhone(phone: string): string | null {
  if (!phone) return null;
  if (!VN_PHONE_REGEX.test(phone.replace(/\s/g, ''))) {
    return 'Số điện thoại không hợp lệ.';
  }
  return null;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

const getDayName = (day: number) => {
  const days = ['', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
  return days[day] ?? '';
};

type ScheduleMode = 'single' | 'weekdays' | 'fullWeek';

interface BulkResult {
  day: number;
  dayName: string;
  success: boolean;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────
export function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [pitches, setPitches] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  // Form loading states
  const [updatingInfo, setUpdatingInfo] = useState(false);
  const [assigningPitch, setAssigningPitch] = useState(false);
  const [creatingShift, setCreatingShift] = useState(false);

  // Form states
  const [infoForm, setInfoForm] = useState({ fullName: '', phone: '', isActive: true });
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [selectedPitchId, setSelectedPitchId] = useState<string>('');

  // Shift form
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('single');
  const [newShift, setNewShift] = useState({
    pitchId: 0,
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '17:00',
  });

  // Bulk result state
  const [bulkResults, setBulkResults] = useState<BulkResult[] | null>(null);

  // ── Data fetch ──────────────────────────────────────────────
  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [staffData, allPitches] = await Promise.all([
        staffService.getStaffById(parseInt(id)),
        pitchService.getAllPitches(),
      ]);
      setStaff(staffData);
      setPitches(allPitches);
      setInfoForm({ fullName: staffData.fullName, phone: staffData.phone || '', isActive: staffData.isActive });
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Bulk results auto hide
  useEffect(() => {
    let timer: any;
    if (bulkResults) {
      timer = setTimeout(() => {
        setBulkResults(null);
      }, 7000); // Hide after 7 seconds
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [bulkResults]);

  // ── Handlers ────────────────────────────────────────────────
  const handlePhoneChange = (val: string) => {
    setInfoForm({ ...infoForm, phone: val });
    setPhoneError(validatePhone(val));
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const err = validatePhone(infoForm.phone);
    if (err) { setPhoneError(err); return; }
    setUpdatingInfo(true);
    try {
      await staffService.updateStaff(parseInt(id), infoForm);
      toast.success('Cập nhật thông tin thành công!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Cập nhật thất bại');
    } finally {
      setUpdatingInfo(false);
    }
  };

  const handleAssignPitch = async () => {
    if (!id || !selectedPitchId) return;
    setAssigningPitch(true);
    try {
      await staffService.assignPitch(parseInt(id), { pitchId: parseInt(selectedPitchId) });
      toast.success('Phân công sân thành công!');
      setSelectedPitchId('');
      await fetchData();
      setActiveTab('info');
    } catch (error: any) {
      toast.error(error.message || 'Phân công thất bại');
    } finally {
      setAssigningPitch(false);
    }
  };

  const handleUnassignPitch = async (pitchId: number) => {
    if (!confirm('Bạn có chắc chắn muốn thu hồi phân công sân này? Lịch làm việc tại sân này cũng sẽ bị xóa.')) return;
    if (!id) return;
    try {
      await staffService.unassignPitch(parseInt(id), pitchId);
      toast.success('Đã thu hồi phân công');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Thu hồi thất bại');
    }
  };

  // ── Bulk / single shift creation ─────────────────────────────
  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (newShift.pitchId === 0) { toast.error('Vui lòng chọn sân cho ca làm'); return; }
    if (newShift.startTime >= newShift.endTime) { toast.error('Giờ bắt đầu phải nhỏ hơn giờ kết thúc'); return; }

    setBulkResults(null);
    setCreatingShift(true);

    const daysToCreate: number[] =
      scheduleMode === 'single' ? [newShift.dayOfWeek] :
        scheduleMode === 'weekdays' ? [1, 2, 3, 4, 5] :
          [1, 2, 3, 4, 5, 6, 7];

    if (scheduleMode === 'single') {
      // Simple single shift
      try {
        await staffService.createShift(parseInt(id), {
          ...newShift,
          startTime: `${newShift.startTime}:00`,
          endTime: `${newShift.endTime}:00`,
        });
        toast.success('Thêm ca làm việc thành công!');
        await fetchData();
        setActiveTab('info');
      } catch (error: any) {
        toast.error(error.message || 'Thêm ca làm thất bại');
      } finally {
        setCreatingShift(false);
      }
      return;
    }

    // Bulk mode — try each day and collect results
    const results: BulkResult[] = [];
    for (const day of daysToCreate) {
      try {
        await staffService.createShift(parseInt(id), {
          pitchId: newShift.pitchId,
          dayOfWeek: day,
          startTime: `${newShift.startTime}:00`,
          endTime: `${newShift.endTime}:00`,
        });
        results.push({ day, dayName: getDayName(day), success: true });
      } catch (err: any) {
        results.push({ day, dayName: getDayName(day), success: false, error: err.message || 'Trùng lịch' });
      }
    }

    setBulkResults(results);
    setCreatingShift(false);
    await fetchData();

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    if (failCount === 0) {
      toast.success(`Đã thêm thành công ${successCount} ca làm việc!`);
      setActiveTab('info');
    } else if (successCount === 0) {
      toast.error(`Tất cả ${failCount} ca đều bị trùng lịch.`);
    } else {
      toast.warning(`Thêm ${successCount} ca thành công, ${failCount} ca bị trùng lịch.`);
    }
  };

  const handleDeleteShift = async (shiftId: number) => {
    if (!confirm('Xóa ca làm việc này?')) return;
    if (!id) return;
    try {
      await staffService.deleteShift(parseInt(id), shiftId);
      toast.success('Đã xóa ca làm việc');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Xóa thất bại');
    }
  };

  // ── Render ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-bold">Đang tải dữ liệu nhân viên...</p>
      </div>
    );
  }

  if (!staff) return <div className="text-center py-20 font-bold text-red-500">Nhân viên không tồn tại</div>;

  const isInactive = !staff.isActive;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/staff')}
            className="rounded-2xl border-slate-200 hover:border-emerald-500 hover:bg-emerald-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{staff.fullName}</h1>
            <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
              <Badge className={staff.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-600'}>
                {staff.isActive ? 'Nhân viên đang làm việc' : 'Tài khoản tạm khóa'}
              </Badge>
              <span>• Tham gia: {formatDate(staff.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/50 backdrop-blur-md p-1.5 rounded-2xl h-14 border border-slate-100 shadow-sm w-full md:w-auto overflow-x-auto inline-flex whitespace-nowrap">
          <TabsTrigger value="info" className="rounded-xl px-8 h-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg font-bold transition-all gap-2">
            <User className="w-4 h-4" /> Thông tin cá nhân
          </TabsTrigger>
          <TabsTrigger value="pitches" className="rounded-xl px-8 h-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg font-bold transition-all gap-2">
            <Building2 className="w-4 h-4" /> Phân công sân
          </TabsTrigger>
          <TabsTrigger value="shifts" className="rounded-xl px-8 h-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg font-bold transition-all gap-2">
            <Timer className="w-4 h-4" /> Ca làm việc
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Info ─────────────────────────────────────────── */}
        <TabsContent value="info" className="animate-in fade-in slide-in-from-left-4 duration-500 outline-none">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-md">
            <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-white pb-8 border-b border-slate-100">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600" /> Cập nhật Hồ sơ Nhân viên
              </CardTitle>
              <CardDescription>Quản lý trạng thái hoạt động và thông tin liên hệ</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleUpdateInfo} className="space-y-6 max-w-2xl">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Họ và tên</Label>
                    <Input
                      value={infoForm.fullName}
                      onChange={e => setInfoForm({ ...infoForm, fullName: e.target.value })}
                      className="rounded-xl h-12 border-slate-200 focus:ring-emerald-500/10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Số điện thoại</Label>
                    <Input
                      value={infoForm.phone}
                      onChange={e => handlePhoneChange(e.target.value)}
                      placeholder="09xx xxx xxx"
                      className={`rounded-xl h-12 border-slate-200 ${phoneError ? 'border-red-400' : ''}`}
                    />
                    {phoneError && <p className="text-sm text-red-500 font-medium">{phoneError}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 block mb-3">Tài khoản</Label>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-sm font-semibold text-slate-600">Trạng thái hoạt động</span>
                      <Switch
                        checked={infoForm.isActive}
                        onCheckedChange={val => setInfoForm({ ...infoForm, isActive: val })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Địa chỉ Email</Label>
                    <div className="h-12 flex items-center px-4 bg-slate-100 rounded-xl text-slate-500 font-medium">
                      {staff.email}
                    </div>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={updatingInfo || !!phoneError}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-emerald-200 transition-all gap-2"
                >
                  {updatingInfo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Lưu thông tin nhân viên
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Pitches ──────────────────────────────────────── */}
        <TabsContent value="pitches" className="animate-in fade-in slide-in-from-left-4 duration-500 outline-none">
          {isInactive && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 text-amber-700 font-semibold">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              Nhân viên đang bị vô hiệu hóa — không thể thêm phân công sân mới.
            </div>
          )}
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-md">
              <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-white pb-6 border-b border-slate-100">
                <CardTitle className="text-xl font-bold">Phân công sân mới</CardTitle>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Chọn sân bóng</Label>
                  <Select value={selectedPitchId} onValueChange={setSelectedPitchId} disabled={isInactive}>
                    <SelectTrigger className="h-12 rounded-xl border-slate-200">
                      <SelectValue placeholder="Bấm để chọn sân..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100">
                      {pitches
                        .filter(p => !staff.assignedPitches.find(ap => ap.pitchId === parseInt(p.id)))
                        .map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name} (Sân {p.type})</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAssignPitch}
                  disabled={assigningPitch || !selectedPitchId || isInactive}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 disabled:opacity-50"
                >
                  {assigningPitch ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 mr-2" />}
                  Xác nhận Phân công
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800 ml-2">Sân đang quản lý ({staff.assignedPitches.length})</h3>
              {staff.assignedPitches.map(ap => (
                <div key={ap.assignmentId} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 font-bold">
                      {ap.pitchType}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{ap.pitchName}</p>
                      <p className="text-xs text-slate-500 font-medium">Phân công ngày: {formatDate(ap.assignedAt)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleUnassignPitch(ap.pitchId)}
                    className="rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              ))}
              {staff.assignedPitches.length === 0 && (
                <div className="p-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 italic text-slate-400">
                  Chưa có sân nào được phân công cho nhân viên này.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 3: Shifts ───────────────────────────────────────── */}
        <TabsContent value="shifts" className="animate-in fade-in slide-in-from-left-4 duration-500 outline-none">
          {isInactive && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 text-amber-700 font-semibold">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              Nhân viên đang bị vô hiệu hóa — không thể tạo ca làm việc mới.
            </div>
          )}
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Add Shift Form */}
            <div className="lg:col-span-4">
              <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-md sticky top-24">
                <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-white pb-6 border-b border-slate-100">
                  <CardTitle className="text-xl font-bold">Tạo Ca làm việc mới</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleCreateShift} className="space-y-4">

                    {/* Schedule Mode Selector */}
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Chế độ tạo lịch</Label>
                      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
                        {([
                          { value: 'single', label: 'Theo ngày' },
                          { value: 'weekdays', label: 'T2 – T6' },
                          { value: 'fullWeek', label: 'Cả tuần' },
                        ] as { value: ScheduleMode; label: string }[]).map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={isInactive}
                            onClick={() => { setScheduleMode(opt.value); setBulkResults(null); }}
                            className={`py-2 text-xs font-bold rounded-lg transition-all ${scheduleMode === opt.value ? 'bg-white shadow text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pitch selector */}
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Sân làm việc</Label>
                      <Select
                        value={newShift.pitchId.toString()}
                        onValueChange={val => setNewShift({ ...newShift, pitchId: parseInt(val) })}
                        disabled={isInactive}
                      >
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Chọn sân bóng..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {staff.assignedPitches.map(ap => (
                            <SelectItem key={ap.pitchId} value={ap.pitchId.toString()}>{ap.pitchName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Day selector — only for single mode */}
                    {scheduleMode === 'single' && (
                      <div className="space-y-2">
                        <Label className="font-bold text-slate-700">Thứ trong tuần</Label>
                        <Select
                          value={newShift.dayOfWeek.toString()}
                          onValueChange={val => setNewShift({ ...newShift, dayOfWeek: parseInt(val) })}
                          disabled={isInactive}
                        >
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {[1, 2, 3, 4, 5, 6, 7].map(d => (
                              <SelectItem key={d} value={d.toString()}>{getDayName(d)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {scheduleMode !== 'single' && (
                      <div className="px-3 py-2 bg-emerald-50 rounded-xl text-xs text-emerald-700 font-semibold">
                        {scheduleMode === 'weekdays' ? '📅 Sẽ tạo cho: Thứ Hai → Thứ Sáu' : '📅 Sẽ tạo cho: Thứ Hai → Chủ Nhật'}
                      </div>
                    )}

                    {/* Time pickers */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-bold text-slate-700">Giờ bắt đầu</Label>
                        <Input
                          type="time"
                          value={newShift.startTime}
                          onChange={e => setNewShift({ ...newShift, startTime: e.target.value })}
                          className="rounded-xl"
                          disabled={isInactive}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-slate-700">Giờ kết thúc</Label>
                        <Input
                          type="time"
                          value={newShift.endTime}
                          onChange={e => setNewShift({ ...newShift, endTime: e.target.value })}
                          className="rounded-xl"
                          disabled={isInactive}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={creatingShift || staff.assignedPitches.length === 0 || isInactive}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg mt-2 disabled:opacity-50"
                    >
                      {creatingShift
                        ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tạo lịch...</>
                        : <><Plus className="w-5 h-5 mr-2" />
                          {scheduleMode === 'single' ? 'Thêm Ca làm việc' : 'Tạo lịch hàng loạt'}
                        </>
                      }
                    </Button>
                  </form>

                  {/* Bulk Results Summary */}
                  {bulkResults && (
                    <div className="mt-5 space-y-2 relative bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase text-slate-500 tracking-wide">Kết quả tạo lịch hàng loạt</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setBulkResults(null)}
                          className="h-6 w-6 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        {bulkResults.map(r => (
                          <div
                            key={r.day}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold ${r.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}
                          >
                            <div className="flex items-center gap-2">
                              {r.success
                                ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                              <span>{r.dayName}</span>
                            </div>
                            {!r.success && <span className="text-[11px] font-medium opacity-80 max-w-[120px] text-right">{r.error}</span>}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-1 text-xs font-bold">
                        <span className="text-emerald-600">✓ {bulkResults.filter(r => r.success).length} thành công</span>
                        {bulkResults.filter(r => !r.success).length > 0 && (
                          <span className="text-red-500">✗ {bulkResults.filter(r => !r.success).length} trùng lịch</span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Shifts List */}
            <div className="lg:col-span-8 space-y-4">
              <h3 className="text-xl font-bold text-slate-800 ml-2">Bảng phân ca làm việc ({staff.shifts.length})</h3>
              <div className="grid gap-4">
                {staff.shifts.map(shift => (
                  <div key={shift.shiftId} className="bg-white/80 p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white rounded-2xl flex flex-col items-center justify-center border border-slate-100 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                        <span className="text-[10px] uppercase font-bold opacity-60">Thứ</span>
                        <span className="text-xl font-extrabold">{shift.dayOfWeek + 1 === 8 ? 'CN' : (shift.dayOfWeek + 1)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-slate-900">{getDayName(shift.dayOfWeek)}</p>
                          <Badge variant="outline" className="text-[10px] uppercase font-black px-2 border-emerald-100 text-emerald-600">
                            {shift.pitchName}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500 font-bold mt-1 uppercase tracking-wider">
                          <div className="flex items-center gap-1 text-emerald-600">
                            <Clock className="w-3 h-3" /> {shift.startTime.substring(0, 5)}
                          </div>
                          <span className="opacity-30">—</span>
                          <div className="flex items-center gap-1 text-orange-600">
                            <Timer className="w-3 h-3" /> {shift.endTime.substring(0, 5)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteShift(shift.shiftId)}
                      className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
                {staff.shifts.length === 0 && (
                  <div className="py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-bold">Chưa có ca làm việc nào được thiết lập.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
