import clsx from 'clsx';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Moon,
  Sun,
  User,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024 ? false : localStorage.getItem('sidebarCollapsed') === 'true';
    }
    return false;
  });
  const [isHovered, setIsHovered] = useState(false);
  const [isAdMenuOpen, setAdMenuOpen] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  const effectiveCollapsed = isCollapsed && !isHovered && window.innerWidth >= 1024;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    // Close sidebar when route changes on mobile
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = () => {
    logout();
    // Clear auto-login credentials
    localStorage.removeItem('remembered_token');
    localStorage.removeItem('remembered_role');
    localStorage.removeItem('device_id');
    // Set a flag to prevent immediate auto-login if any token remains (double safety)
    sessionStorage.setItem('is_logging_out', 'true');
    navigate('/login');
  };

  const navItemClass = (path: string) =>
    clsx(
      "flex items-center rounded-2xl text-[14px] font-semibold transition-all duration-300 relative group/item mb-1",
      effectiveCollapsed ? "justify-center p-3 mx-auto w-12 h-12" : "gap-4 px-4 py-3 mx-2",
      location.pathname === path
        ? "bg-black/[0.05] dark:bg-white/[0.08] text-text"
        : "text-text-muted hover:bg-black/[0.02] dark:hover:bg-white/[0.04] hover:text-text"
    );

  const iconContainerClass = (isActive: boolean) =>
    clsx(
      "flex items-center justify-center transition-all duration-300",
      effectiveCollapsed ? "w-6 h-6" : "w-5 h-5",
      isActive ? "text-text" : "text-text-muted group-hover/item:text-text"
    );

  return (
    <div className="h-screen bg-background text-text flex overflow-hidden font-sans relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        onMouseEnter={() => isCollapsed && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={clsx(
          "fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-border transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] lg:relative flex flex-col",
          effectiveCollapsed ? "w-20" : "w-64",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className={clsx("h-24 flex items-center gap-3 transition-all duration-500", effectiveCollapsed ? "px-4 justify-center" : "px-8")}>
          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 group cursor-pointer relative">
            <img src="/black.svg" className="w-9 h-9 object-contain transition-transform duration-500 group-hover:scale-110" alt="Logo" />
          </div>
          {!effectiveCollapsed && (
            <span className="text-xl font-black tracking-tight text-text animate-in fade-in zoom-in-95 duration-500">
              犀瞰聚合
            </span>
          )}
        </div>

        <nav className={clsx("flex-1 py-4 custom-scrollbar overflow-y-auto overflow-x-hidden", effectiveCollapsed ? "px-2" : "px-2")}>
          <Link to="/dashboard" className={navItemClass('/dashboard')}>
            <div className={iconContainerClass(location.pathname === '/dashboard')}>
              <LayoutDashboard size={effectiveCollapsed ? 22 : 20} strokeWidth={2.5} />
            </div>
            {!effectiveCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-500">总览</span>}
          </Link>

          <div className="relative group/item">
            <button
              onClick={() => !effectiveCollapsed && setAdMenuOpen(!isAdMenuOpen)}
              className={clsx(
                "w-full flex items-center rounded-2xl text-[14px] font-semibold text-text-muted hover:bg-black/[0.02] dark:hover:bg-white/[0.04] hover:text-text transition-all duration-300 mb-1",
                effectiveCollapsed ? "justify-center p-3 mx-auto w-12 h-12" : "justify-between px-4 py-3 mx-2 w-auto"
              )}
            >
              <div className={clsx("flex items-center", effectiveCollapsed ? "" : "gap-4")}>
                <div className={iconContainerClass(['/media', '/codeslots', '/data-overview', '/codeslot-data'].includes(location.pathname))}>
                  <Megaphone size={effectiveCollapsed ? 22 : 20} strokeWidth={2.5} />
                </div>
                {!effectiveCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-500">广告管理</span>}
              </div>
              {!effectiveCollapsed && (
                <div className={clsx("transition-transform duration-500", isAdMenuOpen ? "rotate-180" : "")}>
                  <ChevronDown size={16} strokeWidth={3} />
                </div>
              )}
            </button>

            {isAdMenuOpen && !effectiveCollapsed && (
              <div className="mx-4 mt-1 space-y-1 border-l-2 border-border pl-6 animate-in slide-in-from-top-2 duration-500">
                {[
                  ...(isAdmin ? [
                    { to: '/media', label: '媒体管理' },
                    { to: '/codeslots', label: '代码位管理' },
                  ] : []),
                  { to: '/data-overview', label: '数据概览' },
                  { to: '/codeslot-data', label: '代码位数据' }
                ].map(item => (
                  <Link 
                    key={item.to} 
                    to={item.to} 
                    className={clsx(
                      "block py-2 text-[13px] font-medium transition-colors",
                      location.pathname === item.to ? "text-primary" : "text-text-muted hover:text-text"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link to="/account" className={navItemClass('/account')}>
            <div className={iconContainerClass(location.pathname === '/account')}>
              <User size={effectiveCollapsed ? 22 : 20} strokeWidth={2.5} />
            </div>
            {!effectiveCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-500">个人设置</span>}
          </Link>

          {isAdmin && (
            <Link to="/users" className={navItemClass('/users')}>
              <div className={iconContainerClass(location.pathname === '/users')}>
                <Users size={effectiveCollapsed ? 22 : 20} strokeWidth={2.5} />
              </div>
              {!effectiveCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-500">用户管理</span>}
            </Link>
          )}
        </nav>

        <div className={clsx("border-t border-border bg-sidebar transition-all duration-500", effectiveCollapsed ? "p-2" : "p-4")}>
          <div className={clsx("flex items-center mb-4 bg-black/[0.03] dark:bg-white/[0.05] rounded-3xl border border-border overflow-hidden transition-all duration-500 group/user relative", effectiveCollapsed ? "w-12 h-12 justify-center mx-auto" : "gap-3 px-4 py-3")}>
            <div className={clsx("rounded-full bg-primary/10 flex items-center justify-center text-sm font-black text-primary border border-primary/20 shadow-inner flex-shrink-0 transition-all duration-500", effectiveCollapsed ? "w-9 h-9" : "w-10 h-10")}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!effectiveCollapsed && (
              <div className="flex-1 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-500">
                <p className="text-sm font-bold text-text truncate">{user?.username}</p>
                <p className="text-[11px] text-text-muted truncate font-bold uppercase tracking-widest opacity-60">{user?.role === 'admin' ? '管理员' : '普通用户'}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={clsx(
              "flex items-center rounded-2xl text-[14px] font-bold text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-all group/logout relative",
              effectiveCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-4 px-4 py-3 w-full"
            )}
          >
            <LogOut size={effectiveCollapsed ? 22 : 20} strokeWidth={2.5} />
            {!effectiveCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-500">退出登录</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-background transition-all duration-500 overflow-hidden relative w-full">
        <header className="h-16 lg:h-20 border-b border-border flex items-center justify-between px-4 lg:px-10 bg-background/80 backdrop-blur-xl sticky top-0 z-40 w-full">
          <div className="flex items-center gap-2 lg:gap-6">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-text-muted hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              <Menu size={22} />
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-2.5 rounded-2xl text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-primary transition-all duration-500 border border-transparent"
            >
              <div className={clsx("transition-transform duration-500", isCollapsed ? "" : "rotate-180")}>
                <ChevronRight size={20} strokeWidth={3} />
              </div>
            </button>
          </div>
          
          <div className="flex-1" />

          <div className="flex items-center gap-2 lg:gap-4">
            <button className="hidden sm:flex p-2.5 rounded-xl text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
            </button>
            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl lg:rounded-2xl border border-border scale-90 lg:scale-100">
              <button
                onClick={() => setTheme('light')}
                className={clsx(
                  "p-1.5 rounded-lg lg:rounded-xl transition-all",
                  theme === 'light' ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text"
                )}
              >
                <Sun size={16} className="lg:size-[18px]" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={clsx(
                  "p-1.5 rounded-lg lg:rounded-xl transition-all",
                  theme === 'dark' ? "bg-zinc-800 text-primary shadow-sm shadow-black/20" : "text-text-muted hover:text-text"
                )}
              >
                <Moon size={16} className="lg:size-[18px]" />
              </button>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/20 ring-4 ring-primary/5 text-sm lg:text-base">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 p-4 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
