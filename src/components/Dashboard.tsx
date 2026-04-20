import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Loader2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatCurrency, formatNumber } from '../lib/utils';
import { dbService } from '../services/dbService';
import { useAuth } from '../contexts/AuthContext';
import { Asset } from '../types';

const data = [
  { name: 'Jan', value: 45000 },
  { name: 'Fev', value: 48500 },
  { name: 'Mar', value: 47000 },
  { name: 'Abr', value: 52000 },
  { name: 'Mai', value: 55600 },
  { name: 'Jun', value: 58000 },
  { name: 'Jul', value: 62000 },
  { name: 'Ago', value: 66453 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 5000);

    const fetch = async () => {
      try {
        const data = await dbService.getAssets(user.uid);
        setAssets(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
    return () => clearTimeout(timeout);
  }, [user]);


  const totalEquity = assets.reduce((acc, asset) => acc + (asset.quantity * (asset.currentPrice || asset.averagePrice)), 0);
  
  const portfolioDistribution = [
    { name: 'Ações', value: Math.round((assets.filter(a => a.type === 'ACAO').length / assets.length * 100) || 0), color: '#10b981' }, // Emerald
    { name: 'FIIs', value: Math.round((assets.filter(a => a.type === 'FII').length / assets.length * 100) || 0), color: '#334155' }, // Slate 700
    { name: 'Renda Fixa', value: Math.round((assets.filter(a => a.type === 'RENDA_FIXA').length / assets.length * 100) || 0), color: '#64748b' }, // Slate 500
    { name: 'Outros', value: Math.round((assets.filter(a => !['ACAO', 'FII', 'RENDA_FIXA'].includes(a.type)).length / assets.length * 100) || 0), color: '#94a3b8' }, // Slate 400
  ].filter(p => p.value > 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Patrimônio Total" 
          value={totalEquity} 
          change={12.5} 
          icon={Wallet} 
          isPositive={true}
          color="emerald"
        />
        <MetricCard 
          title="Resultado (Mês)" 
          subValue="Swing Trade / Ações"
          value={totalEquity * 0.05} 
          change={8.2} 
          icon={TrendingUp} 
          isPositive={true}
          color="blue"
        />
        <MetricCard 
          title="Dividendos (Mês)" 
          subValue="Proventos Acumulados"
          value={totalEquity * 0.008} 
          change={-2.1} 
          icon={ArrowUpRight} 
          isPositive={false}
          color="slate"
        />
        <MetricCard 
          title="DARF Pendente" 
          subValue="Vencimento: 30/05"
          value={0} 
          change={0} 
          icon={PieChartIcon} 
          isPositive={true}
          danger={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Evolution Chart */}
        <div className="lg:col-span-8 glass-card rounded-[24px] p-8 premium-shadow">
          <div className="flex items-center justify-between mb-10">
            <div className="flex flex-col">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-display">Evolução do Patrimônio</h3>
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-none mt-1.5 opacity-70">Consolidado Multicorretora</span>
            </div>
            <select className="bg-slate-100/50 border border-slate-200/50 rounded-xl text-[10px] font-black px-4 py-2 text-slate-600 outline-none hover:bg-slate-100 transition-all uppercase tracking-wider">
              <option>Últimos 12 meses</option>
              <option>Todo o período</option>
            </select>
          </div>
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" strokeOpacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                  tickFormatter={(v) => `R$ ${v/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '16px', padding: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 900, color: '#0f172a', marginBottom: '8px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}
                  itemStyle={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}
                  formatter={(value: any) => [formatCurrency(value), 'Valor Total']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="lg:col-span-4 glass-card rounded-[24px] p-8 premium-shadow flex flex-col">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-display mb-10">Alocação Estratégica</h3>
          <div className="h-[240px] w-full relative flex-1">
            {portfolioDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                    animationBegin={500}
                    animationDuration={1500}
                  >
                    {portfolioDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 800 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Sem dados ativos</div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 leading-none">100%</span>
              <span className="text-[8px] text-emerald-500 uppercase font-black tracking-[0.3em] mt-1.5 opacity-80">Online</span>
            </div>
          </div>
          <div className="mt-10 space-y-3.5">
            {portfolioDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider group-hover:text-slate-800 transition-colors">{item.name}</span>
                </div>
                <span className="text-[12px] font-black text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, change, subValue, icon: Icon, isPositive, danger, color = 'emerald' }: any) {
  const colorClasses: any = {
    emerald: "border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-50/10",
    blue: "border-blue-500/20 hover:border-blue-500/40 bg-blue-50/10",
    slate: "border-slate-500/20 hover:border-slate-500/40 bg-slate-50/10",
  };

  return (
    <div className={cn(
      "glass-card rounded-[22px] p-5 premium-shadow group transition-all hover:-translate-y-1 relative overflow-hidden",
      danger ? "border-rose-500/30 hover:border-rose-500/50 bg-rose-50/20" : colorClasses[color]
    )}>
      <div className="bg-white/50 w-8 h-8 rounded-lg flex items-center justify-center mb-4 border border-white">
        <Icon className={cn(
          "transition-all group-hover:scale-110",
          danger ? "text-rose-500" : `text-${color}-500`
        )} size={16} />
      </div>

      <div className="flex flex-col space-y-1">
        <p className={cn(
          "text-[10px] uppercase font-black tracking-widest leading-none opacity-60",
          danger ? "text-rose-600" : "text-slate-500"
        )}>{title}</p>
        
        <div className="flex items-baseline gap-2">
          <h4 className={cn(
            "text-2xl font-black tracking-tight font-display",
            danger ? "text-rose-600" : "text-slate-900"
          )}>{formatCurrency(value)}</h4>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        {!danger ? (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter",
            isPositive ? "text-emerald-700 bg-emerald-500/10" : "text-rose-700 bg-rose-500/10"
          )}>
            {isPositive ? <ArrowUpRight size={10} strokeWidth={3} /> : <ArrowDownRight size={10} strokeWidth={3} />}
            {change}%
          </div>
        ) : (
          <span className="text-[10px] font-black text-rose-600 bg-rose-500/10 px-2 py-1 rounded-full uppercase tracking-widest animate-pulse">Ação Necessária</span>
        )}
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight opacity-50">{subValue || 'Real-time'}</span>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
