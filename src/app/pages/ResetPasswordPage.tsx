import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Building2, AlertCircle, Key, Lock, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';

export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      toast.error('Vui lòng nhập email trước khi đặt lại mật khẩu');
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    const result = await resetPassword({
      email,
      token: otp,
      newPassword,
      confirmNewPassword: confirmPassword
    });

    if (result.success) {
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
      navigate('/login');
    } else {
      setError(result.message || 'Mã OTP không đúng hoặc đã hết hạn.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <Building2 className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white">Đặt lại mật khẩu</h1>
            <p className="text-slate-400">Nhập mã OTP và mật khẩu mới của bạn</p>
          </div>

          <Card className="backdrop-blur-sm bg-white/95 border-white/20 shadow-2xl">
            <CardHeader />
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-sm">Email: <span className="text-slate-900 font-semibold">{email}</span></Label>
                </div>

                {/* OTP Input */}
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-slate-700 font-semibold flex items-center gap-2">
                    <Key className="w-4 h-4" /> Mã OTP (6 chữ số)
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="Nhập mã 6 chữ số"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="bg-slate-50/50 border-slate-200 text-center text-xl tracking-widest font-bold h-12 focus:border-purple-400"
                    required
                  />
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-slate-700 font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Mật khẩu mới
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-slate-50/50 border-slate-200 h-12"
                    required
                  />
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-700 font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Xác nhận mật khẩu
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-50/50 border-slate-200 h-12"
                    required
                  />
                </div>

                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50/50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg"
                  disabled={loading}
                >
                  {loading ? 'Đang thực hiện...' : 'Xác nhận đổi mật khẩu'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-slate-600 hover:text-slate-900 flex items-center justify-center gap-2"
                  onClick={() => navigate('/forgot-password')}
                >
                  <ArrowLeft className="w-4 h-4" /> Quay lại bước trước
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
