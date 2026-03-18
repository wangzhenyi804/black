import { Download, FileUp, Globe, Info, Plus, Search, Upload, X, Settings2, Trash2, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import api from '../api/client';
import Pagination from '../components/Pagination';
import Select from '../components/Select';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface Media {
  id: number;
  name: string;
  domain: string;
  category: string;
  type: string;
  status: string;
  icp_code?: string;
  rejection_reason?: string;
  created_at: string;
  note?: string;
  description?: string;
  daily_visits?: string;
  stats_auth_type?: string;
  agent_auth_url?: string;
  copyright_url?: string;
}

const STATUS_TABS = ['全部', '待初审', '初审未通过', '初审通过待验证', '验证失败', '验证通过待审核', '审核未通过', '审核通过'];
const CATEGORIES = ['全部', 'Technology', 'News', 'Gaming', 'Health', 'Travel', 'Lifestyle', 'Finance', 'Fashion', 'Education', 'Sports', 'Entertainment'];
const DAILY_VISITS_OPTIONS = ['1w以下', '1w-10w', '10w-100w', '100w-1000w', '1000w以上'];
const STATS_AUTH_OPTIONS = [
  { value: 'cnzz', label: '已通过友盟(cnzz)授权' },
  { value: 'baidu', label: '已通过百度统计授权' },
  { value: 'none', label: '无法给予授权或使用其他统计' }
];

export default function Media() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [filters, setFilters] = useState({
    name: '',
    category: '全部',
    status: '全部'
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Media>>({
    name: '',
    domain: '',
    category: '',
    type: 'Website',
    icp_code: '',
    note: '',
    description: '',
    daily_visits: '1w以下',
    stats_auth_type: 'none',
    agent_auth_url: '',
    copyright_url: ''
  });

  const [uploading, setUploading] = useState({ agent: false, copyright: false });

  useEffect(() => {
    fetchMedia();
  }, [page, size, filters.status]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await api.get('/media', {
        params: {
          page,
          size,
          name: filters.name,
          category: filters.category,
          status: filters.status
        }
      });
      setMediaList(res.data.records || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMedia();
    if (window.innerWidth < 1024) {
      setIsFilterOpen(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/media/export', {
        params: {
          name: filters.name,
          category: filters.category,
          status: filters.status
        },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'media_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export error:', err);
      toast.error('导出失败');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/media/import', formData);
      toast.success('导入成功');
      fetchMedia();
    } catch (err) {
      console.error('Import error:', err);
      toast.error('导入失败');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'agent_auth_url' | 'copyright_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(prev => ({ ...prev, [field === 'agent_auth_url' ? 'agent' : 'copyright']: true }));
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const res = await api.post('/upload', formDataUpload);
      setFormData(prev => ({ ...prev, [field]: res.data.url }));
      toast.success('文件上传成功');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('上传失败');
    } finally {
      setUploading(prev => ({ ...prev, [field === 'agent_auth_url' ? 'agent' : 'copyright']: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/media/${editingId}`, formData);
        toast.success('媒体信息更新成功');
      } else {
        await api.post('/media', formData);
        toast.success('新增媒体成功');
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({
        name: '',
        domain: '',
        category: '',
        type: 'Website',
        status: '',
        icp_code: '',
        note: '',
        description: '',
        daily_visits: '1w以下',
        stats_auth_type: 'none',
        agent_auth_url: '',
        copyright_url: ''
      });
      fetchMedia();
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(editingId ? '更新失败' : '新增媒体失败');
    }
  };

  const handleEdit = (media: Media) => {
    setEditingId(media.id);
    setFormData({
      name: media.name,
      domain: media.domain,
      category: media.category,
      type: media.type,
      status: media.status,
      icp_code: media.icp_code,
      note: media.note,
      description: media.description,
      daily_visits: media.daily_visits,
      stats_auth_type: media.stats_auth_type || 'none',
      agent_auth_url: media.agent_auth_url,
      copyright_url: media.copyright_url
    });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/media/${deleteConfirmId}`);
      toast.success('媒体已删除');
      fetchMedia();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data || '删除失败';
      toast.error(msg);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case '审核通过': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PENDING':
      case '待初审': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'REJECTED':
      case '审核未通过': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500">
      {/* Header & Filter */}
      <div className="flex-shrink-0 bg-card p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-border space-y-4 backdrop-blur-md relative z-40 overflow-visible">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 lg:p-2 bg-primary/10 rounded-xl">
              <Globe className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
            </div>
            <h1 className="text-lg lg:text-xl font-bold text-text tracking-tight">媒体管理</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleExport}
              className="flex-1 sm:flex-none bg-black/5 dark:bg-white/5 text-text px-3 lg:px-4 py-2 rounded-xl text-[10px] lg:text-sm font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-all border border-border flex items-center justify-center gap-1.5 lg:gap-2"
            >
              <Download size={14} className="lg:size-4" /> 导出
            </button>
            <label className="flex-1 sm:flex-none bg-black/5 dark:bg-white/5 text-text px-3 lg:px-4 py-2 rounded-xl text-[10px] lg:text-sm font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-all border border-border flex items-center justify-center gap-1.5 lg:gap-2 cursor-pointer">
              <FileUp size={14} className="lg:size-4" /> 导入
              <input type="file" className="hidden" accept=".csv" onChange={handleImport} />
            </label>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none bg-primary text-white px-3 lg:px-4 py-2 rounded-xl text-[10px] lg:text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-1.5 lg:gap-2"
            >
              <Plus size={16} className="lg:size-[18px]" /> 新增
            </button>
          </div>
        </div>

        <div className="lg:hidden">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-border rounded-xl text-xs font-bold text-text-muted"
          >
            <div className="flex items-center gap-2">
              <Search size={14} />
              <span>数据筛选</span>
            </div>
            <ChevronRight size={14} className={clsx("transition-transform duration-300", isFilterOpen ? "rotate-90" : "")} />
          </button>
        </div>

        <div className={clsx(
          "transition-all duration-300 ease-in-out lg:block lg:opacity-100",
          isFilterOpen ? "opacity-100 max-h-[500px] overflow-visible" : "max-h-0 opacity-0 lg:max-h-none overflow-hidden lg:overflow-visible"
        )}>
          <div className="space-y-4 pt-4 lg:pt-0">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4">
              <div className="relative group flex-1 max-w-none sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="按名称搜索..."
                  className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl py-2 pl-9 pr-4 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  value={filters.name}
                  onChange={e => setFilters({ ...filters, name: e.target.value })}
                />
              </div>
              <div className="w-full sm:w-auto min-w-[120px] lg:min-w-[140px]">
                <Select
                  value={filters.category}
                  onChange={(val) => setFilters({ ...filters, category: String(val) })}
                  options={CATEGORIES.map(c => ({ value: c, label: c === '全部' ? '所有分类' : c }))}
                  placeholder="所有分类"
                  className="bg-black/5 dark:bg-white/5"
                  size="sm"
                />
              </div>
              <button
                type="submit"
                className="bg-black/5 dark:bg-white/5 text-text px-6 py-2 rounded-xl text-xs lg:text-sm font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-all border border-border"
              >
                查询
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 lg:gap-2 pt-2 border-t border-border overflow-x-auto no-scrollbar pb-1">
              {STATUS_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setFilters({ ...filters, status: tab });
                    setPage(1);
                  }}
                  className={`whitespace-nowrap px-3 lg:px-4 py-1.5 text-[10px] lg:text-xs font-bold rounded-xl transition-all border ${
                    filters.status === tab
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'text-text-muted border-transparent hover:bg-black/5 dark:hover:bg-white/5 hover:text-text'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 min-h-0 bg-card rounded-2xl lg:rounded-3xl border border-border flex flex-col backdrop-blur-md overflow-hidden">
        <div className="flex-1 overflow-auto min-h-0 rounded-t-2xl lg:rounded-t-3xl custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-black/5 dark:bg-white/5 backdrop-blur-md z-10 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">媒体名称</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">域名</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">分类</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">创建时间</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-20 text-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto"></div></td></tr>
              ) : mediaList.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-20 text-center text-text-muted font-medium">暂无数据</td></tr>
              ) : (
                mediaList.map((media) => (
                  <tr key={media.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-primary font-bold border border-border">
                          {media.name?.charAt(0) || 'M'}
                        </div>
                        <span className="text-sm font-bold text-text">{media.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted font-medium">{media.domain}</td>
                    <td className="px-6 py-4 text-sm text-text-muted font-medium">{media.category}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${getStatusColor(media.status)}`}>
                        {media.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted font-medium">{new Date(media.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      {isAdmin && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(media)}
                            className="p-2 rounded-lg text-text-muted hover:bg-black/5 dark:hover:bg-white/10 hover:text-text transition-all" 
                            title="编辑"
                          >
                            <Settings2 size={16} />
                          </button>
                          <button 
                            onClick={() => setDeleteConfirmId(media.id)}
                            className="p-2 rounded-lg text-rose-500/50 hover:bg-rose-500/10 hover:text-rose-500 transition-all" 
                            title="删除"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="flex-shrink-0 border-t border-border p-4 bg-black/5 dark:bg-white/5 rounded-b-2xl lg:rounded-b-3xl overflow-visible relative z-10">
          <Pagination
            current={page}
            size={size}
            total={total}
            onPageChange={setPage}
            onSizeChange={(s) => {
              setSize(s);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Add/Edit Media Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-8 sticky top-0 bg-card z-10 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-text">{editingId ? '编辑媒体' : '新增媒体'}</h3>
              </div>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="p-2 text-text-muted hover:text-text transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                      <span className="text-rose-500">*</span> 网站域名
                    </label>
                    <input
                      type="text"
                      required
                      className="block w-full rounded-xl border-border bg-black/5 dark:bg-white/5 py-3 px-4 text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none border transition-all text-sm"
                      placeholder="例如: baidu.com (无需填写www或http)"
                      value={formData.domain}
                      onChange={e => setFormData({ ...formData, domain: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                      <span className="text-rose-500">*</span> 网站名称
                    </label>
                    <input
                      type="text"
                      required
                      className="block w-full rounded-xl border-border bg-black/5 dark:bg-white/5 py-3 px-4 text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none border transition-all text-sm"
                      placeholder="需与首页title相同"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                {editingId && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                      <span className="text-rose-500">*</span> 媒体状态
                    </label>
                    <Select
                      value={formData.status || ''}
                      onChange={(val) => setFormData({ ...formData, status: String(val) })}
                      options={STATUS_TABS.filter(s => s !== '全部').map(s => ({ value: s, label: s }))}
                      placeholder="请选择状态"
                      className="bg-black/5 dark:bg-white/5"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                      <span className="text-rose-500">*</span> 行业类别
                    </label>
                    <Select
                      value={formData.category || ''}
                      onChange={(val) => setFormData({ ...formData, category: String(val) })}
                      options={CATEGORIES.filter(c => c !== '全部').map(c => ({ value: c, label: c }))}
                      placeholder="请选择"
                      required
                      className="bg-black/5 dark:bg-white/5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                      <span className="text-rose-500">*</span> 备案信息
                    </label>
                    <input
                      type="text"
                      required
                      className="block w-full rounded-xl border-border bg-black/5 dark:bg-white/5 py-3 px-4 text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none border transition-all text-sm"
                      placeholder="例如: 京ICP证030132"
                      value={formData.icp_code}
                      onChange={e => setFormData({ ...formData, icp_code: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    <span className="text-rose-500">*</span> 访问量(日)
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {DAILY_VISITS_OPTIONS.map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="daily_visits"
                          value={opt}
                          checked={formData.daily_visits === opt}
                          onChange={e => setFormData({ ...formData, daily_visits: e.target.value })}
                          className="w-4 h-4 rounded-full border-border bg-black/5 dark:bg-white/5 text-primary focus:ring-primary/20 accent-primary"
                        />
                        <span className="text-sm text-text-muted group-hover:text-text transition-colors">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    <span className="text-rose-500">*</span> 网站描述
                  </label>
                  <textarea
                    rows={3}
                    required
                    className="block w-full rounded-xl border-border bg-black/5 dark:bg-white/5 py-3 px-4 text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none border transition-all text-sm resize-none"
                    placeholder="尽量与首页的description相同"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-3 p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-border">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    <span className="text-rose-500">*</span> 统计查看授权
                  </label>
                  <p className="text-[10px] text-text-muted leading-relaxed mb-2">
                    请将该网站(域名)的流量统计查看权限授权给 <span className="text-text font-bold">账号:星辰加运营组</span> <span className="text-text font-bold">邮箱:xingchenjia@star-media.cn</span>
                  </p>
                  <div className="flex flex-col gap-3">
                    {STATS_AUTH_OPTIONS.map(opt => (
                      <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="stats_auth"
                          value={opt.value}
                          checked={formData.stats_auth_type === opt.value}
                          onChange={e => setFormData({ ...formData, stats_auth_type: e.target.value })}
                          className="w-4 h-4 rounded-full border-border bg-black/5 dark:bg-white/5 text-primary focus:ring-primary/20 accent-primary"
                        />
                        <span className="text-sm text-text-muted group-hover:text-text transition-colors">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                      <span className="text-rose-500">*</span> 代理授权
                    </label>
                    <div className="flex flex-col gap-2">
                      <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${formData.agent_auth_url ? 'border-primary/50 bg-primary/5' : 'border-border bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 hover:border-primary/30'}`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {uploading.agent ? (
                            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                          ) : formData.agent_auth_url ? (
                            <div className="flex flex-col items-center">
                              <Info className="w-8 h-8 text-primary mb-2" />
                              <span className="text-[10px] text-text-muted">已上传</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-text-muted/30 mb-2 group-hover:text-primary transition-colors" />
                              <p className="text-[10px] text-text-muted">点击上传代理授权</p>
                            </>
                          )}
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'agent_auth_url')} />
                      </label>
                      <button type="button" className="text-[10px] text-primary hover:underline self-start font-medium">下载代理授权模板</button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                      软著
                    </label>
                    <div className="flex flex-col gap-2">
                      <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${formData.copyright_url ? 'border-primary/50 bg-primary/5' : 'border-border bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 hover:border-primary/30'}`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {uploading.copyright ? (
                            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                          ) : formData.copyright_url ? (
                            <div className="flex flex-col items-center">
                              <Info className="w-8 h-8 text-primary mb-2" />
                              <span className="text-[10px] text-text-muted">已上传</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-text-muted/30 mb-2 group-hover:text-primary transition-colors" />
                              <p className="text-[10px] text-text-muted">点击上传软著扫描件</p>
                            </>
                          )}
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'copyright_url')} />
                      </label>
                      <span className="text-[10px] text-text-muted">请上传软著扫描件</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    备注
                  </label>
                  <textarea
                    rows={2}
                    className="block w-full rounded-xl border-border bg-black/5 dark:bg-white/5 py-3 px-4 text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none border transition-all text-sm resize-none"
                    placeholder="您认为需要记录或想告知管理员的事宜"
                    value={formData.note}
                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6 sticky bottom-0 bg-card pb-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-sm font-bold text-text-muted bg-black/5 dark:bg-white/5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-95"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  立即保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        description="您确定要删除这个媒体吗？此操作无法撤销。"
      />
    </div>
  );
}
