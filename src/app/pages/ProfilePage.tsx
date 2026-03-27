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
  UserCircle,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  CreditCard
} from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';
import { walletService, WalletDTO } from '../api/wallet.service';
import { useEffect } from 'react';

export function ProfilePage() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'password' | 'wallet'>('info');
  const [wallet, setWallet] = useState<WalletDTO | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
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

  const fetchWallet = async () => {
    setWalletLoading(true);
    try {
      const data = await walletService.getMyWallet();
      setWallet(data);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải thông tin ví');
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'wallet') {
      fetchWallet();
    }
  }, [activeTab]);

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

              <button
                onClick={() => setActiveTab('wallet')}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${
                  activeTab === 'wallet' 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-200 shadow-lg scale-[1.02]' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${activeTab === 'wallet' ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-emerald-100'}`}>
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">Ví của tôi</p>
                  <p className={`text-xs ${activeTab === 'wallet' ? 'text-emerald-50' : 'text-slate-400'}`}>Số dư & Giao dịch</p>
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
              ) : activeTab === 'wallet' ? (
                <div className="space-y-6">
                  {/* Balance Card */}
                  <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Wallet className="w-32 h-32" />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-emerald-100 font-medium">Số dư khả dụng</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-8">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-extrabold tracking-tight">
                          {wallet?.balance.toLocaleString('vi-VN')}
                        </span>
                        <span className="text-2xl font-bold text-emerald-200">VNĐ</span>
                      </div>
                      <div className="mt-8 flex gap-4">
                        <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-300" />
                          <span className="text-sm font-medium">Tài khoản đã xác thực</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Transactions Table */}
                  <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-md">
                    <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-100 rounded-2xl">
                          <History className="w-6 h-6 text-slate-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-slate-900">Lịch sử giao dịch</CardTitle>
                          <CardDescription>20 giao dịch gần đây nhất</CardDescription>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={fetchWallet} 
                        disabled={walletLoading}
                        className="rounded-xl hover:bg-slate-100"
                      >
                        Làm mới
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      {walletLoading ? (
                        <div className="p-12 text-center">
                          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-slate-500">Đang tải giao dịch...</p>
                        </div>
                      ) : wallet?.recentTransactions.length === 0 ? (
                        <div className="p-12 text-center">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-slate-300" />
                          </div>
                          <p className="text-slate-500 font-medium">Chưa có giao dịch nào</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Loại</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nội dung</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Số tiền</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {wallet?.recentTransactions.map((t) => (
                                <tr key={t.transactionId} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      {t.direction === 'CREDIT' ? (
                                        <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
                                      ) : (
                                        <ArrowDownCircle className="w-4 h-4 text-red-500" />
                                      )}
                                      <span className={`text-sm font-bold ${
                                        t.transactionType === 'TOP_UP' ? 'text-emerald-600' : 
                                        t.transactionType === 'BOOKING_PAYMENT' ? 'text-blue-600' :
                                        t.transactionType === 'REFUND' ? 'text-purple-600' : 'text-slate-600'
                                      }`}>
                                        {t.transactionType === 'TOP_UP' ? 'Nạp tiền' : 
                                         t.transactionType === 'BOOKING_PAYMENT' ? 'Thanh toán' :
                                         t.transactionType === 'REFUND' ? 'Hoàn tiền' : t.transactionType}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <p className="text-sm text-slate-600 line-clamp-1">{t.description}</p>
                                    {t.bookingId && (
                                      <p className="text-[10px] text-slate-400 font-medium uppercase mt-1">Đơn hàng DH{t.bookingId}</p>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`text-sm font-bold ${t.direction === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}`}>
                                      {t.direction === 'CREDIT' ? '+' : '-'}{t.amount.toLocaleString('vi-VN')}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <p className="text-xs text-slate-500">
                                      {new Date(t.createdAt).toLocaleDateString('vi-VN')}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      {new Date(t.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
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
