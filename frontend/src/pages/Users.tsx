import clsx from 'clsx';
import { Edit2, Key, Plus, RefreshCw, Trash2, User, UserPlus, X, ChevronRight, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../api/client';
import Pagination from '../components/Pagination';
import Select from '../components/Select';
import { useToast } from '../context/ToastContext';

interface User {
  id: number;
  username: string;
  role: string;
  is_active: boolean;
}

interface EditUserForm {
  id: number;
  username: string;
  password?: string;
  role: string;
  is_active: boolean;
}

export default function Users() {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, size: 10, total: 0 });
  const [formData, setFormData] = useState({ username: '', password: '', role: 'user' });
  const [resetPwd, setResetPwd] = useState({ userId: 0, newPassword: '' });
  const [editingUser, setEditingUser] = useState<EditUserForm | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [pagination.current, pagination.size]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // 严格匹配后端控制器路径 /users/
      const res = await api.get('/users', {
        params: {
          page: pagination.current,
          size: pagination.size
        }
      });
      
      console.log('User API Response:', res.data); // 增加日志方便调试
      
      // 深度解析数据结构：支持原始 IPage 或被包装的 Result 结构
      const responseData = res.data?.data || res.data;
      const records = responseData?.records || (Array.isArray(responseData) ? responseData : []);
      const total = responseData?.total || records.length || 0;
      
      setUsers(records);
      setPagination(prev => ({ ...prev, total }));
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', formData);
      setIsFormOpen(false);
      setFormData({ username: '', password: '', role: 'user' });
      toast.success('用户创建成功');
      fetchUsers();
    } catch (err) {
      console.error('Create user error:', err);
      toast.error('创建用户失败');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      const payload: Record<string, string | boolean> = {
        username: editingUser.username,
        role: editingUser.role,
        is_active: editingUser.is_active
      };
      if (editingUser.password) {
        payload.password = editingUser.password;
      }
      
      await api.put(`/users/${editingUser.id}`, payload);
      toast.success('用户信息已更新');
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Update user error:', err);
      toast.error('更新用户失败');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/users/${deleteConfirmId}`);
      toast.success('用户已成功删除');
      fetchUsers();
    } catch (err) {
      console.error('Delete user error:', err);
      toast.error('删除用户失败');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/users/${resetPwd.userId}/reset-password`, { new_password: resetPwd.newPassword });
      setResetPwd({ userId: 0, newPassword: '' });
      toast.success('密码重置成功');
    } catch (err) {
      console.error('Reset password error:', err);
      toast.error('密码重置失败');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '系统管理员';
      case 'user': return '普通用户';
      default: return role;
    }
  };

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'admin': return 'text-primary border-primary/20 bg-primary/5';
      case 'user': return 'text-text-muted border-border bg-black/5 dark:bg-white/5';
      default: return 'text-text-muted border-border bg-black/5 dark:bg-white/5';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-4 lg:space-y-6">
      <div className="flex-shrink-0 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-text">用户管理</h1>
        <p className="text-sm text-text-muted">创建、编辑和管理系统访问权限。</p>
      </div>

      <div className="flex-shrink-0 bg-card border border-border p-4 lg:p-6 rounded-2xl backdrop-blur-md relative z-40 overflow-visible">
        <div 
          className="flex items-center justify-between cursor-pointer lg:cursor-default"
          onClick={() => window.innerWidth < 1024 && setIsFormOpen(!isFormOpen)}
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 lg:p-2 bg-primary/10 rounded-lg">
              <UserPlus className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
            </div>
            <h3 className="text-sm lg:text-lg font-bold text-text tracking-tight">创建新用户</h3>
          </div>
          <button className="lg:hidden p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all">
            <ChevronRight className={clsx("w-4 h-4 text-text-muted transition-transform duration-300", isFormOpen ? "rotate-90" : "")} />
          </button>
        </div>
        
        <div className={clsx(
          "transition-all duration-300 ease-in-out lg:block lg:opacity-100 lg:mt-6",
          isFormOpen ? "mt-6 opacity-100 max-h-[500px] overflow-visible" : "max-h-0 opacity-0 lg:max-h-none overflow-hidden lg:overflow-visible"
        )}>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-4 items-end">
            <div className="space-y-1.5 lg:space-y-2">
              <label className="text-[10px] lg:text-xs font-bold text-text-muted uppercase tracking-wider">用户名</label>
              <input
                type="text"
                required
                className="block w-full rounded-xl border-border bg-black/5 dark:bg-white/5 py-2 lg:py-2.5 px-3 lg:px-4 text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none border transition-all text-xs lg:text-sm"
                placeholder="输入登录用户名"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 lg:space-y-2">
              <label className="text-[10px] lg:text-xs font-bold text-text-muted uppercase tracking-wider">初始密码</label>
              <input
                type="password"
                required
                className="block w-full rounded-xl border-border bg-black/5 dark:bg-white/5 py-2 lg:py-2.5 px-3 lg:px-4 text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none border transition-all text-xs lg:text-sm"
                placeholder="输入初始密码"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 lg:space-y-2">
              <label className="text-[10px] lg:text-xs font-bold text-text-muted uppercase tracking-wider">分配角色</label>
              <Select
                value={formData.role}
                onChange={(val) => setFormData({ ...formData, role: String(val) })}
                options={[
                  { value: 'user', label: '普通用户' },
                  { value: 'admin', label: '系统管理员' }
                ]}
                placeholder="分配角色"
                className="bg-black/5 dark:bg-white/5"
                size="sm"
              />
            </div>
            <button
              type="submit"
              className="inline-flex justify-center items-center gap-2 rounded-xl bg-primary py-2 lg:py-2.5 px-6 text-xs lg:text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              立即创建
            </button>
          </form>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 min-h-0 bg-card border border-border rounded-2xl flex flex-col backdrop-blur-md overflow-hidden">
        <div className="flex-1 overflow-auto min-h-0 rounded-t-2xl custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-black/5 dark:bg-white/5 backdrop-blur-md sticky top-0 z-20">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border">用户信息</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border">角色</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border">账号状态</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border text-right">管理操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="group hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 ring-4 ring-primary/5">
                        <User size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-text">{u.username}</span>
                        <span className="text-[10px] text-text-muted font-mono uppercase">ID: {u.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-current/10",
                      getRoleStyle(u.role)
                    )}>
                      {getRoleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx(
                      "inline-flex items-center gap-1.5 text-[10px] font-bold",
                      u.is_active ? "text-emerald-500" : "text-text-muted"
                    )}>
                      <div className={clsx("w-1.5 h-1.5 rounded-full", u.is_active ? "bg-emerald-500" : "bg-zinc-600")} />
                      {u.is_active ? '正常运行' : '已禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {u.role !== 'admin' && (
                        <>
                          <button
                            onClick={() => setEditingUser({ ...u, password: '' })}
                            className="p-2 text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all"
                            title="编辑用户"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(u.id)}
                            className="p-2 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                            title="删除用户"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setResetPwd({ userId: u.id, newPassword: '' })}
                        className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                        title="重置密码"
                      >
                        <RefreshCw size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && !loading && (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
               <div className="w-12 h-12 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-border">
                  <User className="w-6 h-6 text-text-muted" />
               </div>
               <p className="text-xs text-text-muted font-medium">暂无用户数据</p>
            </div>
          )}
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
               <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
               <p className="text-xs text-text-muted font-medium">加载中...</p>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 bg-black/5 dark:bg-white/5 p-4 border-t border-border rounded-b-2xl overflow-visible relative z-10">
          <Pagination
            current={pagination.current}
            size={pagination.size}
            total={pagination.total}
            onPageChange={(page) => setPagination(prev => ({ ...prev, current: page }))}
            onSizeChange={(size) => setPagination(prev => ({ ...prev, size, current: 1 }))}
          />
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetPwd.userId !== 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-8 max-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-text">重置登录密码</h3>
            </div>
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">新密码</label>
                <input
                  type="password"
                  required
                  placeholder="输入 6 位以上新密码"
                  className="block w-full rounded-xl border-border bg-black/5 dark:bg-white/5 py-3 px-4 text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none border transition-all text-sm"
                  value={resetPwd.newPassword}
                  onChange={e => setResetPwd({ ...resetPwd, newPassword: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setResetPwd({ userId: 0, newPassword: '' })}
                  className="flex-1 py-3 text-sm font-bold text-text-muted bg-black/5 dark:bg-white/5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                >
                  重置
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-8 max-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Edit2 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-text">编辑用户资料</h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-2 text-text-muted hover:text-text transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">用户名</label>
                  <input
                    type="text"
                    required
                    className="block w-full rounded-xl border-border bg-black/5 dark:bg-white/5 py-3 px-4 text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none border transition-all text-sm"
                    value={editingUser.username}
                    onChange={e => setEditingUser({ ...editingUser, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">重置密码 (留空则不修改)</label>
                  <input
                    type="password"
                    className="block w-full rounded-xl border-border bg-black/5 dark:bg-white/5 py-3 px-4 text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none border transition-all text-sm"
                    value={editingUser.password}
                    onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                    placeholder="********"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">用户角色</label>
                  <Select
                    value={editingUser.role}
                    onChange={(val) => setEditingUser({ ...editingUser, role: String(val) })}
                    options={[
                      { value: 'user', label: '普通用户' },
                      { value: 'admin', label: '管理员' }
                    ]}
                    placeholder="用户角色"
                    className="bg-black/5 dark:bg-white/5"
                  />
                </div>
                <label className="flex items-center gap-3 p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-border cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded-lg border-border bg-black/5 dark:bg-white/5 text-primary focus:ring-primary accent-primary"
                    checked={editingUser.is_active}
                    onChange={e => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-text">账号启用状态</span>
                    <span className="text-[10px] text-text-muted font-medium">禁用后该用户将无法登录系统</span>
                  </div>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-3 text-sm font-bold text-text-muted bg-black/5 dark:bg-white/5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                >
                  保存更新
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110] animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-3 bg-rose-500/10 rounded-full">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-text">确认删除?</h3>
                <p className="text-sm text-text-muted">
                  您确定要删除该用户吗？此操作无法撤销。
                </p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 text-sm font-bold text-text-muted bg-black/5 dark:bg-white/5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-rose-500 rounded-xl hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
