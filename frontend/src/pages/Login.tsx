import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface AnimatedEyeProps {
  className?: string;
  pupilSize?: string;
  variant?: 'sclera' | 'solid';
}

const AnimatedEye = ({ 
  className = "w-3 h-3", 
  pupilSize = "w-1 h-1",
  variant = 'sclera'
}: AnimatedEyeProps) => {
  const eyeRef = useRef<HTMLDivElement>(null);
  const pupilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!eyeRef.current) return;

      const eyeRect = eyeRef.current.getBoundingClientRect();
      const eyeCenterX = eyeRect.left + eyeRect.width / 2;
      const eyeCenterY = eyeRect.top + eyeRect.height / 2;

      const angle = Math.atan2(e.clientY - eyeCenterY, e.clientX - eyeCenterX);
      
      // Calculate max movement distance for the entire eye container
      const maxContainerMove = 3;
      const containerX = Math.cos(angle) * maxContainerMove;
      const containerY = Math.sin(angle) * maxContainerMove;
      
      // Move the eye container
      eyeRef.current.style.transform = `translate(${containerX}px, ${containerY}px)`;
      
      // If sclera variant, move the pupil inside as well
      if (variant === 'sclera' && pupilRef.current) {
        const maxPupilMove = 2;
        const pupilX = Math.cos(angle) * maxPupilMove;
        const pupilY = Math.sin(angle) * maxPupilMove;
        pupilRef.current.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [variant]);

  if (variant === 'solid') {
    return (
      <div 
        ref={eyeRef} 
        className={`${className} bg-black rounded-full relative transition-transform duration-75 ease-out`}
      />
    );
  }

  return (
    <div 
      ref={eyeRef} 
      className={`${className} bg-white rounded-full flex items-center justify-center relative overflow-hidden transition-transform duration-100 ease-out`}
    >
      <div 
        ref={pupilRef} 
        className={`${pupilSize} bg-black rounded-full absolute transition-transform duration-75 ease-out`} 
      />
    </div>
  );
};

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(false);

  const getDeviceId = () => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  };

  useEffect(() => {
    // Check if the user just logged out
    const isLoggingOut = sessionStorage.getItem('is_logging_out');
    if (isLoggingOut) {
      sessionStorage.removeItem('is_logging_out');
      return;
    }

    const savedToken = localStorage.getItem('remembered_token');
    const savedRole = localStorage.getItem('remembered_role');
    const savedDeviceId = localStorage.getItem('device_id');
    const currentDeviceId = getDeviceId();

    if (savedToken && savedRole && savedDeviceId === currentDeviceId) {
      login(savedToken);
      navigate('/dashboard');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/token', {
        username,
        password
      });
      const token = res.data.access_token;
      const role = res.data.role;
      
      login(token);
      
      if (rememberMe) {
        localStorage.setItem('remembered_token', token);
        localStorage.setItem('remembered_role', role);
        localStorage.setItem('device_id', getDeviceId());
      } else {
        localStorage.removeItem('remembered_token');
        localStorage.removeItem('remembered_role');
      }

      toast.success('登录成功');
      navigate('/dashboard');
    } catch {
      toast.error('用户名或密码错误');
    }
  };

  return (
    <div className="flex min-h-screen w-full font-sans bg-background">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-950 relative flex-col justify-between p-12 text-white overflow-hidden border-r border-white/5">
        {/* Background decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />

        {/* Logo */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 flex items-center justify-center group relative">
            <img src="/black.svg" className="w-9 h-9 object-contain transition-transform duration-500 group-hover:scale-110" alt="Logo" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Black
          </span>
        </div>

        {/* Characters Illustration */}
        <div className="absolute inset-0 flex items-end justify-center pointer-events-none pb-24">
            <div className="relative w-full h-full max-w-lg mx-auto">
                {/* Purple Character (Tall Left) */}
                <div className="absolute bottom-[20%] left-[25%] w-32 h-64 bg-primary rounded-t-xl transform -rotate-2 z-10 flex justify-center pt-8 shadow-2xl transition-transform hover:-translate-y-2 duration-300">
                    <div className="flex gap-6 mt-4">
                        <AnimatedEye className="w-3 h-3" pupilSize="w-1 h-1" variant="sclera" />
                        <AnimatedEye className="w-3 h-3" pupilSize="w-1 h-1" variant="sclera" />
                    </div>
                </div>

                {/* Black Character (Tall Right) */}
                <div className="absolute bottom-[15%] right-[28%] w-24 h-56 bg-zinc-800 rounded-t-xl transform rotate-2 z-0 flex justify-center pt-8 shadow-xl transition-transform hover:-translate-y-2 duration-300 delay-100">
                     <div className="flex gap-4 mt-2">
                        <AnimatedEye className="w-2.5 h-2.5" pupilSize="w-1 h-1" variant="sclera" />
                        <AnimatedEye className="w-2.5 h-2.5" pupilSize="w-1 h-1" variant="sclera" />
                    </div>
                </div>

                {/* Orange Character (Blob Left) */}
                <div className="absolute bottom-0 left-[15%] w-48 h-40 bg-accent rounded-t-full z-20 flex justify-center items-center shadow-2xl transition-transform hover:scale-105 duration-300 delay-75">
                    <div className="flex gap-10 mb-2">
                        <AnimatedEye className="w-2 h-2" variant="solid" />
                        <AnimatedEye className="w-2 h-2" variant="solid" />
                    </div>
                </div>

                {/* Yellow Character (Blob Right) */}
                <div className="absolute bottom-0 right-[15%] w-36 h-48 bg-yellow-400 rounded-t-full z-10 flex flex-col items-center pt-10 shadow-xl transition-transform hover:scale-105 duration-300 delay-150">
                    <div className="flex gap-8 mt-2">
                        <AnimatedEye className="w-1.5 h-1.5" variant="solid" />
                        <AnimatedEye className="w-1.5 h-1.5" variant="solid" />
                    </div>
                     <div className="w-10 h-0.5 bg-black mt-8 rounded-full opacity-80"></div>
                </div>
            </div>
        </div>

        {/* Footer Links */}
        <div className="flex gap-8 text-xs font-medium text-zinc-500 z-10">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background px-6 sm:px-8 py-12 overflow-y-auto">
        <div className="w-full max-w-[400px] py-8 sm:py-0">
          {/* Mobile Logo - Scaled 1.5x and moved up */}
          <div className="flex lg:hidden flex-col items-center gap-4 mb-16 -mt-20 animate-in fade-in slide-in-from-top-12 duration-1000">
            <div className="w-24 h-24 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-[2rem] border border-border shadow-md transition-transform hover:scale-105 duration-500">
              <img src="/black.svg" className="w-18 h-18 object-contain" alt="Logo" />
            </div>
            <span className="text-2xl font-black tracking-tight text-text">
              Black
            </span>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-[28px] font-bold tracking-tight text-text">
              欢迎回来！
            </h2>
            <p className="text-sm text-text-muted">
              请输入您的详细信息
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-text-muted">
                  账号
                </label>
                <input
                  id="email"
                  name="username"
                  type="text"
                  required
                  className="block w-full rounded-xl border-border bg-black/5 dark:bg-white/5 py-3 px-4 text-text placeholder:text-text-muted/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none border transition-all text-sm shadow-sm"
                  placeholder="you@example.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-text-muted">
                  密码
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="block w-full rounded-xl border-border bg-black/5 dark:bg-white/5 py-3 px-4 text-text placeholder:text-text-muted/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none border transition-all text-sm shadow-sm pr-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-muted hover:text-text transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border bg-black/5 dark:bg-white/5 text-primary focus:ring-primary accent-primary cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-text-muted cursor-pointer select-none">
                  7天内免登录
                </label>
              </div>

              <div className="text-sm">
                <button 
                  type="button"
                  onClick={() => toast.info('请联系管理员')}
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  忘记密码？
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <button
                type="submit"
                className="flex w-full justify-center items-center rounded-xl bg-primary px-3 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all active:scale-[0.98]"
              >
                登录
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
