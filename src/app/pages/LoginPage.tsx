import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Building2, AlertCircle, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(email, password);

    if (success) {
      navigate('/');
    } else {
      setError('Email hoặc mật khẩu không đúng');
    }

    setLoading(false);
  };

  const quickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('password');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Branding Section */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-purple-500 rounded-2xl blur-xl opacity-50"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Football Booking</h1>
              <p className="text-emerald-200/80">Đặt sân bóng yêu thích của bạn</p>
            </div>
          </div>

          {/* Login Card - Modern Design */}
          <Card className="backdrop-blur-sm bg-white/95 border-white/20 shadow-2xl">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-2xl bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
                Đăng nhập
              </CardTitle>
              <CardDescription className="text-slate-600">
                Truy cập hệ thống với tài khoản của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-semibold">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Nhập email của bạn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-50/50 border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 rounded-lg h-12 transition-all placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-semibold">Mật khẩu</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-50/50 border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 rounded-lg h-12 transition-all placeholder:text-slate-400"
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

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  disabled={loading}
                >
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500 font-medium">Demo</span>
                </div>
              </div>

              {/* Quick Login Demo */}
              <div className="space-y-2">
                <p className="text-sm text-slate-600 text-center font-medium">
                  <Zap className="w-4 h-4 inline mr-1 text-amber-500" />
                  Đăng nhập nhanh:
                </p>
                <div className="grid gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin('admin@football.com')}
                    className="w-full justify-between hover:bg-gradient-to-r hover:from-emerald-50 hover:to-purple-50 border-slate-200 hover:border-emerald-300 transition-all"
                  >
                    <span className="font-semibold text-slate-700">Admin</span>
                    <span className="text-xs text-slate-500">admin@football.com</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin('staff@football.com')}
                    className="w-full justify-between hover:bg-gradient-to-r hover:from-emerald-50 hover:to-purple-50 border-slate-200 hover:border-emerald-300 transition-all"
                  >
                    <span className="font-semibold text-slate-700">Staff</span>
                    <span className="text-xs text-slate-500">staff@football.com</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin('customer@football.com')}
                    className="w-full justify-between hover:bg-gradient-to-r hover:from-emerald-50 hover:to-purple-50 border-slate-200 hover:border-emerald-300 transition-all"
                  >
                    <span className="font-semibold text-slate-700">Customer</span>
                    <span className="text-xs text-slate-500">customer@football.com</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-white/60 text-sm">
            Nền tảng quản lý sân bóng hiện đại
          </p>
        </div>
      </div>
    </div>
  );
}
