import { useEffect, useState } from 'react';
import api from '../api/client';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { format, subDays } from 'date-fns';
import { LayoutDashboard, TrendingUp, Wallet, Calendar, ArrowUpRight, MousePointer2, Eye, Target, Activity, Layout, Shield } from 'lucide-react';
import clsx from 'clsx';

interface DashboardStats {
  yesterdayRevenue: number;
  yesterdayAfterSharingRevenue: number;
  last7DaysRevenue: number;
  last7DaysAfterSharingRevenue: number;
  thisMonthRevenue: number;
  thisMonthAfterSharingRevenue: number;
  last7DaysAvgRevenue: number;
  activeCodeSlots: number;
  pendingAudit: number;
  avgCtr: number;
}

interface TrendData {
  date: string;
  impressions: number;
  clicks: number;
  revenue: number; // 分成前收入
  afterSharingRevenue: number; // 分成后收入
  ctr: number;
  ecpm: number;
  ratio?: number;
}

const METRICS = [
  { key: 'afterSharingRevenue', label: '分成后收入', icon: Wallet, color: '#3b82f6', bgColor: 'bg-blue-500/10', textColor: 'text-blue-500' },
  { key: 'revenue', label: '分成前收入', icon: Wallet, color: '#8b5cf6', bgColor: 'bg-violet-500/10', textColor: 'text-violet-500' },
  { key: 'impressions', label: '展现', icon: Eye, color: '#10b981', bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-500' },
  { key: 'clicks', label: '点击', icon: MousePointer2, color: '#f59e0b', bgColor: 'bg-amber-500/10', textColor: 'text-amber-500' },
  { key: 'ctr', label: '点击率', icon: Target, color: '#ec4899', bgColor: 'bg-pink-500/10', textColor: 'text-pink-500' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [activeMetric, setActiveMetric] = useState('afterSharingRevenue');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const startDate = format(subDays(today, 29), 'yyyy-MM-dd');
      const endDate = format(today, 'yyyy-MM-dd');

      const [statsRes, trendRes] = await Promise.all([
        api.get('/stats/dashboard'),
        api.get('/stats/trend', { params: { startDate, endDate } })
      ]);
      const rawStats = statsRes.data;
      
      // Jackson in backend uses SNAKE_CASE, map them to camelCase or use directly
      const processedStats: DashboardStats = {
        yesterdayRevenue: rawStats.yesterday_revenue || 0,
        yesterdayAfterSharingRevenue: rawStats.yesterday_after_sharing_revenue || 0,
        last7DaysRevenue: rawStats.last7_days_revenue || 0,
        last7DaysAfterSharingRevenue: rawStats.last7_days_after_sharing_revenue || 0,
        thisMonthRevenue: rawStats.this_month_revenue || 0,
        thisMonthAfterSharingRevenue: rawStats.this_month_after_sharing_revenue || 0,
        last7DaysAvgRevenue: rawStats.last7_days_avg_revenue || 0,
        activeCodeSlots: rawStats.active_code_slots || 0,
        pendingAudit: rawStats.pending_audit || 0,
        avgCtr: rawStats.avg_ctr || 0
      };
      
      setStats(processedStats);
      
      // Ensure frontend calculates afterSharingRevenue for trend if not already present
      const calculatedTrend = trendRes.data.map((item: any) => ({
        ...item,
        // Map snake_case to camelCase for TrendData interface
        impressions: item.impressions,
        clicks: item.clicks,
        revenue: item.revenue,
        ctr: item.ctr,
        ecpm: item.ecpm,
        afterSharingRevenue: item.after_sharing_revenue || (item.revenue * (item.ratio || 1.0))
      }));
      setTrendData(calculatedTrend);
    } catch (err) {
      console.error(err);
      toast.error('数据加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <p className="text-xs text-text-muted font-medium">数据加载中...</p>
    </div>
  );

  const activeMetricInfo = METRICS.find(m => m.key === activeMetric) || METRICS[0];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-0 lg:pr-2 space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-full overflow-x-hidden">
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="p-1.5 lg:p-2 bg-primary/10 rounded-lg">
            <LayoutDashboard className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text tracking-tight">总览</h1>
        </div>
        <p className="text-text-muted text-xs lg:text-sm ml-0 lg:ml-11 mt-1 lg:mt-0">
          欢迎回来，<span className="text-text font-medium">{user?.username}</span>。这里是您应用的最新表现数据。
        </p>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: '昨日分成后收入', value: stats?.yesterdayAfterSharingRevenue || 0, icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: '最近7天分成后收入', value: stats?.last7DaysAfterSharingRevenue || 0, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: '本月累计分成后收入', value: stats?.thisMonthAfterSharingRevenue || 0, icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: '最近7日日均预估', value: stats?.last7DaysAvgRevenue || 0, icon: ArrowUpRight, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((item, idx) => (
          <div key={idx} className="bg-card p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-border hover:border-primary/20 transition-all group relative overflow-hidden backdrop-blur-sm">
            <div className="relative z-10">
              <div className={clsx("w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center mb-3 lg:mb-4 transition-transform group-hover:scale-110 duration-300", item.bg)}>
                <item.icon className={clsx("w-5 h-5 lg:w-6 lg:h-6", item.color)} />
              </div>
              <p className="text-[10px] lg:text-xs font-bold text-text-muted uppercase tracking-wider mb-1">{item.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl lg:text-2xl font-bold text-text">¥{item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className={clsx("absolute -right-4 -bottom-4 w-20 h-20 lg:w-24 lg:h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500", item.bg)}></div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-card p-3 sm:p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-border flex flex-col backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 lg:mb-8 px-1 sm:px-0">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
              <h2 className="text-lg lg:text-xl font-bold text-text">趋势分析</h2>
            </div>
            <div className="flex flex-wrap bg-black/5 dark:bg-white/5 p-1 rounded-xl lg:rounded-2xl border border-border">
              {METRICS.map(m => (
                <button
                  key={m.key}
                  onClick={() => setActiveMetric(m.key)}
                  className={clsx(
                    "px-3 lg:px-4 py-1.5 rounded-lg lg:rounded-xl text-[10px] lg:text-xs font-bold flex items-center gap-1.5 lg:gap-2 border transition-all",
                    activeMetric === m.key 
                      ? clsx('bg-white dark:bg-primary/20 shadow-lg border-transparent', m.textColor)
                      : 'text-text-muted border-transparent hover:bg-black/5 dark:hover:bg-white/5 hover:text-text'
                  )}
                >
                  <m.icon className={clsx("w-3 h-3 lg:w-3.5 lg:h-3.5", activeMetric === m.key ? m.textColor : "text-text-muted/50")} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-64 lg:h-80 w-full -ml-4 sm:ml-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={trendData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={`colorMetric-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeMetricInfo.color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={activeMetricInfo.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-chart-grid)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                  dy={10}
                  minTickGap={30}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--color-tooltip-bg)', 
                    borderRadius: '16px', 
                    border: '1px solid var(--color-tooltip-border)',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: 'var(--color-tooltip-text)', fontSize: '12px', fontWeight: '600' }}
                  labelStyle={{ color: 'var(--color-text-muted)', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey={activeMetric} 
                  stroke={activeMetricInfo.color} 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill={`url(#colorMetric-${activeMetric})`}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 4, stroke: 'var(--color-card)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status/Insights Side Section */}
        <div className="space-y-6">
          <div className="bg-card p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-border flex-1 min-h-[220px] flex flex-col backdrop-blur-sm">
            <h3 className="text-xs lg:text-sm font-bold text-text mb-4 lg:mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent" />
              快速数据汇总
            </h3>
            <div className="space-y-3 lg:space-y-4">
              {[
                { label: '活跃代码位', value: stats?.activeCodeSlots || '0', color: 'text-blue-500', icon: Layout },
                { label: '待审核', value: stats?.pendingAudit || '0', color: 'text-amber-500', icon: Shield },
                { label: '平均点击率', value: `${((stats?.avgCtr || 0) * 100).toFixed(2)}%`, color: 'text-emerald-500', icon: Target },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between p-3 lg:p-4 bg-black/5 dark:bg-white/5 rounded-xl lg:rounded-2xl border border-border hover:border-primary/20 transition-colors group">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <stat.icon className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-text-muted group-hover:text-text transition-colors" />
                    <span className="text-xs lg:text-sm text-text-muted group-hover:text-text transition-colors">{stat.label}</span>
                  </div>
                  <span className={clsx("text-sm lg:text-base font-bold", stat.color)}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
