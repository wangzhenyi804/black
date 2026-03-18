import clsx from 'clsx';
import { endOfMonth, format, startOfMonth, startOfQuarter, subDays, subMonths } from 'date-fns';
import { Activity, DollarSign, Eye, Filter, Layout, MousePointer2, Search, Settings, Target, Terminal, TrendingUp, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis
} from 'recharts';
import api from '../api/client';
import Pagination from '../components/Pagination';
import Select from '../components/Select';

interface StatsTrend {
  date: string;
  impressions: number;
  clicks: number;
  revenue: number; // 分成前收入
  afterSharingRevenue: number; // 分成后收入
  ctr: number;
  ecpm: number;
  acp: number;
  ratio?: number;
}

interface StatsSummary {
  impressions: number;
  clicks: number;
  revenue: number; // 分成前收入
  afterSharingRevenue: number; // 分成后收入
  ctr: number;
  ecpm: number;
  acp: number;
  dailyAvgRevenue: number; // 日均分成后收入
  ratio?: number;
}

const METRICS = [
  { key: 'afterSharingRevenue', label: '分成后收入', color: '#8b5cf6', icon: DollarSign, bgColor: 'bg-violet-500/10', textColor: 'text-violet-500' },
  { key: 'revenue', label: '分成前收入', color: '#3b82f6', icon: Eye, bgColor: 'bg-blue-500/10', textColor: 'text-blue-500' },
  { key: 'impressions', label: '展现', color: '#10b981', icon: Activity, bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-500' },
  { key: 'clicks', label: '点击', color: '#f59e0b', icon: MousePointer2, bgColor: 'bg-amber-500/10', textColor: 'text-amber-500' },
  { key: 'ctr', label: '点击率', color: '#ec4899', icon: Target, bgColor: 'bg-pink-500/10', textColor: 'text-pink-500' },
  { key: 'ecpm', label: 'eCPM', color: '#ec4899', icon: Zap, bgColor: 'bg-pink-500/10', textColor: 'text-pink-500' },
  { key: 'acp', label: 'ACP', color: '#06b6d4', icon: Activity, bgColor: 'bg-cyan-500/10', textColor: 'text-cyan-500' },
];

const EmptyState = ({ message = "暂无数据" }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-border">
      <Activity className="w-8 h-8 text-text-muted" />
    </div>
    <p className="text-text-muted text-sm font-medium">{message}</p>
    <p className="text-text-muted/60 text-xs mt-1">尝试调整筛选条件或日期范围</p>
  </div>
);

export default function DataOverview() {
  // Filters
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [filters, setFilters] = useState({
    codeSlotId: '',
    codeSlotName: '',
    terminal: '全部',
    type: '全部'
  });

  // Data
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [trendData, setTrendData] = useState<StatsTrend[]>([]);
  const [listData, setListData] = useState<StatsTrend[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, size: 10, total: 0 });

  // Chart Config
  const [chartMetrics, setChartMetrics] = useState<string[]>(['impressions', 'revenue']);
  const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.size]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = {
        startDate: dateRange.start,
        endDate: dateRange.end,
        ...filters,
        page: pagination.current,
        size: pagination.size
      };
      // Clean params
      if (params.terminal === '全部') delete params.terminal;
      if (params.type === '全部') delete params.type;

      const [summaryRes, trendRes, listRes] = await Promise.all([
        api.get('/stats/summary', { params }),
        api.get('/stats/trend', { params }),
        api.get('/stats/list', { params })
      ]);

      const rawSummary = summaryRes.data;
      setSummary({
        ...rawSummary,
        impressions: rawSummary.impressions || 0,
        clicks: rawSummary.clicks || 0,
        revenue: rawSummary.revenue || 0,
        ctr: rawSummary.ctr || 0,
        ecpm: rawSummary.ecpm || 0,
        acp: rawSummary.acp || 0,
        dailyAvgRevenue: rawSummary.daily_avg_revenue || 0,
        afterSharingRevenue: rawSummary.after_sharing_revenue || (rawSummary.revenue * (rawSummary.ratio || 1.0))
      });

      setTrendData((trendRes.data || []).map((item: StatsTrend & { after_sharing_revenue?: number; ratio?: number }) => ({
        ...item,
        afterSharingRevenue: item.after_sharing_revenue || (item.revenue * (item.ratio || 1.0))
      })));

      setListData((listRes.data.records || []).map((item: StatsTrend & { after_sharing_revenue?: number; ratio?: number }) => ({
        ...item,
        afterSharingRevenue: item.after_sharing_revenue || (item.revenue * (item.ratio || 1.0))
      })));
      setPagination(prev => ({ ...prev, total: listRes.data.total || 0 }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchData();
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

  const toggleMetric = (key: string) => {
    if (chartMetrics.includes(key)) {
      if (chartMetrics.length > 1) {
        setChartMetrics(chartMetrics.filter(m => m !== key));
      }
    } else {
      if (chartMetrics.length < 2) {
        setChartMetrics([...chartMetrics, key]);
      }
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar pr-2 space-y-6">
      {/* Header & Date Filter */}
      <div className="flex-shrink-0 bg-card border border-border p-4 rounded-2xl space-y-4 backdrop-blur-md relative z-30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <div className="p-2 bg-primary/10 rounded-lg">
                <Filter className="w-4 h-4 text-primary" />
             </div>
             <h3 className="text-sm font-semibold text-text">数据报表</h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-black/5 dark:bg-white/5 border border-border rounded-xl px-3 py-1.5">
              <input
                type="date"
                className="bg-transparent border-none focus:ring-0 text-xs text-text w-28"
                value={dateRange.start}
                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
              />
              <span className="px-2 text-text-muted">至</span>
              <input
                type="date"
                className="bg-transparent border-none focus:ring-0 text-xs text-text w-28"
                value={dateRange.end}
                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <div className="flex gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-border">
              {[
                { label: '昨日', key: 'yesterday' },
                { label: '7天', key: 'last7' },
                { label: '30天', key: 'last30' },
                { label: '本月', key: 'thisMonth' },
              ].map(btn => (
                <button
                  key={btn.key}
                  onClick={() => handleQuickDate(btn.key)}
                  className="px-3 py-1 text-[10px] font-medium rounded-lg hover:bg-white dark:hover:bg-white/5 text-text-muted hover:text-text transition-all"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-muted uppercase flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> 代码位ID
            </label>
            <input
              type="text"
              className="block w-full rounded-xl border-border bg-black/5 dark:bg-white/5 py-2 px-3 text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none border transition-all text-xs"
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
              className="block w-full rounded-xl border-border bg-black/5 dark:bg-white/5 py-2 px-3 text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none border transition-all text-xs"
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
              onClick={handleSearch}
              className="flex-1 inline-flex justify-center items-center gap-2 rounded-xl bg-primary py-2 px-4 text-xs font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
              <Search className="h-3.5 w-3.5" /> 查询
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex-shrink-0 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {[
          { label: '分成后收入', value: '¥' + (summary?.afterSharingRevenue?.toFixed(2) || '0.00'), metric: METRICS[0] },
          { label: '分成前收入', value: '¥' + (summary?.revenue?.toFixed(2) || '0.00'), metric: METRICS[1] },
          { label: '展现', value: summary?.impressions?.toLocaleString() || 0, metric: METRICS[2] },
          { label: '点击', value: summary?.clicks?.toLocaleString() || 0, metric: METRICS[3] },
          { label: '点击率', value: (summary?.ctr ? (summary.ctr * 100).toFixed(2) : 0) + '%', metric: METRICS[4] },
          { label: 'eCPM', value: '¥' + (summary?.ecpm?.toFixed(2) || '0.00'), metric: METRICS[5] },
          { label: 'ACP', value: '¥' + (summary?.acp?.toFixed(2) || '0.00'), metric: METRICS[6] },
          { label: '日均收入', value: '¥' + (summary?.dailyAvgRevenue?.toFixed(2) || '0.00'), metric: { icon: TrendingUp, bgColor: 'bg-indigo-500/10', textColor: 'text-indigo-500' } },
        ].map((item, idx) => (
          <div key={idx} className="bg-card p-4 rounded-2xl border border-border backdrop-blur-sm group hover:border-primary/20 transition-all">
            <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center mb-3", item.metric.bgColor)}>
              <item.metric.icon className={clsx("w-4 h-4", item.metric.textColor)} />
            </div>
            <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">{item.label}</p>
            <p className="text-lg font-bold mt-1 text-text group-hover:text-primary transition-colors">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="flex-shrink-0 bg-card p-5 rounded-2xl border border-border h-[360px] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <h3 className="text-sm font-semibold text-text flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              趋势分析
            </h3>
            <div className="flex gap-4">
              {chartMetrics.map(key => {
                const m = METRICS.find(x => x.key === key);
                return <span key={key} className="text-[11px] text-text-muted flex items-center gap-2">
                  <span className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: m?.color }}></span>
                  {m?.label}
                </span>;
              })}
            </div>
          </div>
          <button
            onClick={() => setIsMetricModalOpen(true)}
            className="flex items-center gap-2 text-[10px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl hover:bg-primary/20 transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            指标配置
          </button>
        </div>
        
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                {chartMetrics.map(key => {
                   const m = METRICS.find(x => x.key === key);
                   return (
                     <linearGradient key={`grad-${key}`} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor={m?.color} stopOpacity={0.3}/>
                       <stop offset="95%" stopColor={m?.color} stopOpacity={0}/>
                     </linearGradient>
                   );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-chart-grid)" />
              <XAxis 
                dataKey="date" 
                fontSize={10} 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-text-muted)' }}
                dy={10}
              />
              <YAxis 
                yAxisId="left" 
                fontSize={10} 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-text-muted)' }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                fontSize={10} 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-text-muted)' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-tooltip-bg)', 
                  border: '1px solid var(--color-tooltip-border)', 
                  borderRadius: '12px', 
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                }}
                itemStyle={{ fontSize: '12px', color: 'var(--color-tooltip-text)' }}
              />
              {chartMetrics.map((key, index) => {
                const m = METRICS.find(x => x.key === key);
                return (
                  <Area 
                    key={key} 
                    yAxisId={index === 0 ? "left" : "right"} 
                    type="monotone" 
                    dataKey={key} 
                    name={m?.label} 
                    stroke={m?.color} 
                    fillOpacity={1}
                    fill={`url(#color-${key})`}
                    strokeWidth={2}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Metric Selection Modal */}
      {isMetricModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-text">指标对比配置</h3>
              <button onClick={() => setIsMetricModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <p className="text-xs text-text-muted mb-6">选择要在趋势图中对比的指标 (最多2项)</p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {METRICS.map(m => (
                <button 
                  key={m.key}
                  onClick={() => toggleMetric(m.key)}
                  disabled={!chartMetrics.includes(m.key) && chartMetrics.length >= 2}
                  className={clsx(
                    "flex items-center gap-3 p-3 rounded-2xl border transition-all text-left",
                    chartMetrics.includes(m.key) 
                      ? "bg-primary/10 border-primary/50 text-primary" 
                      : "bg-black/5 dark:bg-white/5 border-border text-text-muted hover:border-primary/30 disabled:opacity-50"
                  )}
                >
                  <m.icon className="w-4 h-4" />
                  <span className="text-xs font-semibold">{m.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsMetricModalOpen(false)}
              className="w-full py-3 text-sm font-bold text-white bg-primary rounded-2xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
            >
              应用配置
            </button>
          </div>
        </div>
      )}

      {/* Table Area */}
      <div className="flex-shrink-0 bg-card border border-border rounded-2xl flex flex-col backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black/5 dark:bg-white/5 backdrop-blur-md sticky top-0 z-20">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border">日期</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border">展现</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border">点击</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border">点击率</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border">eCPM</th>
                <th className="px-4 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border">ACP</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border">分成前收入</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border">分成后收入</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {listData.map((row, idx) => (
                <tr key={idx} className="group hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text">{row.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">{row.impressions.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">{row.clicks.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">{(row.ctr * 100).toFixed(2)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">¥{row.ecpm?.toFixed(2)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-text-muted">¥{row.acp?.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">¥{row.revenue?.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">¥{row.afterSharingRevenue?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {listData.length === 0 && !loading && <EmptyState />}
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
               <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
               <p className="text-xs text-text-muted font-medium">加载数据中...</p>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 bg-black/5 dark:bg-white/5 p-4 border-t border-border">
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