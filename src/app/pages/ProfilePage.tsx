import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { 
  User, 
  Lock, 
  Phone, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  AlertCircle, 
  Save, 
  ArrowLeft,
  ChevronRight,
  UserCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';

export function ProfilePage() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Info form state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await updateProfile({ fullName, phone });

    if (result.success) {
      toast.success('Cập nhật thông tin thành công!');
    } else {
      setError(result.message || 'Cập nhật thông tin thất bại');
    }
    setLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmNewPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    const result = await changePassword({
      currentPassword,
      newPassword,
      confirmNewPassword
    });

    if (result.success) {
      toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
      setTimeout(() => logout(), 2000);
    } else {
      setError(result.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 -z-10 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 -z-10 w-80 h-80 bg-purple-100/50 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header with Back Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-xl border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Hồ sơ cá nhân</h1>
              <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                <span>Hệ thống</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-emerald-600 font-medium">Cài đặt tài khoản</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-2 bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 shadow-sm">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <UserCircle className="w-7 h-7" />
            </div>
            <div className="pr-4">
              <p className="text-sm font-bold text-slate-900">{user?.fullName}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{user?.role}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white/70 backdrop-blur-xl p-3 rounded-3xl border border-white/50 shadow-xl space-y-2">
              <button
                onClick={() => setActiveTab('info')}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${
                  activeTab === 'info' 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-200 shadow-lg scale-[1.02]' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${activeTab === 'info' ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-emerald-100'}`}>
                  <User className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">Thông tin cá nhân</p>
                  <p className={`text-xs ${activeTab === 'info' ? 'text-emerald-50' : 'text-slate-400'}`}>Cập nhật hồ sơ của bạn</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('password')}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${
                  activeTab === 'password' 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-200 shadow-lg scale-[1.02]' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${activeTab === 'password' ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-emerald-100'}`}>
                  <Lock className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">Đổi mật khẩu</p>
                  <p className={`text-xs ${activeTab === 'password' ? 'text-emerald-50' : 'text-slate-400'}`}>Tăng cường bảo mật</p>
                </div>
              </button>
            </div>

            {/* Account Status Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-all"></div>
              <ShieldCheck className="w-10 h-10 text-emerald-400 mb-4" />
              <h3 className="text-lg font-bold mb-1">Trạng thái bảo mật</h3>
              <p className="text-slate-400 text-sm mb-4">Tài khoản của bạn đang ở trạng thái an toàn.</p>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-full"></div>
                </div>
                <span className="text-xs font-bold text-emerald-400">100%</span>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8">
            <div className="transition-all duration-500 ease-in-out">
              {activeTab === 'info' ? (
                <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-md">
                  <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-white pb-8 border-b border-slate-100">
                    <div className="flex items-center gap-4 mb-2">
                       <div className="p-3 bg-emerald-100 rounded-2xl">
                          <User className="w-6 h-6 text-emerald-600" />
                       </div>
                       <div>
                          <CardTitle className="text-2xl font-bold text-slate-900">Thông tin cá nhân</CardTitle>
                          <CardDescription className="text-slate-500 text-base">Cập nhật những thông tin cơ bản nhất của bạn</CardDescription>
                       </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-8">
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-bold text-slate-700">Email (Định danh)</Label>
                          <div className="relative group">
                            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-300 transition-colors group-focus-within:text-emerald-500" />
                            <Input
                              id="email"
                              value={user?.email || ''}
                              disabled
                              className="pl-11 h-12 bg-slate-50 border-slate-200 text-slate-400 font-medium rounded-xl cursor-not-allowed border-dashed"
                            />
                            <div className="absolute right-3 top-3.5">
                              <ShieldCheck className="w-5 h-5 text-slate-300" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="fullName" className="text-sm font-bold text-slate-700">Họ và tên</Label>
                          <div className="relative group">
                            <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-300 transition-colors group-focus-within:text-emerald-500" />
                            <Input
                              id="fullName"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="pl-11 h-12 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl transition-all shadow-sm"
                              placeholder="Nhập họ và tên đầy đủ"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-bold text-slate-700">Số điện thoại</Label>
                          <div className="relative group">
                            <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-300 transition-colors group-focus-within:text-emerald-500" />
                            <Input
                              id="phone"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="pl-11 h-12 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl transition-all shadow-sm"
                              placeholder="Nhập số điện thoại liên lạc"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-slate-700">Ngày tham gia</Label>
                          <div className="relative group">
                            <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-slate-300" />
                            <div className="pl-11 h-12 flex items-center bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium">
                              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN', { 
                                day: '2-digit', 
                                month: 'long', 
                                year: 'numeric' 
                              }) : 'Chưa cập nhật'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {error && (
                        <Alert variant="destructive" className="rounded-2xl border-red-100 bg-red-50/50">
                          <AlertCircle className="h-5 w-5" />
                          <AlertDescription className="font-medium">{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="pt-4">
                        <Button
                          type="submit"
                          className="w-full md:w-auto px-8 h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-3"
                          disabled={loading}
                        >
                          <Save className="w-5 h-5" />
                          {loading ? 'Đang lưu dữ liệu...' : 'Lưu tất cả thay đổi'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-md">
                  <CardHeader className="bg-gradient-to-r from-purple-50/50 to-white pb-8 border-b border-slate-100">
                    <div className="flex items-center gap-4 mb-2">
                       <div className="p-3 bg-purple-100 rounded-2xl">
                          <Lock className="w-6 h-6 text-purple-600" />
                       </div>
                       <div>
                          <CardTitle className="text-2xl font-bold text-slate-900">Bảo mật mật khẩu</CardTitle>
                          <CardDescription className="text-slate-500 text-base">Nên thay đổi mật khẩu định kỳ để bảo vệ tài khoản</CardDescription>
                       </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-8">
                    <form onSubmit={handleChangePassword} className="space-y-6">
                      <div className="space-y-6 max-w-lg">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword" className="text-sm font-bold text-slate-700">Mật khẩu hiện tại</Label>
                          <div className="relative group">
                            <ShieldCheck className="absolute left-3 top-3.5 w-5 h-5 text-slate-300 transition-colors group-focus-within:text-purple-500" />
                            <Input
                              id="currentPassword"
                              type="password"
                              placeholder="••••••••"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className="pl-11 h-12 border-slate-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl transition-all shadow-sm"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="newPassword" className="text-sm font-bold text-slate-700">Mật khẩu mới</Label>
                            <div className="relative group">
                              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-300 transition-colors group-focus-within:text-purple-500" />
                              <Input
                                id="newPassword"
                                type="password"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="pl-11 h-12 border-slate-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl transition-all shadow-sm"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirmNewPassword" className="text-sm font-bold text-slate-700">Xác nhận mật khẩu</Label>
                            <div className="relative group">
                              <ShieldCheck className="absolute left-3 top-3.5 w-5 h-5 text-slate-300 transition-colors group-focus-within:text-purple-500" />
                              <Input
                                id="confirmNewPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                className="pl-11 h-12 border-slate-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl transition-all shadow-sm"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {error && (
                        <Alert variant="destructive" className="rounded-2xl border-red-100 bg-red-50/50 max-w-lg">
                          <AlertCircle className="h-5 w-5" />
                          <AlertDescription className="font-medium">{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="pt-4">
                        <Button
                          type="submit"
                          className="w-full md:w-auto px-8 h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-3"
                          disabled={loading}
                        >
                          <Save className="w-5 h-5" />
                          {loading ? 'Đang thực hiện...' : 'Cập nhật mật khẩu ngay'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
