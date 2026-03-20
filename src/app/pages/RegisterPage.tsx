import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Building2, AlertCircle, UserPlus, Phone, Mail, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // --- Validation Logic ---
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/; // Vietnamese phone format

    if (formData.fullName.trim().length < 2) {
      setError('Họ tên phải có ít nhất 2 ký tự');
      return;
    }

    if (!emailRegex.test(formData.email)) {
      setError('Email không đúng định dạng (VD: example@gmail.com)');
      return;
    }

    if (formData.phone && !phoneRegex.test(formData.phone)) {
      setError('Số điện thoại không đúng định dạng Việt Nam');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);

    const result = await register(formData);

    if (result.success) {
      toast.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } else {
      setError(result.message || 'Đăng ký không thành công. Vui lòng thử lại.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-lg space-y-6">
          {/* Branding Section */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-2xl blur-xl opacity-50"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Gia Nhập Ngay</h1>
              <p className="text-emerald-200/80">Tạo tài khoản để bắt đầu đặt sân</p>
            </div>
          </div>

          <Card className="backdrop-blur-sm bg-white/95 border-white/20 shadow-2xl">
            <CardHeader className="space-y-2 pb-6 text-center">
              <CardTitle className="text-2xl bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
                Đăng ký tài khoản
              </CardTitle>
              <CardDescription className="text-slate-600">
                Nhập thông tin cá nhân của bạn bên dưới
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-slate-700 font-semibold flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> Họ và tên
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="bg-slate-50/50 border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 rounded-lg h-11 transition-all"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="bg-slate-50/50 border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 rounded-lg h-11 transition-all"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-700 font-semibold flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Số điện thoại
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0123456789"
                    value={formData.phone}
                    onChange={handleChange}
                    className="bg-slate-50/50 border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 rounded-lg h-11 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700 font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Mật khẩu
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="bg-slate-50/50 border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 rounded-lg h-11 transition-all"
                      required
                    />
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-700 font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Xác nhận
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="bg-slate-50/50 border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 rounded-lg h-11 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50/50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Register Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl mt-4"
                  disabled={loading}
                >
                  {loading ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}
                </Button>
              </form>

              {/* Back to Login */}
              <div className="mt-6 text-center">
                <p className="text-slate-600 text-sm">
                  Đã có tài khoản?{' '}
                  <button
                    onClick={() => navigate('/login')}
                    className="text-emerald-600 font-bold hover:underline"
                  >
                    Đăng nhập
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
