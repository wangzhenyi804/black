import { useState, useEffect, useCallback } from 'react';
import { X, Upload, Clipboard, Plus, Trash2, CheckCircle2, Loader2, User as UserIcon } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import clsx from 'clsx';

import { createPortal } from 'react-dom';
import Select from './Select';

interface ImportPreviewRow {
  originalText: string;
  codeSlotName: string;
  codeSlotId?: number;
  mediaName: string;
  mediaId?: number;
  date: string;
  impressions: number;
  clicks: number;
  revenue: number;
  ctr: number;
  ecpm: number;
  acp: number;
  isNewSlot: boolean;
  isNewMedia: boolean;
  statusMessage: string;
  userId?: number; // 新增：单行归属人
}

interface User {
  id: number;
  username: string;
  nickname?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportStatsModal({ isOpen, onClose, onSuccess }: Props) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
  const [previewData, setPreviewData] = useState<ImportPreviewRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    } else {
      // Reset state when closing
      setPreviewData([]);
      setSelectedUserId(undefined);
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users/all');
      setUsers(res.data);
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    setLoading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post<any[]>('/stats/preview', formData);
        
        // 映射后端下划线命名到前端驼峰命名
        const mappedData: ImportPreviewRow[] = res.data.map(item => ({
          originalText: item.original_text,
          codeSlotName: item.code_slot_name || '',
          codeSlotId: item.code_slot_id,
          mediaName: item.media_name || 'Image', // 默认值为 "Image"
          mediaId: item.media_id,
          date: item.date,
          impressions: item.impressions || 0,
          clicks: item.clicks || 0,
          revenue: item.revenue || 0,
          ctr: item.ctr || 0,
          ecpm: item.ecpm || 0,
          acp: item.acp || 0,
          isNewSlot: item.is_new_slot || false,
          isNewMedia: item.is_new_media || false,
          statusMessage: item.status_message,
          userId: selectedUserId // 默认使用当前全局选中的归属人
        }));
        
        setPreviewData(prev => [...prev, ...mappedData]);
        console.log('[ImportStatsModal] Added rows with userId:', selectedUserId);
      }
      toast.success('识别完成，请核对数据');
    } catch (err: any) {
      console.error('Preview error:', err);
      toast.error(err.response?.data?.message || '识别失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) files.push(blob);
      }
    }
    if (files.length > 0) {
      handleFiles(files);
    }
  }, []);

  const handleConfirm = async () => {
    if (!selectedUserId) {
      toast.error('请选择归属人');
      return;
    }
    if (previewData.length === 0) {
      toast.error('没有可导入的数据');
      return;
    }

    setLoading(true);
    try {
      // 将前端驼峰命名转换回后端要求的下划线命名
      const mappedRows = previewData.map(row => ({
        original_text: row.originalText,
        code_slot_name: row.codeSlotName,
        code_slot_id: row.codeSlotId,
        media_name: row.mediaName,
        media_id: row.mediaId,
        date: row.date,
        impressions: row.impressions,
        clicks: row.clicks,
        revenue: row.revenue,
        ctr: row.ctr,
        ecpm: row.ecpm,
        acp: row.acp,
        is_new_slot: row.isNewSlot,
        is_new_media: row.isNewMedia,
        status_message: row.statusMessage,
        user_id: row.userId || selectedUserId // 优先使用单行归属人，兜底使用全局
      }));

      await api.post('/stats/confirm-import', {
        user_id: selectedUserId,
        rows: mappedRows
      });
      toast.success('导入成功');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error(err.response?.data?.message || '导入失败');
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (index: number, field: keyof ImportPreviewRow, value: any) => {
    const newData = [...previewData];
    newData[index] = { ...newData[index], [field]: value };
    
    // Recalculate metrics if needed
    if (field === 'revenue' || field === 'impressions' || field === 'clicks') {
      const row = newData[index];
      if (row.impressions > 0) {
        row.ecpm = (row.revenue * 1000) / row.impressions;
        row.ctr = row.clicks / row.impressions;
      }
      if (row.clicks > 0) {
        row.acp = row.revenue / row.clicks;
      }
    }
    setPreviewData(newData);
  };

  const removeRow = (index: number) => {
    setPreviewData(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 lg:p-12" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      <div 
        className="relative w-full max-w-6xl h-auto max-h-[90vh] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={e => e.stopPropagation()}
        onPaste={handlePaste}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 lg:p-6 border-b border-border bg-card">
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-text">智能数据同步工作台</h2>
            <p className="text-xs lg:text-sm text-text-muted mt-0.5 lg:mt-1">支持图片粘贴、文件拖拽及批量预览编辑</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
            <X size={20} className="text-text-muted" />
          </button>
        </div>

        {/* Global Settings */}
        <div className="flex-shrink-0 p-4 lg:p-6 bg-black/5 dark:bg-white/5 border-b border-border flex flex-wrap items-center gap-4 lg:gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <UserIcon size={18} />
            </div>
            <div className="min-w-[200px]">
              <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">批量归属人设置</label>
              <Select 
                value={selectedUserId || ''}
                onChange={(val) => {
                  const numVal = Number(val);
                  console.log('[ImportStatsModal] Global Select changed to:', numVal);
                  setSelectedUserId(numVal);
                  // 批量同步归属人到所有预览行
                  setPreviewData(prev => prev.map(row => ({ ...row, userId: numVal })));
                }}
                options={users.map(u => ({ value: u.id, label: u.nickname || u.username }))}
                placeholder="选择归属人"
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
          {/* Upload Area */}
          <div 
            className={clsx(
              "relative border-2 border-dashed rounded-2xl p-6 sm:p-8 transition-all flex flex-col items-center justify-center gap-4 group",
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-black/5 dark:hover:bg-white/5"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
          >
            <input 
              type="file" 
              multiple 
              accept="image/*,.csv,.xlsx,.xls"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Upload size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm font-bold text-text">点击或拖拽文件到此处</p>
              <p className="hidden sm:flex text-xs text-text-muted mt-1 items-center justify-center gap-1.5">
                <Clipboard size={12} /> 支持 Ctrl+V 粘贴微信截图
              </p>
            </div>
          </div>

          {/* Preview List/Table */}
          {previewData.length > 0 && (
            <div className="space-y-4">
              {/* Desktop Table View */}
              <div className="hidden md:block border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-black/5 dark:bg-white/5 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase">状态</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase">日期</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase">媒体</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase">代码位名称</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase">归属人</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase text-right">展现</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase text-right">点击</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase text-right">收入</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {row.isNewSlot ? (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[10px] font-bold">
                                <Plus size={10} /> 待新建
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-bold">
                                <CheckCircle2 size={10} /> 已匹配
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="date" 
                            value={row.date} 
                            onChange={(e) => updateRow(idx, 'date', e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-sm text-text p-0 w-32"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="text" 
                            value={row.mediaName} 
                            onChange={(e) => updateRow(idx, 'mediaName', e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-sm text-text p-0 w-full font-medium"
                            placeholder="默认"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="text" 
                            value={row.codeSlotName} 
                            onChange={(e) => updateRow(idx, 'codeSlotName', e.target.value)}
                            className={clsx(
                              "bg-transparent border-none focus:ring-0 text-sm font-medium p-0 w-full",
                              row.isNewSlot ? "text-amber-500" : "text-text"
                            )}
                          />
                        </td>
                        <td className="px-4 py-3 min-w-[140px]">
                          <Select 
                            value={row.userId || ''}
                            onChange={(val) => {
                              const numVal = Number(val);
                              console.log(`[ImportStatsModal] Row ${idx} Select changed to:`, numVal);
                              updateRow(idx, 'userId', numVal);
                            }}
                            options={users.map(u => ({ value: u.id, label: u.nickname || u.username }))}
                            placeholder="选择归属人"
                            size="sm"
                            className="w-full"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input 
                            type="number" 
                            value={row.impressions} 
                            onChange={(e) => updateRow(idx, 'impressions', Number(e.target.value))}
                            className="bg-transparent border-none focus:ring-0 text-sm text-text p-0 text-right w-24"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input 
                            type="number" 
                            value={row.clicks} 
                            onChange={(e) => updateRow(idx, 'clicks', Number(e.target.value))}
                            className="bg-transparent border-none focus:ring-0 text-sm text-text p-0 text-right w-20"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input 
                            type="number" 
                            step="0.01"
                            value={row.revenue} 
                            onChange={(e) => updateRow(idx, 'revenue', Number(e.target.value))}
                            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-primary p-0 text-right w-24"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => removeRow(idx)} className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {previewData.map((row, idx) => (
                  <div key={idx} className="bg-card border border-border rounded-2xl p-4 space-y-4 relative overflow-hidden">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      {row.isNewSlot ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[10px] font-bold uppercase tracking-tight">
                          <Plus size={10} /> 待新建
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-bold uppercase tracking-tight">
                          <CheckCircle2 size={10} /> 已匹配
                        </span>
                      )}
                      <button onClick={() => removeRow(idx)} className="p-2 text-text-muted hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">媒体名称</label>
                        <input 
                          type="text" 
                          value={row.mediaName} 
                          onChange={(e) => updateRow(idx, 'mediaName', e.target.value)}
                          className="w-full bg-black/5 dark:bg-white/5 rounded-xl px-3 py-2 text-sm border-none focus:ring-1 focus:ring-primary/30 text-text font-medium"
                          placeholder="默认"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">代码位名称</label>
                        <input 
                          type="text" 
                          value={row.codeSlotName} 
                          onChange={(e) => updateRow(idx, 'codeSlotName', e.target.value)}
                          className={clsx(
                            "w-full bg-black/5 dark:bg-white/5 rounded-xl px-3 py-2 text-sm border-none focus:ring-1 focus:ring-primary/30",
                            row.isNewSlot ? "text-amber-500" : "text-text"
                          )}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">归属人</label>
                        <Select 
                          value={row.userId || ''}
                          onChange={(val) => {
                            const numVal = Number(val);
                            console.log(`[ImportStatsModal] Mobile Row ${idx} Select changed to:`, numVal);
                            updateRow(idx, 'userId', numVal);
                          }}
                          options={users.map(u => ({ value: u.id, label: u.nickname || u.username }))}
                          placeholder="选择归属人"
                          size="sm"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">日期</label>
                        <input 
                          type="date" 
                          value={row.date} 
                          onChange={(e) => updateRow(idx, 'date', e.target.value)}
                          className="w-full bg-black/5 dark:bg-white/5 rounded-xl px-3 py-2 text-sm border-none focus:ring-1 focus:ring-primary/30 text-text"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block text-primary">收入 (¥)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={row.revenue} 
                          onChange={(e) => updateRow(idx, 'revenue', Number(e.target.value))}
                          className="w-full bg-black/5 dark:bg-white/5 rounded-xl px-3 py-2 text-sm border-none focus:ring-1 focus:ring-primary/30 text-primary font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">展现量</label>
                        <input 
                          type="number" 
                          value={row.impressions} 
                          onChange={(e) => updateRow(idx, 'impressions', Number(e.target.value))}
                          className="w-full bg-black/5 dark:bg-white/5 rounded-xl px-3 py-2 text-sm border-none focus:ring-1 focus:ring-primary/30 text-text"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">点击量</label>
                        <input 
                          type="number" 
                          value={row.clicks} 
                          onChange={(e) => updateRow(idx, 'clicks', Number(e.target.value))}
                          className="w-full bg-black/5 dark:bg-white/5 rounded-xl px-3 py-2 text-sm border-none focus:ring-1 focus:ring-primary/30 text-text"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {previewData.length === 0 && !loading && (
            <div className="py-12 flex flex-col items-center justify-center text-text-muted opacity-60">
              <Upload size={40} strokeWidth={1.5} className="mb-4" />
              <p className="text-sm">暂无待导入数据，请先上传图片或表格</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12 gap-3 text-primary">
              <Loader2 className="animate-spin" size={20} />
              <span className="text-sm font-medium tracking-tight">正在处理中...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex items-center justify-between bg-black/5 dark:bg-white/5">
          <p className="text-xs text-text-muted">
            共 <span className="font-bold text-text">{previewData.length}</span> 条待导入记录
          </p>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-border text-sm font-bold text-text hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              取消
            </button>
            <button 
              disabled={loading || previewData.length === 0 || !selectedUserId}
              onClick={handleConfirm}
              className={clsx(
                "px-8 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98]",
                loading || previewData.length === 0 || !selectedUserId 
                  ? "bg-text-muted/40 cursor-not-allowed" 
                  : "bg-primary shadow-primary/20 hover:bg-primary/90"
              )}
            >
              确认并同步
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
