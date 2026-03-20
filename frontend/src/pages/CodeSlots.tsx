import { clsx } from 'clsx';
import { ChevronRight, Code, Cpu, Download, FileUp, Globe, Layout, MousePointer2, Plus, Search, Settings2, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../api/client';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Pagination from '../components/Pagination';
import Select from '../components/Select';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface CodeSlot {
  id: number;
  media_id: number;
  code_slot_id?: string; // Logical ID
  user_id?: number; // Added user_id
  name: string;
  type: string;
  terminal: string;
  display_type: string;
  ad_type: string;
  ad_form: string;
  ratio: number;
  style_type: string;
  note: string;
  image_url: string;
  width: number;
  height: number;
  is_shielding: boolean;
  status: string;
  code_content: string;
  revenue_ratio?: number;
  created_at: string;
  updated_at: string;
}

interface Media {
  id: number;
  name: string;
  domain: string;
}

interface FilterState {
  name: string;
  media_id: string;
  user_id: string;
  type: string;
  status: string;
}

const initialFormData: Partial<CodeSlot> = {
  name: '',
  media_id: undefined,
  type: '',
  terminal: 'H5',
  display_type: '固定块',
  ad_type: '信息流',
  ad_form: '原生缩略图',
  ratio: 6,
  style_type: '默认',
  note: '',
  image_url: '',
  is_shielding: false,
  status: 'ACTIVE',
  user_id: undefined
};

export default function CodeSlots() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [slots, setSlots] = useState<CodeSlot[]>([]);
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [userList, setUserList] = useState<{id: number, username: string, is_active: number}[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ name: '', media_id: '', user_id: '', type: '全部', status: '全部' });
  const [pagination, setPagination] = useState({ current: 1, size: 10, total: 0 });
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<CodeSlot>>(initialFormData);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [currentCode, setCurrentCode] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null); // New state for editing
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1); // New state for double confirmation
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBatchMode, setIsBatchMode] = useState(false);

  useEffect(() => {
    fetchMedia();
    fetchSlots();
    if (isAdmin) {
      fetchUsers();
    }
  }, [pagination.current, pagination.size, isAdmin]);

  const fetchUsers = () => {
    api.get('/users/all').then(res => {
      const data = res.data.data || res.data;
      setUserList(data || []);
    });
  };

  const fetchMedia = () => {
    api.get('/media?size=100').then(res => setMediaList(res.data.records || []));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const res = await api.post('/upload', formDataUpload);
      setFormData(prev => ({ ...prev, image_url: res.data.url }));
      toast.success('图片上传成功');
    } catch (err) {
      toast.error('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const fetchSlots = () => {
    setLoading(true);
    const params: any = {
      page: pagination.current,
      size: pagination.size,
      name: filters.name || undefined,
      mediaId: filters.media_id || undefined,
      userId: filters.user_id || undefined,
      type: filters.type === '全部' ? undefined : filters.type,
      status: filters.status === '全部' ? undefined : filters.status
    };

    api.get('/codeslots', { params }).then(res => {
      setSlots(res.data.records || []);
      setPagination(prev => ({ ...prev, total: res.data.total || 0 }));
      setSelectedIds([]); // Clear selection on page change
    }).finally(() => setLoading(false));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchSlots();
    if (window.innerWidth < 1024) {
      setIsFilterOpen(false);
    }
  };

  const handleExport = async () => {
    try {
      const params: any = {
        name: filters.name || undefined,
        mediaId: filters.media_id || undefined,
        userId: filters.user_id || undefined,
        type: filters.type === '全部' ? undefined : filters.type,
        status: filters.status === '全部' ? undefined : filters.status
      };
      const res = await api.get('/codeslots/export', {
        params,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'codeslot_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('导出失败');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/codeslots/import', formData);
      toast.success('导入成功');
      fetchSlots();
    } catch (err) {
      toast.error('导入失败');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Edit mode
        await api.put(`/codeslots/${editingId}`, formData);
        toast.success('代码位更新成功');
      } else {
        // Create mode
        await api.post('/codeslots', formData);
        toast.success('代码位创建成功');
      }
      
      setIsModalOpen(false);
      setEditingId(null);
      setFormData(initialFormData);
      fetchSlots();
    } catch (err) {
      toast.error(editingId ? '更新失败' : '新增代码位失败');
    }
  };

  const handleEdit = (slot: CodeSlot) => {
    console.log('[CodeSlots] Editing slot:', slot);
    setEditingId(slot.id);
    setFormData({
      name: slot.name,
      media_id: slot.media_id,
      user_id: slot.user_id,
      terminal: slot.terminal,
      display_type: slot.display_type,
      ad_type: slot.ad_type,
      ad_form: slot.ad_form,
      ratio: slot.ratio,
      style_type: slot.style_type,
      note: slot.note,
      is_shielding: slot.is_shielding,
      status: slot.status,
      image_url: slot.image_url,
      revenue_ratio: slot.revenue_ratio || 0.7
    });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    
    if (deleteStep === 1) {
      setDeleteStep(2);
      return;
    }

    try {
      if (deleteConfirmId === -1) {
        // Batch delete
        await api.delete('/codeslots/batch', { data: selectedIds });
        toast.success(`成功删除 ${selectedIds.length} 个代码位`);
        setSelectedIds([]);
        setIsBatchMode(false);
      } else {
        await api.delete(`/codeslots/${deleteConfirmId}`);
        toast.success('删除成功');
      }
      fetchSlots();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data || '删除失败';
      toast.error(msg);
    } finally {
      setDeleteConfirmId(null);
      setDeleteStep(1);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(slots.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleGetCode = (code: string) => {
    setCurrentCode(code);
    setIsCodeModalOpen(true);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE': 
        return { 
          label: '正常', 
          dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
          text: 'text-emerald-500'
        };
      case 'PAUSED': 
        return { 
          label: '暂停', 
          dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
          text: 'text-amber-500'
        };
      default: 
        return { 
          label: status, 
          dot: 'bg-zinc-500 shadow-[0_0_8px_rgba(113,113,122,0.4)]',
          text: 'text-zinc-500'
        };
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500">
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 lg:p-2 bg-accent/10 rounded-xl">
            <Cpu className="w-4 h-4 lg:w-5 lg:h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-lg lg:text-xl font-bold text-text tracking-tight">代码位管理</h1>
            <p className="text-[10px] lg:text-xs text-text-muted font-medium">管理广告代码位并生成集成代码。</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {isAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsBatchMode(!isBatchMode);
                if (isBatchMode) setSelectedIds([]);
              }}
              className={clsx(
                "px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-[10px] lg:text-sm font-bold transition-all flex items-center gap-1.5 lg:gap-2",
                isBatchMode 
                  ? "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90" 
                  : "bg-black/5 dark:bg-white/5 text-text-muted hover:text-text"
              )}
            >
              批量操作
            </button>
          )}
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
            onClick={() => {
              setFormData(initialFormData);
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none bg-primary text-white px-3 lg:px-4 py-2 rounded-xl text-[10px] lg:text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-1.5 lg:gap-2"
          >
            <Plus size={16} className="lg:size-[18px]" /> 新增
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 bg-card p-4 rounded-2xl lg:rounded-3xl border border-border backdrop-blur-md relative z-40 overflow-visible">
        <div className="lg:hidden">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-border rounded-xl text-xs font-bold text-text-muted"
          >
            <div className="flex items-center gap-2">
              <Search size={14} />
              <span>搜索筛选</span>
            </div>
            <ChevronRight size={14} className={clsx("transition-transform duration-300", isFilterOpen ? "rotate-90" : "")} />
          </button>
        </div>

        <div className={clsx(
          "transition-all duration-300 ease-in-out lg:block lg:opacity-100",
          isFilterOpen ? "opacity-100 max-h-[500px] mt-4 overflow-visible" : "max-h-0 opacity-0 lg:max-h-none overflow-hidden lg:overflow-visible"
        )}>
          <form onSubmit={handleSearch} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="搜索代码位ID或名称..."
                className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl py-2 pl-9 pr-4 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={filters.name}
                onChange={e => setFilters({ ...filters, name: e.target.value })}
              />
            </div>
            <div className="w-full sm:w-auto">
              <Select
                value={filters.media_id}
                onChange={(val) => setFilters({ ...filters, media_id: String(val) })}
                options={[
                  { value: '', label: '所有媒体' },
                  ...mediaList.map(m => ({ value: m.id, label: m.name }))
                ]}
                placeholder="所有媒体"
                className="bg-black/5 dark:bg-white/5"
                size="sm"
              />
            </div>
            {isAdmin && (
              <div className="w-full sm:w-auto">
                <Select
                  value={filters.user_id}
                  onChange={(val) => setFilters({ ...filters, user_id: String(val) })}
                  options={[
                    { value: '', label: '所有用户' },
                    ...userList.map(u => ({ value: u.id, label: u.username }))
                  ]}
                  placeholder="所有用户"
                  className="bg-black/5 dark:bg-white/5"
                  size="sm"
                />
              </div>
            )}
            <div className="w-full sm:w-auto">
              <Select
                value={filters.type}
                onChange={(val) => setFilters({ ...filters, type: String(val) })}
                options={[
                  { value: '全部', label: '所有形式' },
                  { value: 'Banner', label: '固定块' },
                  { value: 'Interstitial', label: '插屏' },
                  { value: 'Native', label: '原生' }
                ]}
                placeholder="所有形式"
                className="bg-black/5 dark:bg-white/5"
                size="sm"
              />
            </div>
            <button
              type="submit"
              className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              查询
            </button>
          </form>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 min-h-0 bg-card rounded-2xl lg:rounded-3xl border border-border overflow-hidden flex flex-col backdrop-blur-md">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-black/5 dark:bg-white/5 backdrop-blur-md z-10 border-b border-border">
              <tr>
                {isBatchMode && (
                  <th className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-border bg-black/5 dark:bg-white/5 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                      checked={slots.length > 0 && selectedIds.length === slots.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                )}
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">代码位名称</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">所属媒体</th>
                {isAdmin && <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">归属用户</th>}
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">终端 / 形式</th>
                {isAdmin && <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">分成系数</th>}
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5 + (isAdmin ? 2 : 0) + (isBatchMode ? 1 : 0)} className="px-6 py-20 text-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto"></div></td></tr>
              ) : slots.length === 0 ? (
                <tr><td colSpan={5 + (isAdmin ? 2 : 0) + (isBatchMode ? 1 : 0)} className="px-6 py-20 text-center text-text-muted font-medium">暂无数据</td></tr>
              ) : slots.map((slot) => {
                const media = mediaList.find(m => m.id === slot.media_id);
                const user = userList.find(u => u.id === slot.user_id);
                return (
                  <tr key={slot.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
                    {isBatchMode && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-border bg-black/5 dark:bg-white/5 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                          checked={selectedIds.includes(slot.id)}
                          onChange={() => handleSelectOne(slot.id)}
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-accent font-bold border border-border">
                          <MousePointer2 size="16" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text">{slot.name}</p>
                          <p className="text-[10px] text-text-muted font-mono">代码位ID: {slot.code_slot_id || slot.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted font-medium">{media ? media.name : '未知'}</td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-muted font-medium">{user ? user.username : '-'}</span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-text font-medium">{slot.terminal}</span>
                        <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{slot.type === 'Banner' ? '固定块' : slot.type === 'Interstitial' ? '插屏' : slot.type === 'Native' ? '原生' : slot.type}</span>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <span className="text-sm text-emerald-500 font-bold">{slot.revenue_ratio || '0.70'}</span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      {(() => {
                        const config = getStatusConfig(slot.status);
                        return (
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                            {config.label !== '正常' && (
                              <span className={`text-sm font-bold ${config.text}`}>
                                {config.label}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          className="p-2 rounded-lg text-text-muted hover:bg-black/5 dark:hover:bg-white/10 hover:text-text transition-all" 
                          title="获取代码"
                          onClick={() => handleGetCode(slot.code_content)}
                        >
                          <Code size="16" />
                        </button>
                        {isAdmin && (
                          <>
                            <button 
                              className="p-2 rounded-lg text-text-muted hover:bg-black/5 dark:hover:bg-white/10 hover:text-text transition-all" 
                              title="编辑设置"
                              onClick={() => handleEdit(slot)}
                            >
                              <Settings2 size="16" />
                            </button>
                            <button 
                              className="p-2 rounded-lg text-rose-500/50 hover:bg-rose-500/10 hover:text-rose-500 transition-all" 
                              title="删除"
                              onClick={() => {
                                setDeleteConfirmId(slot.id);
                                setDeleteStep(1);
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex-shrink-0 border-t border-border p-4 bg-black/5 dark:bg-white/5 rounded-b-2xl lg:rounded-b-3xl overflow-visible relative z-10">
          <Pagination
            current={pagination.current}
            size={pagination.size}
            total={pagination.total}
            onPageChange={(page) => setPagination(prev => ({ ...prev, current: page }))}
            onSizeChange={(size) => setPagination(prev => ({ ...prev, size, current: 1 }))}
          />
        </div>
      </div>

      {/* Add CodeSlot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-8 sticky top-0 bg-card z-10 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-text">{editingId ? '编辑代码位' : '新增代码位'}</h3>
              </div>
              <button onClick={handleCloseModal} className="p-2 text-text-muted hover:text-text transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pb-4">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    <span className="text-rose-500">*</span> 代码位名称
                  </label>
                  <input
                    type="text"
                    required
                    className="block w-full rounded-xl border-border bg-black/5 dark:bg-white/5 py-3 px-4 text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none border transition-all text-sm"
                    placeholder="请输入代码位名称"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-3 h-3" /> 所属媒体
                  </label>
                  <Select
                    value={formData.media_id || ''}
                    onChange={(val) => setFormData({ ...formData, media_id: Number(val) })}
                    options={[
                      { value: '', label: '选择媒体' },
                      ...mediaList.map(m => ({ value: m.id, label: m.name }))
                    ]}
                    placeholder="选择媒体"
                    required
                    className="bg-black/5 dark:bg-white/5"
                  />
                </div>

                {isAdmin && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                      <Settings2 className="w-3 h-3" /> 归属用户 (管理员功能)
                    </label>
                    <Select
                      value={formData.user_id ?? ''}
                      onChange={(val) => setFormData({ ...formData, user_id: val === '' ? undefined : Number(val) })}
                      options={[
                        { value: '', label: '默认 (当前管理员)' },
                        ...userList.map(u => ({ value: u.id, label: u.username }))
                      ]}
                      placeholder="选择归属人"
                      className="bg-black/5 dark:bg-white/5"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    <span className="text-rose-500">*</span> 终端类型
                  </label>
                  <div className="flex gap-2">
                    {['H5', 'PC'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, terminal: t })}
                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-all border ${
                          formData.terminal === t
                            ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                            : 'bg-black/5 dark:bg-white/5 text-text-muted border-border hover:border-primary/30 hover:text-text'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    <span className="text-rose-500">*</span> 展示形式
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['固定块', '底部悬浮', '插屏'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, display_type: t })}
                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-all border ${
                          formData.display_type === t
                            ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                            : 'bg-black/5 dark:bg-white/5 text-text-muted border-border hover:border-primary/30 hover:text-text'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    <span className="text-rose-500">*</span> 广告类型
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['信息流', '图文广告', '搜索推荐'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, ad_type: t })}
                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-all border ${
                          formData.ad_type === t
                            ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                            : 'bg-black/5 dark:bg-white/5 text-text-muted border-border hover:border-primary/30 hover:text-text'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    <span className="text-rose-500">*</span> 广告形式
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['原生缩略图', '原生图文', '原生三图', '原生大图', '原生文字链'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, ad_form: t })}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          formData.ad_form === t
                            ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                            : 'bg-black/5 dark:bg-white/5 text-text-muted border-border hover:border-primary/30 hover:text-text'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    尺寸
                  </label>
                  <div className="space-y-2">
                    <p className="text-[10px] text-text-muted font-medium italic">仅支持的比例范围：20:4 ~ 20:20</p>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-text-muted font-medium">设定比例，宽高比：20 :</span>
                      <input
                        type="number"
                        min="4"
                        max="20"
                        className="w-24 bg-black/5 dark:bg-white/5 border border-border rounded-xl py-2 px-4 text-center text-sm text-primary font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        value={formData.ratio}
                        onChange={e => setFormData({ ...formData, ratio: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                      分成系数 (仅管理员)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        className="w-24 bg-black/5 dark:bg-white/5 border border-emerald-500/20 rounded-xl py-2 px-4 text-center text-sm text-emerald-500 font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                        value={formData.revenue_ratio}
                        onChange={e => setFormData({ ...formData, revenue_ratio: Number(e.target.value) })}
                      />
                      <p className="text-[10px] text-text-muted font-medium italic">设置此代码位的默认分成比例 (0.00 ~ 1.00)</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    样式配置
                  </label>
                  <div className="flex gap-2">
                    {['默认', '自定义'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, style_type: t })}
                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-all border ${
                          formData.style_type === t
                            ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                            : 'bg-black/5 dark:bg-white/5 text-text-muted border-border hover:border-primary/30 hover:text-text'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    使用反屏蔽代码
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="is_shielding"
                        checked={formData.is_shielding === true}
                        onChange={() => setFormData({ ...formData, is_shielding: true })}
                        className="w-4 h-4 rounded-full border-border bg-black/5 dark:bg-white/5 text-primary focus:ring-primary/20 accent-primary"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm text-text-muted group-hover:text-text transition-colors">使用</span>
                        <span className="text-[10px] text-text-muted font-medium">（访问量主要来自于第三方手机浏览器，如UC、QQ浏览器等）</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="is_shielding"
                        checked={formData.is_shielding === false}
                        onChange={() => setFormData({ ...formData, is_shielding: false })}
                        className="w-4 h-4 rounded-full border-border bg-black/5 dark:bg-white/5 text-primary focus:ring-primary/20 accent-primary"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm text-text-muted group-hover:text-text transition-colors">不使用</span>
                        <span className="text-[10px] text-text-muted font-medium">（访问量主要来自于手机APP内嵌浏览器，如微信、各种软件）</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    特殊备注
                  </label>
                  <textarea
                    rows={2}
                    className="block w-full rounded-xl border-border bg-black/5 dark:bg-white/5 py-3 px-4 text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none border transition-all text-sm resize-none"
                    placeholder="请输入特殊备注"
                    value={formData.note}
                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    图片
                  </label>
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${formData.image_url ? 'border-primary/50 bg-primary/5' : 'border-border bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 hover:border-primary/30'}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploading ? (
                        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                      ) : formData.image_url ? (
                        <div className="flex flex-col items-center">
                          <Layout className="w-8 h-8 text-primary mb-2" />
                          <span className="text-[10px] text-text-muted">图片已上传</span>
                        </div>
                      ) : (
                        <>
                          <Plus className="w-8 h-8 text-text-muted/30 mb-2 group-hover:text-primary transition-colors" />
                          <p className="text-[10px] text-text-muted font-bold">选择图片</p>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-6 sticky bottom-0 bg-card pb-2 border-t border-border">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 text-sm font-bold text-text-muted bg-black/5 dark:bg-white/5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-95"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Code Modal (Existing) */}
      {isCodeModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-text">集成代码</h3>
              <button onClick={() => setIsCodeModalOpen(false)} className="p-2 text-text-muted hover:text-text transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-border font-mono text-xs text-primary overflow-x-auto whitespace-pre shadow-inner">
              {currentCode}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(currentCode);
                toast.success('代码已复制到剪贴板');
              }}
              className="w-full mt-6 py-3 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              复制到剪贴板
            </button>
          </div>
        </div>
      )}

      {/* Batch Actions Bar */}
      {isBatchMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border rounded-full shadow-2xl px-6 py-3 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-8">
          <div className="text-sm font-bold text-text flex items-center gap-2">
            已选择 <span className="text-primary">{selectedIds.length}</span> 项
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (selectedIds.length === 0) {
                  toast.error('请先选择要删除的代码位');
                  return;
                }
                setDeleteConfirmId(-1);
                setDeleteStep(1);
              }}
              disabled={selectedIds.length === 0}
              className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={14} /> 批量删除
            </button>
            <button
              onClick={() => {
                setIsBatchMode(false);
                setSelectedIds([]);
              }}
              className="px-4 py-2 bg-black/5 dark:bg-white/5 text-text-muted rounded-xl text-xs font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-all"
            >
              取消
            </button>
          </div>
        </div>
      )}
      <DeleteConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => {
          setDeleteConfirmId(null);
          setDeleteStep(1);
        }}
        onConfirm={handleDelete}
        title={deleteStep === 1 ? '确认删除代码位?' : '最后确认'}
        description={
          deleteStep === 1 
            ? '警告：删除代码位将一并删除其产生的所有数据！请确认是否继续。' 
            : '您确定要删除这个代码位及其所有数据吗？此操作无法撤销。'
        }
      />
    </div>
  );
}
