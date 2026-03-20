import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { User, Lock, Phone, Mail, Calendar, ShieldCheck, AlertCircle, Save } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';

export function ProfilePage() {
  const { user, updateProfile, changePassword, logout } = useAuth();
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
      // Thường thì backend thu hồi token khi đổi mật khẩu, nên ta đăng xuất
      setTimeout(() => logout(), 2000);
    } else {
      setError(result.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Hồ sơ cá nhân</h1>
          <p className="text-slate-500">Quản lý thông tin tài khoản và bảo mật của bạn</p>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        {/* Sidebar / Tabs */}
        <div className="md:col-span-4 space-y-2">
          <Button
            variant={activeTab === 'info' ? 'default' : 'ghost'}
            className={`w-full justify-start gap-3 h-12 ${
              activeTab === 'info' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
            onClick={() => setActiveTab('info')}
          >
            <User className="w-5 h-5" /> Thông tin cá nhân
          </Button>
          <Button
            variant={activeTab === 'password' ? 'default' : 'ghost'}
            className={`w-full justify-start gap-3 h-12 ${
              activeTab === 'password' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
            onClick={() => setActiveTab('password')}
          >
            <Lock className="w-5 h-5" /> Đổi mật khẩu
          </Button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-8">
          {activeTab === 'info' ? (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Thông tin cá nhân</CardTitle>
                <CardDescription>Cập nhật họ tên và số điện thoại của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-600">Email (Không thể thay đổi)</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <Input
                          id="email"
                          value={user?.email || ''}
                          disabled
                          className="pl-10 bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-slate-700 font-medium">Họ và tên</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-emerald-500" />
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10 border-slate-200 focus:border-emerald-400"
                          placeholder="Nhập họ và tên"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-slate-700 font-medium">Số điện thoại</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-emerald-500" />
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-10 border-slate-200 focus:border-emerald-400"
                          placeholder="Nhập số điện thoại"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                       <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Vai trò
                          </p>
                          <p className="font-semibold text-slate-700">{user?.role}</p>
                       </div>
                       <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Ngày tham gia
                          </p>
                          <p className="font-semibold text-slate-700">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                          </p>
                       </div>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    disabled={loading}
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Đổi mật khẩu</CardTitle>
                <CardDescription>Đảm bảo mật khẩu của bạn có ít nhất 6 ký tự để bảo mật</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <Input
                          id="currentPassword"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="pl-10 border-slate-200"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Mật khẩu mới</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-emerald-500" />
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pl-10 border-slate-200 focus:border-emerald-400"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmNewPassword">Xác nhận mật khẩu mới</Label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-3 w-4 h-4 text-emerald-500" />
                        <Input
                          id="confirmNewPassword"
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="pl-10 border-slate-200 focus:border-emerald-400"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    disabled={loading}
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Đang thực hiện...' : 'Cập nhật mật khẩu'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
