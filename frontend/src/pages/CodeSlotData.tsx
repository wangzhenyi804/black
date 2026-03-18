import { useState, useEffect } from 'react';
import clsx from 'clsx';
import api from '../api/client';
import { Download, Search, Filter, Zap, Layout, Terminal, Activity, FileUp, ChevronRight } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfQuarter, subMonths } from 'date-fns';
import Pagination from '../components/Pagination';
import Select from '../components/Select';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface CodeSlotStats {
  codeSlotId: number;
  codeSlotName: string;
  impressions: number;
  clicks: number;
  revenue: number; // 分成前收入
  afterSharingRevenue: number; // 分成后收入
  ctr: number;
  ecpm: number;
  acp: number;
  ratio?: number;
}

const EmptyState = ({ message = "暂无数据" }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-border">
      <Zap className="w-8 h-8 text-text-muted" />
    </div>
    <p className="text-text-muted text-sm font-medium">{message}</p>
    <p className="text-text-muted/60 text-xs mt-1">尝试调整筛选条件或日期范围</p>
  </div>
);

export default function CodeSlotData() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  // Filters
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
    end: format(subDays(new Date(), 1), 'yyyy-MM-dd')
  });
  const [filters, setFilters] = useState({
    codeSlotId: '',
    codeSlotName: '',
    terminal: '全部',
    type: '全部'
  });

  // Data
  const [listData, setListData] = useState<CodeSlotStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, size: 10, total: 0 });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [pagination.current]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {
        startDate: dateRange.start,
        endDate: dateRange.end,
        ...filters,
        page: pagination.current,
        size: pagination.size
      };
      // Clean params
      if (params.terminal === '全部') delete params.terminal;
      if (params.type === '全部') delete params.type;

      const listRes = await api.get('/stats/codeslots', { params });
      const records = listRes.data.records || [];
      const calculatedData = records.map((item: any) => ({
        ...item,
        // Map snake_case to camelCase for the table display
        codeSlotId: item.code_slot_id || item.codeSlotId,
        codeSlotName: item.code_slot_name || item.codeSlotName,
        afterSharingRevenue: item.after_sharing_revenue || (item.revenue * (item.ratio || 1.0))
      }));
      setListData(calculatedData);
      setPagination(prev => ({ ...prev, total: listRes.data.total || 0 }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchData();
    if (window.innerWidth < 1024) {
      setIsFilterOpen(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const res = await api.post('/stats/import', formData);
      const data = res.data;
      if (data.success) {
        toast.success(data.message);
        if (data.warning) {
          toast.info(data.warning);
        }
      } else {
        toast.error(data.message || '导入失败');
      }
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('导入失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params: any = {
        startDate: dateRange.start,
        endDate: dateRange.end,
        ...filters
      };
      if (params.terminal === '全部') delete params.terminal;
      if (params.type === '全部') delete params.type;

      const res = await api.get('/stats/export', {
        params,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `codeslot_stats_${dateRange.start}_${dateRange.end}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('导出成功');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('导出失败');
    }
  };

  const handleQuickDate = (type: string) => {
    const today = new Date();
    let start = today;
    let end = today;

    switch (type) {
      case 'yesterday':
        start = subDays(today, 1);
        end = subDays(today, 1);
        break;
      case 'last7':
        start = subDays(today, 7);
        break;
      case 'last30':
        start = subDays(today, 30);
        break;
      case 'last90':
        start = subDays(today, 90);
        break;
      case 'thisMonth':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'lastMonth':
        start = startOfMonth(subMonths(today, 1));
        end = endOfMonth(subMonths(today, 1));
        break;
      case 'thisQuarter':
        start = startOfQuarter(today);
        break;
    }
    setDateRange({ start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-4 lg:space-y-6">
      {/* Filters */}
      <div className="flex-shrink-0 bg-card border border-border p-4 rounded-2xl space-y-4 backdrop-blur-md relative z-30 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <div className="p-1.5 lg:p-2 bg-primary/10 rounded-lg">
                <Filter className="w-4 h-4 text-primary" />
             </div>
             <h3 className="text-sm font-semibold text-text tracking-tight">数据筛选</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExport}
              className="flex-1 sm:flex-none inline-flex justify-center items-center gap-1.5 lg:gap-2 rounded-xl bg-black/5 dark:bg-white/5 py-2 px-3 lg:px-4 text-[10px] lg:text-xs font-semibold text-text border border-border hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-[0.98]"
            >
              <Download size={14} className="lg:size-3.5" /> 导出
            </button>
            {isAdmin && (
              <label className="flex-1 sm:flex-none inline-flex justify-center items-center gap-1.5 lg:gap-2 rounded-xl bg-black/5 dark:bg-white/5 py-2 px-3 lg:px-4 text-[10px] lg:text-xs font-semibold text-text border border-border hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-[0.98] cursor-pointer">
                <FileUp size={14} className="lg:size-3.5" /> 导入
                <input type="file" className="hidden" accept=".csv" onChange={handleImport} />
              </label>
            )}
          </div>
        </div>

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
          isFilterOpen ? "opacity-100 max-h-[600px] mt-4" : "max-h-0 opacity-0 lg:max-h-none overflow-hidden"
        )}>
          <div className="space-y-4 pt-4 lg:pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3">
              <div className="flex items-center bg-black/5 dark:bg-white/5 border border-border rounded-xl px-3 py-1.5 overflow-x-auto no-scrollbar">
                <input
                  type="date"
                  className="bg-transparent border-none focus:ring-0 text-[10px] lg:text-xs text-text w-24 lg:w-28"
                  value={dateRange.start}
                  onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                />
                <span className="px-1 lg:px-2 text-text-muted text-[10px]">至</span>
                <input
                  type="date"
                  className="bg-transparent border-none focus:ring-0 text-[10px] lg:text-xs text-text w-24 lg:w-28"
                  value={dateRange.end}
                  onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
              <div className="flex gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-border overflow-x-auto no-scrollbar">
                {[
                  { label: '昨日', key: 'yesterday' },
                  { label: '7天', key: 'last7' },
                  { label: '30天', key: 'last30' },
                  { label: '本月', key: 'thisMonth' },
                ].map(btn => (
                  <button
                    key={btn.key}
                    onClick={() => handleQuickDate(btn.key)}
                    className="whitespace-nowrap px-2 lg:px-3 py-1 text-[10px] font-medium rounded-lg hover:bg-white dark:hover:bg-white/5 text-text-muted hover:text-text transition-all"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> 代码位ID
                </label>
                <input
                  type="text"
                  className="block w-full rounded-xl border-border bg-black/5 dark:bg-white/5 py-2 px-3 text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none border transition-all text-[10px] lg:text-xs"
                  placeholder="输入代码位ID"
                  value={filters.codeSlotId}
                  onChange={e => setFilters({ ...filters, codeSlotId: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase flex items-center gap-1.5">
                  <Layout className="w-3 h-3" /> 代码位名称
                </label>
                <input
                  type="text"
                  className="block w-full rounded-xl border-border bg-black/5 dark:bg-white/5 py-2 px-3 text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none border transition-all text-[10px] lg:text-xs"
                  placeholder="输入名称关键词"
                  value={filters.codeSlotName}
                  onChange={e => setFilters({ ...filters, codeSlotName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase flex items-center gap-1.5">
                  <Terminal className="w-3 h-3" /> 终端类型
                </label>
                <Select
                  value={filters.terminal}
                  onChange={(val) => setFilters({ ...filters, terminal: val as string })}
                  options={[
                    { value: '全部', label: '全部终端' },
                    { value: 'H5', label: 'H5' },
                    { value: 'PC', label: 'PC' },
                    { value: 'App', label: 'App' }
                  ]}
                  size="sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase flex items-center gap-1.5">
                  <Activity className="w-3 h-3" /> 展现形式
                </label>
                <Select
                  value={filters.type}
                  onChange={(val) => setFilters({ ...filters, type: val as string })}
                  options={[
                    { value: '全部', label: '全部形式' },
                    { value: 'Banner', label: '固定块' },
                    { value: 'Interstitial', label: '插屏' },
                    { value: 'Native', label: '原生' }
                  ]}
                  size="sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 inline-flex justify-center items-center gap-2 rounded-xl bg-primary py-2 px-4 text-[10px] lg:text-xs font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
                >
                  <Search className="h-3.5 w-3.5" /> 查询
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 min-h-0 bg-card border border-border rounded-2xl flex flex-col backdrop-blur-md overflow-hidden">
        <div className="flex-1 overflow-auto min-h-0 rounded-t-2xl custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-black/5 dark:bg-white/5 backdrop-blur-md sticky top-0 z-20">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border">代码位ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border">代码位名称</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border text-right">展现量</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border text-right">点击量</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border text-right">点击率</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border text-right">eCPM</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border text-right">ACP</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border text-right">分成前收入</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border text-right">系数</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border text-right">分成后收入</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* List Rows */}
              {listData.map((row, idx) => (
                <tr key={idx} className="group hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">{row.codeSlotId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text">{row.codeSlotName || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted text-right">{(row.impressions || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted text-right">{(row.clicks || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted text-right">{((row.ctr || 0) * 100).toFixed(2)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted text-right">¥{(row.ecpm || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted text-right">¥{(row.acp || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted text-right">¥{(row.revenue || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted text-right">
                    {(row.ratio || 1.00).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary text-right">¥{row.afterSharingRevenue?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {listData.length === 0 && !loading && <EmptyState />}
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
               <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
               <p className="text-xs text-text-muted font-medium">数据加载中...</p>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 bg-black/5 dark:bg-white/5 p-4 border-t border-border rounded-b-2xl">
          <Pagination
            current={pagination.current}
            size={pagination.size}
            total={pagination.total}
            onPageChange={(page) => setPagination(prev => ({ ...prev, current: page }))}
            onSizeChange={(size) => setPagination(prev => ({ ...prev, size, current: 1 }))}
          />
        </div>
      </div>
    </div>
  );
}