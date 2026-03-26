import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Building2, AlertCircle, Mail, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { sendOtp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await sendOtp(email);

    if (result.success) {
      toast.success('Yêu cầu đã được gửi. Vui lòng kiểm tra email để lấy mã OTP.');
      // Chuyển sang trang reset password và truyền email qua state
      navigate('/reset-password', { state: { email } });
    } else {
      setError(result.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="relative min-h-screen flex items-center justify-center p-4">
        {/* Back to Home Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 flex items-center gap-2 text-white/70 hover:text-white transition-all group px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Quay lại trang chủ</span>
        </button>

        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <Building2 className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white">Quên mật khẩu</h1>
            <p className="text-slate-400">Nhập email của bạn để nhận mã xác thực OTP</p>
          </div>

          <Card className="backdrop-blur-sm bg-white/95 border-white/20 shadow-2xl">
            <CardHeader />
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Nhập email đã đăng ký"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-50/50 border-slate-200 focus:border-emerald-400 rounded-lg h-12 transition-all"
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
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-lg"
                  disabled={loading}
                >
                  {loading ? 'Đang gửi yêu cầu...' : 'Gửi mã xác thực'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-slate-600 hover:text-slate-900 flex items-center justify-center gap-2"
                  onClick={() => navigate('/login')}
                >
                  <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
