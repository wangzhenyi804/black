import { useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Shield, Lock, CheckCircle2 } from 'lucide-react';

export default function Account() {
  const { user } = useAuth();
  const toast = useToast();
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error('新密码两次输入不一致');
      return;
    }
    try {
      await api.put('/users/me/password', {
        old_password: passwords.old,
        new_password: passwords.new
      });
      toast.success('密码已成功更新');
      setPasswords({ old: '', new: '', confirm: '' });
    } catch (err) {
      toast.error('密码更新失败，请检查旧密码是否正确');
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-text">账户设置</h1>
        <p className="text-sm text-text-muted">管理您的个人资料、安全偏好和账户信息。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-4">
           <div className="bg-card border border-border p-6 rounded-2xl backdrop-blur-md">
              <div className="flex flex-col items-center text-center">
                 <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20">
                    <User className="w-10 h-10 text-primary" />
                 </div>
                 <h3 className="text-lg font-bold text-text">{user?.username}</h3>
                 <p className="text-xs text-text-muted mt-1 uppercase tracking-widest font-bold">{user?.role === 'admin' ? '管理员' : '普通用户'}</p>
                 
                 <div className="w-full h-px bg-border my-6" />
                 
                 <div className="w-full space-y-4 text-left">
                    <div className="flex items-center justify-between">
                       <span className="text-xs text-text-muted font-medium">账户状态</span>
                       <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> 已激活
                       </span>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-xs text-text-muted font-medium">权限级别</span>
                       <span className="text-xs text-text font-semibold capitalize">{user?.role === 'admin' ? '管理员' : '普通用户'}</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-card border border-border p-5 rounded-2xl backdrop-blur-md">
              <div className="flex items-start gap-3">
                 <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Shield className="w-4 h-4 text-amber-500" />
                 </div>
                 <div>
                    <h4 className="text-sm font-semibold text-text">安全提示</h4>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">定期更改密码并使用高强度组合，能有效保障您的账户安全。</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Settings Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border border-border p-8 rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-primary/10 rounded-lg">
                 <Lock className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-text">修改登录密码</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">当前密码</label>
                  <input
                    type="password"
                    required
                    className="block w-full rounded-xl border-border bg-black/5 dark:bg-white/5 py-3 px-4 text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none border transition-all text-sm"
                    placeholder="输入当前使用的密码"
                    value={passwords.old}
                    onChange={e => setPasswords({ ...passwords, old: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">新密码</label>
                    <input
                      type="password"
                      required
                      className="block w-full rounded-xl border-border bg-black/5 dark:bg-white/5 py-3 px-4 text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none border transition-all text-sm"
                      placeholder="输入 6 位以上新密码"
                      value={passwords.new}
                      onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">确认新密码</label>
                    <input
                      type="password"
                      required
                      className="block w-full rounded-xl border-border bg-black/5 dark:bg-white/5 py-3 px-4 text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none border transition-all text-sm"
                      placeholder="再次输入新密码"
                      value={passwords.confirm}
                      onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex justify-center items-center gap-2 rounded-xl bg-primary py-3 px-8 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  更新安全密码
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
