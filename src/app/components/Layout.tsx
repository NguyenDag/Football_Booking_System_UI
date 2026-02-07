import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  LogOut,
  Menu,
  X,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    const baseItems = [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    ];

    if (user?.role === 'ADMIN') {
      return [
        ...baseItems,
        { path: '/fields', label: 'Quản lý sân', icon: Building2 },
        { path: '/staff', label: 'Nhân viên', icon: Users },
        { path: '/bookings', label: 'Đặt lịch', icon: Calendar },
        { path: '/statistics', label: 'Thống kê', icon: BarChart3 },
      ];
    }

    if (user?.role === 'STAFF') {
      return [
        ...baseItems,
        { path: '/bookings', label: 'Quản lý lịch', icon: Calendar },
      ];
    }

    if (user?.role === 'CUSTOMER') {
      return [
        ...baseItems,
        { path: '/book-field', label: 'Đặt sân', icon: Calendar },
        { path: '/my-bookings', label: 'Lịch của tôi', icon: Calendar },
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      {/* Modern Header */}
      <header className="bg-gradient-to-r from-white via-white to-slate-50 border-b border-slate-200/50 sticky top-0 z-50 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-lg hidden sm:inline bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
                Football Booking
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className={`gap-2 transition-all ${isActive
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md'
                          : 'hover:bg-slate-100 text-slate-700'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {/* User Info */}
              <div className="hidden sm:block text-right">
                <div className="text-sm font-semibold text-slate-900">{user?.name}</div>
                <div className="text-xs text-slate-500 font-medium">{user?.role}</div>
              </div>

              {/* Desktop Logout */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2 hidden md:flex text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden text-slate-700"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-3 space-y-1 border-t border-slate-200/50 bg-gradient-to-b from-white to-slate-50">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className={`w-full justify-start gap-2 transition-all ${isActive
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md'
                          : 'hover:bg-slate-100 text-slate-700'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-slate-700 hover:bg-red-50 hover:text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </Button>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>

      {/* Modern Footer */}
      <footer className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700/50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                Football Booking
              </h3>
              <p className="text-slate-300 text-sm">
                Nền tảng đặt sân bóng hiện đại, tiện lợi cho cộng đồng yêu bóng đá.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Tính năng</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>Đặt sân trực tuyến</li>
                <li>Quản lý lịch đặt</li>
                <li>Thống kê doanh thu</li>
                <li>Quản lý nhân viên</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Liên hệ</h4>
              <p className="text-slate-300 text-sm">Email: info@footballbooking.com</p>
              <p className="text-slate-300 text-sm">Phone: (028) 1234 5678</p>
            </div>
          </div>
          <div className="border-t border-slate-700/50 pt-6">
            <p className="text-center text-sm text-slate-400">
              © 2026 Football Booking System. Tất cả quyền được bảo lưu. | <span className="text-emerald-400">Thiết kế hiện đại cho giới trẻ 🚀</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
